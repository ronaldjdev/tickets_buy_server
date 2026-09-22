import type { OptionsPag, Paginate } from "../../../../shared/types/types.js";

import type { Contact } from "../entities/Contact.entity.js";
export interface IContactRepository {
	create(data: Contact): Promise<Contact>;
	findById(id: string): Promise<Contact | null>;
	findByPhone(phone: string): Promise<Contact | null>;
	list(options: OptionsPag): Promise<IListContactsResponse>;
	update(id: string, data: Partial<Contact>): Promise<Contact | null>;
	delete(id: string): Promise<any>;

	/** Todos los contactos (sin paginación), ordenados por fecha de creación desc. */
	listAll(): Promise<ExportContact[]>;

	countAll(): Promise<number>;

	countNewThisMonth(): Promise<number>;
}

/** Contacto aplanado para exporte, con id y fecha de alta. */
export type ExportContact = Contact & { id: string; createdAt?: Date };

export interface IListContactsResponse {
	contacts: Contact[];
	paginate: Paginate;
}
