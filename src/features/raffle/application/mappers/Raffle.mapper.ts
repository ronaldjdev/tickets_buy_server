import { slugify } from "../../../../shared/utils/slugify.js";
import type {
	Raffle,
	RafflePrize,
	TicketIssuanceMode,
} from "../../domain/entities/Raffle.entity.js";

type RaffleDoc = {
	_id: string;
	slug?: string;
	title: string;
	description?: string;
	prizes?: RafflePrize[];
	startDate: Date;
	endDate: Date;
	ticketPrice: number;
	maxTickets: number;
	minTickets?: number;
	ticketIssuance?: TicketIssuanceMode;
	status: Raffle["status"];
	winnerTicketId?: string;
	createdAt?: Date;
	updatedAt?: Date;
};

export class RaffleMapper {
	static toDomain(doc: Record<string, unknown>): Raffle {
		const d = doc as unknown as RaffleDoc;
		const legacyPrize = (
			d as unknown as { prize?: { name: string; description?: string } }
		).prize;
		const prizes: RafflePrize[] =
			d.prizes ??
			(legacyPrize?.name
				? [
						{
							type: "mayor",
							name: legacyPrize.name,
							description: legacyPrize.description,
						},
					]
				: []);
		return {
			id: d._id.toString(),
			slug: d.slug ?? slugify(d.title),
			title: d.title,
			description: d.description,
			prizes,
			startDate: d.startDate,
			endDate: d.endDate,
			ticketPrice: d.ticketPrice,
			maxTickets: d.maxTickets,
			minTickets: d.minTickets,
			ticketIssuance: d.ticketIssuance ?? "random",
			status: d.status,
			winnerTicketId: d.winnerTicketId,
			createdAt: d.createdAt,
			updatedAt: d.updatedAt,
		};
	}

	static toPersistence(raffle: Raffle): Record<string, unknown> {
		return {
			_id: raffle.id,
			slug: raffle.slug,
			title: raffle.title,
			description: raffle.description,
			prizes: raffle.prizes,
			startDate: raffle.startDate,
			endDate: raffle.endDate,
			ticketPrice: raffle.ticketPrice,
			maxTickets: raffle.maxTickets,
			minTickets: raffle.minTickets,
			ticketIssuance: raffle.ticketIssuance ?? "random",
			status: raffle.status,
			winnerTicketId: raffle.winnerTicketId,
		};
	}
}
