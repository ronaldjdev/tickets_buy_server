import { TicketController } from "@/features/ticket/adapters/in/http/controllers/Ticket.controller";
import { TicketRepository } from "@/features/ticket/adapters/out/persistence/repositories/Ticket.repository";
import { TicketSharedService } from "@/features/ticket/adapters/out/shared/TicketSharedService";
import { BuyTickets } from "@/features/ticket/application/use-cases/BuyTickets.uc";
import type { IRaffleService } from "@/shared/contracts/raffle/IRaffleService.contract";
import type { ITicketService } from "@/shared/contracts/ticket/ITicketService.contract";
import { ListTickets } from "./application/use-cases/ListTickets.uc.js";
import { ManageAvailability } from "./application/use-cases/ManageAvailability.uc.js";

export function createTicketModule(raffleService: IRaffleService): {
	controller: TicketController;
	sharedService: ITicketService;
} {
	const ticketRepository = new TicketRepository();

	const buyTickets = new BuyTickets(raffleService, ticketRepository);
	const listTickets = new ListTickets(ticketRepository);
	const manageAvailability = new ManageAvailability(ticketRepository);

	const controller = new TicketController(
		buyTickets,
		listTickets,
		manageAvailability,
	);

	const sharedService = new TicketSharedService(ticketRepository);

	return { controller, sharedService };
}
