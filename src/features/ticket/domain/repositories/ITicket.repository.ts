import type { Ticket } from "../entities/Ticket.entity.js";

export interface ReserveTicketsData {
	buyerName?: string;
	buyerEmail?: string;
	buyerPhone?: string;
	purchaseId: string;
	reservedUntil: Date;
}

export interface ITicketRepository {
	findById(id: string): Promise<Ticket | null>;
	findByIds(ids: string[]): Promise<Ticket[]>;
	findByRaffle(raffleId: string): Promise<Ticket[]>;
	findByPurchaseId(purchaseId: string): Promise<Ticket[]>;
	findWinningTicket(raffleId: string): Promise<Ticket | null>;
	save(ticket: Ticket): Promise<Ticket>;
	saveMany(tickets: Ticket[]): Promise<Ticket[]>;
	reserveTickets(
		ticketIds: string[],
		data: ReserveTicketsData,
	): Promise<number>;
	markPurchasedByPurchaseId(purchaseId: string): Promise<number>;
	releaseExpiredReserved(until: Date): Promise<number>;
	deleteAvailableBeyond(raffleId: string, afterNumber: number): Promise<number>;
	deleteByRaffle(raffleId: string): Promise<number>;
}
