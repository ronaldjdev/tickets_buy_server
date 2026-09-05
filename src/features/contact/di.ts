import { ContactController } from "@/features/contact/adapters/in/http/controllers/Contact.controller.js";
import { ContactRepository } from "@/features/contact/adapters/out/persistence/repositories/Contact.repository.js";
import {
	CreateContact,
	DeleteContact,
	GetContact,
	ListContacts,
	UpdateContact,
} from "@/features/contact/application/use-cases/index.js";

const contactRepo = new ContactRepository();

const createContact = new CreateContact(contactRepo);
const getContact = new GetContact(contactRepo);
const listContacts = new ListContacts(contactRepo);
const updateContact = new UpdateContact(contactRepo);
const deleteContact = new DeleteContact(contactRepo);

export const contactController = new ContactController(
	createContact,
	getContact,
	listContacts,
	updateContact,
	deleteContact,
);
