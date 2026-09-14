import type { Ticket, TicketStatus } from "../entities/Ticket.entity.js";

export interface ReserveTicketsData {
	buyerName?: string;
	buyerLastName?: string;
	buyerEmail?: string;
	buyerPhone?: string;
	buyerDocumentType?: Ticket["buyerDocumentType"];
	buyerDocumentNumber?: string;
	buyerCountry?: string;
	buyerAddress?: string;
	purchaseId: string;
	reservedUntil: Date;
}

export interface ITicketRepository {
	findById(id: string): Promise<Ticket | null>;
	findByIds(ids: string[]): Promise<Ticket[]>;
	findByRaffle(raffleId: string, statuses?: TicketStatus[]): Promise<Ticket[]>;
	countByRaffle(raffleId: string, statuses: TicketStatus[]): Promise<number>;
	findNumbersByRaffle(raffleId: string): Promise<number[]>;
	findByPurchaseId(purchaseId: string): Promise<Ticket[]>;
	findByDocumentNumber(
		documentNumber: string,
		statuses?: TicketStatus[],
	): Promise<Ticket[]>;
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
