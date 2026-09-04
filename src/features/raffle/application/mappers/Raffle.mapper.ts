import type { Raffle } from "../../domain/entities/Raffle.entity.js";

type RaffleDoc = {
	_id: string;
	title: string;
	description?: string;
	prize: Raffle["prize"];
	startDate: Date;
	endDate: Date;
	ticketPrice: number;
	maxTickets: number;
	status: Raffle["status"];
	winnerTicketId?: string;
	createdAt?: Date;
	updatedAt?: Date;
};

export class RaffleMapper {
	static toDomain(doc: Record<string, unknown>): Raffle {
		const d = doc as unknown as RaffleDoc;
		return {
			id: d._id.toString(),
			title: d.title,
			description: d.description,
			prize: d.prize,
			startDate: d.startDate,
			endDate: d.endDate,
			ticketPrice: d.ticketPrice,
			maxTickets: d.maxTickets,
			status: d.status,
			winnerTicketId: d.winnerTicketId,
			createdAt: d.createdAt,
			updatedAt: d.updatedAt,
		};
	}

	static toPersistence(raffle: Raffle): Record<string, unknown> {
		return {
			_id: raffle.id,
			title: raffle.title,
			description: raffle.description,
			prize: raffle.prize,
			startDate: raffle.startDate,
			endDate: raffle.endDate,
			ticketPrice: raffle.ticketPrice,
			maxTickets: raffle.maxTickets,
			status: raffle.status,
			winnerTicketId: raffle.winnerTicketId,
		};
	}
}
