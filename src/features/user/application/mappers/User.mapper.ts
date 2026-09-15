import type { User } from "../../domain/entities/User.entity.js";

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
