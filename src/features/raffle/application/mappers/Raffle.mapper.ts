import { slugify } from "../../../../shared/utils/slugify.js";
import type {
	MachinePrizeConfig,
	Raffle,
	RaffleMachineConfig,
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
	machine?: RaffleMachineConfig;
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
			machine: d.machine
				? {
						prizes: (d.machine.prizes ?? []).map((p) => this.normalizePrize(p)),
					}
				: undefined,
			createdAt: d.createdAt,
			updatedAt: d.updatedAt,
		};
	}

	private static normalizePrize(prize: MachinePrizeConfig): MachinePrizeConfig {
		if (prize.kind === "seco") {
			return {
				kind: "seco",
				prizeType: prize.prizeType,
				winRate: prize.winRate,
			};
		}
		return {
			kind: "instant",
			id: prize.id,
			name: prize.name,
			description: prize.description,
			imageUrl: prize.imageUrl,
			stock: prize.stock,
			winRate: prize.winRate,
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
			machine: raffle.machine,
		};
	}
}
