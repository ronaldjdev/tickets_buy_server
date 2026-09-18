export type TicketStatus =
	| "available"
	| "reserved"
	| "purchased"
	| "winner"
	| "guaranteed";

export const SOLD_TICKET_STATUSES: TicketStatus[] = ["purchased", "winner"];

/** Estados que ocupan un número: no pueden reasignarse a otro comprador. */
export const ASSIGNED_TICKET_STATUSES: TicketStatus[] = [
	"reserved",
	"purchased",
	"winner",
	"guaranteed",
];

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
