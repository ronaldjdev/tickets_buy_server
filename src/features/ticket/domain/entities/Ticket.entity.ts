export type TicketStatus = "available" | "reserved" | "purchased" | "winner";

export interface Ticket {
	id: string;
	raffleId: string;
	number: number;
	buyerName?: string;
	buyerEmail?: string;
	buyerPhone?: string;
	purchaseId?: string;
	reservedUntil?: Date | null;
	status: TicketStatus;
	createdAt?: Date;
	updatedAt?: Date;
}
