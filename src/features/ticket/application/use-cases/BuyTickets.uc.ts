import { randomUUID } from "node:crypto";
import type { IRaffleService } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { TicketIssuanceMode } from "../../../raffle/domain/entities/Raffle.entity.js";
import { pickConsecutiveFreeNumbers } from "../../../../shared/utils/pickConsecutiveFreeNumbers.js";
import { pickRandomFreeNumbers } from "../../../../shared/utils/pickRandomFreeNumbers.js";
import type {
	Ticket,
	TicketStatus,
} from "../../domain/entities/Ticket.entity.js";
import {
	RaffleNotActiveError,
	RaffleNotFoundError,
	RaffleSoldOutError,
} from "../../domain/errors/Ticket.error.js";
import type { ITicketRepository } from "../../domain/repositories/ITicket.repository.js";

const ASSIGNED_STATUSES: TicketStatus[] = ["reserved", "purchased", "winner"];

export function pickFreeNumbers(
	existing: ReadonlySet<number>,
	maxNumber: number,
	count: number,
	mode?: TicketIssuanceMode,
): number[] {
	if (mode === "consecutive") {
		return pickConsecutiveFreeNumbers(existing, maxNumber, count);
	}
	return pickRandomFreeNumbers(existing, maxNumber, count);
}

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
		const numbers = pickFreeNumbers(
			existingNumbers,
			raffle.maxTickets,
			command.quantity,
			raffle.ticketIssuance,
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
