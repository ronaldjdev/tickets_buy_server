export type TicketStatus = "available" | "purchased" | "winner";

export interface Ticket {
	id: string;
	raffleId: string;
	number: number;
	buyerName?: string;
	buyerEmail?: string;
	status: TicketStatus;
	createdAt?: Date;
	updatedAt?: Date;
}
