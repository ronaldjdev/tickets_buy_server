import type { IRaffleService } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import type { Ticket } from "../../domain/entities/Ticket.entity.js";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
} from "../../domain/errors/Ticket.error.js";
import type { ITicketRepository } from "../../domain/repositories/ITicket.repository.js";

export interface BuyTicketsCommand {
	raffleId: string;
	quantity: number;
	buyerName?: string;
	buyerEmail?: string;
}

export class BuyTickets {
	constructor(
		private readonly raffleService: IRaffleService,
		private readonly ticketRepository: ITicketRepository,
	) {}

	async execute(command: BuyTicketsCommand): Promise<Ticket[]> {
		const raffle = await this.raffleService.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);
		if (raffle.status !== "active")
			throw new RaffleNotActiveError(command.raffleId);

		const tickets = await this.ticketRepository.findByRaffle(command.raffleId);
		const available = tickets.filter((t) => t.status === "available");
		if (available.length < command.quantity)
			throw new RaffleSoldOutError(command.raffleId);

		const toPurchase = available.slice(0, command.quantity).map((t) => ({
			...t,
			buyerName: command.buyerName,
			buyerEmail: command.buyerEmail,
			status: "purchased" as const,
		}));

		const purchased: Ticket[] = [];
		for (const ticket of toPurchase) {
			purchased.push(await this.ticketRepository.save(ticket));
		}
		return purchased;
	}
}
