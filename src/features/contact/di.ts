import { appLogger } from "../../platform/di/Logger.di.js";
import type { IRaffleService } from "../../shared/contracts/raffle/IRaffleService.contract.js";
import type { ILogger } from "../../shared/port/ILogger.port.js";
import { GatewayIntentRepository } from "../gateway/adapters/out/persistence/repositories/GatewayIntent.repository.js";
import { TicketRepository } from "../ticket/adapters/out/persistence/repositories/Ticket.repository.js";
import { ContactController } from "./adapters/in/http/controllers/Contact.controller.js";
import { ContactRepository } from "./adapters/out/persistence/repositories/Contact.repository.js";
import {
	CreateContact,
	DeleteContact,
	GetContact,
	ListContacts,
	UpdateContact,
} from "./application/use-cases/index.js";

export function createContactModule(deps: {
	raffleService: IRaffleService;
	appLogger?: ILogger;
}): {
	controller: ContactController;
} {
	const contactRepo = new ContactRepository();
	const intentRepo = new GatewayIntentRepository();
	const ticketRepo = new TicketRepository();
	const logger = deps.appLogger ?? appLogger;

	const createContact = new CreateContact(contactRepo, logger);
	const getContact = new GetContact(
		contactRepo,
		intentRepo,
		ticketRepo,
		deps.raffleService,
	);
	const listContacts = new ListContacts(contactRepo);
	const updateContact = new UpdateContact(contactRepo, logger);
	const deleteContact = new DeleteContact(contactRepo, logger);

	const controller = new ContactController(
		createContact,
		getContact,
		listContacts,
		updateContact,
		deleteContact,
	);

	return { controller };
}
