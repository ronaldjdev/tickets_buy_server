import type { SortOrder } from "mongoose";
import UserModel from "@/features/user/adapters/out/persistence/schemas/User.schema.js";
import { UserMapper } from "@/features/user/application/mappers/User.mapper.js";
import type { User } from "@/features/user/domain/entities/User.entity.js";
import type {
	IListUsersResponse,
	IUserRepository,
} from "@/features/user/domain/repositories/IUser.repository.js";
import { QueryFactory } from "@/infra/mongodb/Query.factory.js";
import type { OptionsPag } from "@/shared/types/types.js";

export class UserRepository implements IUserRepository {
	async create(data: User): Promise<User> {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...rest } = data as User;
		const newUser = await UserModel.findOneAndUpdate(
			{ userId: data.userId },
			{ $set: UserMapper.toPersistence({ ...rest }) },
			{ new: true, upsert: true, runValidators: true },
		).lean();
		return UserMapper.toDomain(newUser as User);
	}

	async update(id: string, data: Partial<User>): Promise<User | null> {
		const user = await UserModel.findOneAndUpdate({ _id: id }, data, {
			new: true,
		});
		return user ? UserMapper.toDomain(user as any) : null;
	}

	async findById(id: string): Promise<User | null> {
		const doc = await UserModel.findOne({ _id: id }).lean();
		return doc ? UserMapper.toDomain(doc as any) : null;
	}

	async findByUserId(userId: string): Promise<User | null> {
		const doc = await UserModel.findOne({ userId }).lean();
		return doc ? UserMapper.toDomain(doc as any) : null;
	}

	async list(options: OptionsPag): Promise<IListUsersResponse> {
		const query = QueryFactory.assembleQueryOptions(options);
		const sortOptions = QueryFactory.createSortOptions();
		const skip = (options.page - 1) * options.limit;

		const docs = await UserModel.find(query)
			.sort(sortOptions as { [key: string]: SortOrder })
			.skip(skip)
			.limit(options.limit)
			.lean();

		const total = await UserModel.countDocuments(query);

		return {
			users: docs.map((d) => UserMapper.toDomain(d as any)),
			paginate: {
				total,
				page: options.page,
				limit: options.limit,
				totalPages: Math.ceil(total / options.limit),
				hasNextPage: options.page * options.limit < total,
				hasPrevPage: options.page > 1,
			},
		};
	}

	async delete(id: string): Promise<any> {
		return await UserModel.deleteOne({ _id: id });
	}

	async count(): Promise<number> {
		return UserModel.countDocuments();
	}

	async findActive(): Promise<User[]> {
		const docs = await UserModel.find({ status: "active" })
			.select("userId")
			.lean();
		return docs.map((d) => UserMapper.toDomain(d as any));
	}
}
