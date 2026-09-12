import { ComboRepository } from "@/features/combo/adapters/out/persistence/repositories/Combo.repository.js";
import { ContactRepository } from "@/features/contact/adapters/out/persistence/repositories/Contact.repository.js";
import type { GetPublicIntent } from "@/features/gateway/application/use-cases/GetPublicIntent.uc.js";
import type { NotificationService } from "@/features/notification/application/services/NotificationService.js";
import { PurchaseController } from "@/features/ticket/adapters/in/http/controllers/Purchase.controller.js";
import { TicketController } from "@/features/ticket/adapters/in/http/controllers/Ticket.controller";
import { EmailTicketConfirmationNotifier } from "@/features/ticket/adapters/out/notifiers/EmailTicketConfirmation.notifier.js";
import { TicketRepository } from "@/features/ticket/adapters/out/persistence/repositories/Ticket.repository";
import { TicketSharedService } from "@/features/ticket/adapters/out/shared/TicketSharedService";
import { BuyTickets } from "@/features/ticket/application/use-cases/BuyTickets.uc";
import { ConfirmTicketPayment } from "@/features/ticket/application/use-cases/ConfirmTicketPayment.uc.js";
import { CreatePurchase } from "@/features/ticket/application/use-cases/CreatePurchase.uc.js";
import { appLogger } from "@/platform/di/Logger.di.js";
import type { IGatewayLinkCreator } from "@/shared/contracts/IGatewayLinkCreator.contract.js";
import type { IRaffleService } from "@/shared/contracts/raffle/IRaffleService.contract";
import type { ITicketService } from "@/shared/contracts/ticket/ITicketService.contract";
import type { ILogger } from "@/shared/port/ILogger.port.js";
import { ListTickets } from "./application/use-cases/ListTickets.uc.js";
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

	const controller = new TicketController(
		buyTickets,
		listTickets,
		manageAvailability,
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
