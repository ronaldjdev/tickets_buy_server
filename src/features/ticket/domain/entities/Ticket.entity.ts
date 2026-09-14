export type TicketStatus = "available" | "reserved" | "purchased" | "winner";

export type TicketDocumentType = "cc" | "ce" | "pasaporte";

export interface Ticket {
	id: string;
	raffleId: string;
	number: number;
	buyerName?: string;
	buyerLastName?: string;
	buyerEmail?: string;
	buyerPhone?: string;
	buyerDocumentType?: TicketDocumentType;
	buyerDocumentNumber?: string;
	buyerCountry?: string;
	buyerAddress?: string;
	purchaseId?: string;
	reservedUntil?: Date | null;
	status: TicketStatus;
	createdAt?: Date;
	updatedAt?: Date;
}
