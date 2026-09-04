import { randomUUID } from "node:crypto";
import type {
	ITicketService,
	TicketPayload,
} from "../../../../../shared/contracts/ticket/ITicketService.contract.js";
import { TicketNotFoundError } from "../../../domain/errors/Ticket.error.js";
import type { ITicketRepository } from "../../../domain/repositories/ITicket.repository.js";

export class TicketSharedService implements ITicketService {
	constructor(private readonly ticketRepository: ITicketRepository) {}

	async listTickets(raffleId: string): Promise<TicketPayload[]> {
		const tickets = await this.ticketRepository.findByRaffle(raffleId);
		return tickets.map((t) => this.toPayload(t));
	}

	async findByRaffle(raffleId: string): Promise<TicketPayload[]> {
		return this.listTickets(raffleId);
	}

	async markAsWinner(ticketId: string): Promise<TicketPayload> {
		const ticket = await this.ticketRepository.findById(ticketId);
		if (!ticket) throw new TicketNotFoundError(ticketId);
		const winner = await this.ticketRepository.save({
			...ticket,
			status: "winner",
		});
		return this.toPayload(winner);
	}

	async createAvailableTickets(
		raffleId: string,
		count: number,
	): Promise<TicketPayload[]> {
		const docs = await this.ticketRepository.saveMany(
			Array.from({ length: count }, (_, i) => ({
				id: randomUUID(),
				raffleId,
				number: i + 1,
				status: "available" as const,
			})),
		);
		return docs.map((t) => this.toPayload(t));
	}

	private toPayload(ticket: {
		id: string;
		raffleId: string;
		number: number;
		buyerName?: string;
		buyerEmail?: string;
		status: "available" | "purchased" | "winner";
	}): TicketPayload {
		return {
			id: ticket.id,
			raffleId: ticket.raffleId,
			number: ticket.number,
			buyerName: ticket.buyerName,
			buyerEmail: ticket.buyerEmail,
			status: ticket.status,
		};
	}
}
