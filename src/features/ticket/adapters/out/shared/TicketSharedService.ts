import type {
	ITicketService,
	TicketPayload,
} from "../../../../../shared/contracts/ticket/ITicketService.contract.js";
import type { Ticket } from "../../../domain/entities/Ticket.entity.js";
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

	async releaseAvailableBeyond(
		raffleId: string,
		count: number,
	): Promise<number> {
		return this.ticketRepository.deleteAvailableBeyond(raffleId, count);
	}

	async deleteByRaffle(raffleId: string): Promise<number> {
		return this.ticketRepository.deleteByRaffle(raffleId);
	}

	private toPayload(ticket: Ticket): TicketPayload {
		return {
			id: ticket.id,
			raffleId: ticket.raffleId,
			number: ticket.number,
			buyerName: ticket.buyerName,
			buyerEmail: ticket.buyerEmail,
			buyerPhone: ticket.buyerPhone,
			purchaseId: ticket.purchaseId,
			reservedUntil: ticket.reservedUntil,
			status: ticket.status,
		};
	}
}
