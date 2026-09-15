import type { Ticket } from "../../domain/entities/Ticket.entity.js";

type TicketDoc = {
	_id: string;
	raffleId: string;
	number: number;
	buyerName?: string;
	buyerLastName?: string;
	buyerEmail?: string;
	buyerPhone?: string;
	buyerDocumentType?: Ticket["buyerDocumentType"];
	buyerDocumentNumber?: string;
	buyerCountry?: string;
	buyerAddress?: string;
	purchaseId?: string;
	reservedUntil?: Date | null;
	status: Ticket["status"];
	createdAt?: Date;
	updatedAt?: Date;
};

export class TicketMapper {
	static toDomain(doc: Record<string, unknown>): Ticket {
		const d = doc as unknown as TicketDoc;
		return {
			id: d._id.toString(),
			raffleId: d.raffleId,
			number: d.number,
			buyerName: d.buyerName,
			buyerLastName: d.buyerLastName,
			buyerEmail: d.buyerEmail,
			buyerPhone: d.buyerPhone,
			buyerDocumentType: d.buyerDocumentType as Ticket["buyerDocumentType"],
			buyerDocumentNumber: d.buyerDocumentNumber,
			buyerCountry: d.buyerCountry,
			buyerAddress: d.buyerAddress,
			purchaseId: d.purchaseId,
			reservedUntil: d.reservedUntil,
			status: d.status,
			createdAt: d.createdAt,
			updatedAt: d.updatedAt,
		};
	}

	static toPersistence(ticket: Ticket): Record<string, unknown> {
		return {
			_id: ticket.id,
			raffleId: ticket.raffleId,
			number: ticket.number,
			buyerName: ticket.buyerName,
			buyerLastName: ticket.buyerLastName,
			buyerEmail: ticket.buyerEmail,
			buyerPhone: ticket.buyerPhone,
			buyerDocumentType: ticket.buyerDocumentType,
			buyerDocumentNumber: ticket.buyerDocumentNumber,
			buyerCountry: ticket.buyerCountry,
			buyerAddress: ticket.buyerAddress,
			purchaseId: ticket.purchaseId,
			reservedUntil: ticket.reservedUntil,
			status: ticket.status,
		};
	}
}
