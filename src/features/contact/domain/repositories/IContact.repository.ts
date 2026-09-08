import type { OptionsPag, Paginate } from "@/shared/types/types.js";

import type { Contact } from "../entities/Contact.entity.js";
export interface IContactRepository {
	create(data: Contact): Promise<Contact>;
	findById(id: string): Promise<Contact | null>;
	findByPhone(phone: string): Promise<Contact | null>;
	list(options: OptionsPag): Promise<IListContactsResponse>;
	update(id: string, data: Partial<Contact>): Promise<Contact | null>;
	delete(id: string): Promise<any>;

	countAll(): Promise<number>;

	countNewThisMonth(): Promise<number>;
}

export interface IListContactsResponse {
	contacts: Contact[];
	paginate: Paginate;
}
