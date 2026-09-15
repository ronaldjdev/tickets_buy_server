import { appLogger } from "../../platform/di/Logger.di.js";
import type { IGatewayLinkCreator } from "../../shared/contracts/IGatewayLinkCreator.contract.js";
import type { IRaffleService } from "../../shared/contracts/raffle/IRaffleService.contract.js";
import type { ITicketService } from "../../shared/contracts/ticket/ITicketService.contract.js";
import type { ILogger } from "../../shared/port/ILogger.port.js";
import { ComboRepository } from "../combo/adapters/out/persistence/repositories/Combo.repository.js";
import { ContactRepository } from "../contact/adapters/out/persistence/repositories/Contact.repository.js";
import type { GetPublicIntent } from "../gateway/application/use-cases/GetPublicIntent.uc.js";
import type { NotificationService } from "../notification/application/services/NotificationService.js";
import { PurchaseController } from "./adapters/in/http/controllers/Purchase.controller.js";
import { TicketController } from "./adapters/in/http/controllers/Ticket.controller.js";
import { EmailTicketConfirmationNotifier } from "./adapters/out/notifiers/EmailTicketConfirmation.notifier.js";
import { TicketRepository } from "./adapters/out/persistence/repositories/Ticket.repository.js";
import { TicketSharedService } from "./adapters/out/shared/TicketSharedService.js";
import { BuyTickets } from "./application/use-cases/BuyTickets.uc.js";
import { ConfirmTicketPayment } from "./application/use-cases/ConfirmTicketPayment.uc.js";
import { CreatePurchase } from "./application/use-cases/CreatePurchase.uc.js";
import { ListTickets } from "./application/use-cases/ListTickets.uc.js";
import { LookupTicketsByDocument } from "./application/use-cases/LookupTicketsByDocument.uc.js";
import { ManageAvailability } from "./application/use-cases/ManageAvailability.uc.js";

export function createTicketModule(
	raffleService: IRaffleService,
	logger: ILogger = appLogger,
): {
	controller: TicketController;
	sharedService: ITicketService;
} {
	const ticketRepository = new TicketRepository();

	const buyTickets = new BuyTickets(raffleService, ticketRepository, logger);
	const listTickets = new ListTickets(ticketRepository);
	const manageAvailability = new ManageAvailability(ticketRepository, logger);
	const lookupTicketsByDocument = new LookupTicketsByDocument(
		ticketRepository,
		raffleService,
	);

	const controller = new TicketController(
		buyTickets,
		listTickets,
		manageAvailability,
		lookupTicketsByDocument,
	);

	const sharedService = new TicketSharedService(ticketRepository);

	return { controller, sharedService };
}

export function createTicketPurchaseModule(deps: {
	raffleService: IRaffleService;
	linkCreator: IGatewayLinkCreator;
	getIntent: GetPublicIntent;
	notificationService?: NotificationService;
}): {
	controller: PurchaseController;
	confirmTicketPayment: ConfirmTicketPayment;
} {
	const ticketRepository = new TicketRepository();
	const contactRepository = new ContactRepository();
	const comboRepository = new ComboRepository();

	const createPurchase = new CreatePurchase(
		deps.raffleService,
		ticketRepository,
		deps.linkCreator,
		contactRepository,
		comboRepository,
		appLogger,
	);
	const confirmTicketPayment = new ConfirmTicketPayment(
		deps.raffleService,
		ticketRepository,
		new EmailTicketConfirmationNotifier(),
		deps.notificationService,
		appLogger,
	);

	const controller = new PurchaseController(createPurchase, deps.getIntent);

	return { controller, confirmTicketPayment };
}
