import type { Ticket } from "@/features/ticket/domain/entities/Ticket.entity";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
} from "@/features/ticket/domain/errors/Ticket.error";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository";
import type { IRaffleService } from "@/shared/contracts/raffle/IRaffleService.contract";
import type { ILogger } from "@/shared/port/ILogger.port.js";

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
		private readonly logger: ILogger,
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

		this.logger.info("Boletos comprados", {
			operation: "ticket.buy",
			raffleId: command.raffleId,
			quantity: purchased.length,
			numbers: purchased.map((t) => t.number).sort((a, b) => a - b),
			buyerName: command.buyerName,
			buyerEmail: command.buyerEmail,
		});

		return purchased;
	}
}
