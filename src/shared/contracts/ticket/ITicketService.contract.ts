export type TicketStatus = "available" | "purchased" | "winner";

export interface TicketPayload {
	id: string;
	raffleId: string;
	number: number;
	buyerName?: string;
	buyerEmail?: string;
	status: TicketStatus;
}

export interface ITicketService {
	listTickets(raffleId: string): Promise<TicketPayload[]>;
	findByRaffle(raffleId: string): Promise<TicketPayload[]>;
	markAsWinner(ticketId: string): Promise<TicketPayload>;
	createAvailableTickets(
		raffleId: string,
		count: number,
	): Promise<TicketPayload[]>;
}
