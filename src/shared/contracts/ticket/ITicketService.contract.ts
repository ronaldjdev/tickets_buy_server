import type { TicketStatus } from "../../../features/ticket/domain/entities/Ticket.entity.js";

export type { TicketStatus };

export interface TicketPayload {
	id: string;
	raffleId: string;
	number: number;
	buyerName?: string;
	buyerEmail?: string;
	buyerPhone?: string;
	purchaseId?: string;
	reservedUntil?: Date | null;
	status: TicketStatus;
}

export interface ITicketService {
	listTickets(raffleId: string): Promise<TicketPayload[]>;
	findByRaffle(raffleId: string): Promise<TicketPayload[]>;
	markAsWinner(ticketId: string): Promise<TicketPayload>;
	releaseAvailableBeyond(raffleId: string, count: number): Promise<number>;
	deleteByRaffle(raffleId: string): Promise<number>;
}
