import type { OptionsPag, Paginate } from "../../../../shared/types/types.js";

import type { User } from "../entities/User.entity.js";
export interface IUserRepository {
	create(data: User): Promise<User>;
	findById(uid: string): Promise<User | null>;
	findByUserId(userId: string): Promise<User | null>;
	findActive(): Promise<User[]>;
	list(options: OptionsPag): Promise<IListUsersResponse>;
	update(uid: string, data: Partial<User>): Promise<User | null>;
	delete(uid: string): Promise<any>;
	count(): Promise<number>;
}

export interface IListUsersResponse {
	users: User[];
	paginate: Paginate;
}
