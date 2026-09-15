import type { Contact } from "../../domain/entities/Contact.entity.js";

export const ContactMapper = {
	toDomain(doc: Contact): Contact {
		return {
			...doc,
		} as Contact;
	},

	toPersistence(contact: Contact): Partial<Contact> {
		return {
			...contact,
		};
	},
};
