import { QueryFactory } from "../../../../../../infra/mongodb/Query.factory.js";
import type { OptionsPag } from "../../../../../../shared/types/types.js";
import { ContactMapper } from "../../../../application/mappers/Contact.mapper.js";
import type { Contact } from "../../../../domain/entities/Contact.entity.js";
import type {
	IContactRepository,
	IListContactsResponse,
} from "../../../../domain/repositories/IContact.repository.js";
import ContactModel from "../schemas/Contact.schema.js";

const CONTACT_SEARCH_FIELDS = ["name", "email", "phone"];

export class ContactRepository implements IContactRepository {
	async create(data: Contact): Promise<Contact> {
		const filter = data.phone ? { phone: data.phone } : { email: data.email };
		const newContact = await ContactModel.findOneAndUpdate(
			filter,
			{ $set: ContactMapper.toPersistence({ ...data }) },
			{ new: true, upsert: true, runValidators: true },
		).lean();
		return ContactMapper.toDomain(newContact as Contact);
	}

	async update(id: string, data: Partial<Contact>): Promise<Contact | null> {
		const user = await ContactModel.findOneAndUpdate({ _id: id }, data, {
			new: true,
			runValidators: true,
		});
		return user ? ContactMapper.toDomain(user as any) : null;
	}

	async findById(id: string): Promise<Contact | null> {
		const doc = await ContactModel.findOne({ _id: id }).lean();
		return doc ? ContactMapper.toDomain(doc as any) : null;
	}

	async findByPhone(phone: string): Promise<Contact | null> {
		const digits = phone.replace(/\D/g, "");
		const normalized = digits.startsWith("57") ? digits.slice(2) : digits;
		const doc = await ContactModel.findOne({
			phone: { $regex: `${normalized}$` },
		}).lean();
		return doc ? ContactMapper.toDomain(doc as any) : null;
	}

	async list(options: OptionsPag): Promise<IListContactsResponse> {
		const query = QueryFactory.assembleQueryOptions(options);
		const search = QueryFactory.createSearchQuery(
			CONTACT_SEARCH_FIELDS,
			options.q,
		);
		if (search) Object.assign(query, search);
		const sortOptions = QueryFactory.createSortOptions();
		const skip = (options.page - 1) * options.limit;

		const docs = await ContactModel.find(query)
			.sort(sortOptions)
			.skip(skip)
			.limit(options.limit)
			.lean();
		const total = await ContactModel.countDocuments(query);

		return {
			contacts: docs.map((d) => ContactMapper.toDomain(d as any)),
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
		return await ContactModel.deleteOne({ _id: id });
	}

	async countAll(): Promise<number> {
		return ContactModel.countDocuments();
	}

	async countNewThisMonth(): Promise<number> {
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);
		return ContactModel.countDocuments({ createdAt: { $gte: startOfMonth } });
	}
}
