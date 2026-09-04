import type { Ticket } from "@/features/ticket/domain/entities/Ticket.entity";

type TicketDoc = {
	_id: string;
	raffleId: string;
	number: number;
	buyerName?: string;
	buyerEmail?: string;
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
			buyerEmail: d.buyerEmail,
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
			buyerEmail: ticket.buyerEmail,
			status: ticket.status,
		};
	}
}
