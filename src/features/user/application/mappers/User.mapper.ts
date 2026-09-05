import type { User } from "@/features/user/domain/entities/User.entity.js";

export const UserMapper = {
	toDomain(doc: User): User {
		return {
			...doc,
		} as User;
	},

	toPersistence(user: User): Partial<User> {
		return {
			...user,
		};
	},
};
