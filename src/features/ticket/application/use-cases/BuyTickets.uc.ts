import { randomUUID } from "node:crypto";
import type {
	Ticket,
	TicketStatus,
} from "@/features/ticket/domain/entities/Ticket.entity";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
} from "@/features/ticket/domain/errors/Ticket.error";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository";
import type { IRaffleService } from "@/shared/contracts/raffle/IRaffleService.contract";
import type { ILogger } from "@/shared/port/ILogger.port.js";
import { pickRandomFreeNumbers } from "@/shared/utils/pickRandomFreeNumbers";

const ASSIGNED_STATUSES: TicketStatus[] = ["reserved", "purchased", "winner"];

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

		const assigned = await this.ticketRepository.countByRaffle(
			command.raffleId,
			ASSIGNED_STATUSES,
		);
		if (assigned + command.quantity > raffle.maxTickets)
			throw new RaffleSoldOutError(command.raffleId);

		const existingNumbers = new Set(
			await this.ticketRepository.findNumbersByRaffle(command.raffleId),
		);
		const numbers = pickRandomFreeNumbers(
			existingNumbers,
			raffle.maxTickets,
			command.quantity,
		);
		if (numbers.length < command.quantity)
			throw new RaffleSoldOutError(command.raffleId);

		const purchased = await this.ticketRepository.saveMany(
			numbers.map((number) => ({
				id: randomUUID(),
				raffleId: command.raffleId,
				number,
				status: "purchased" as const,
				buyerName: command.buyerName,
				buyerEmail: command.buyerEmail,
			})),
		);

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
