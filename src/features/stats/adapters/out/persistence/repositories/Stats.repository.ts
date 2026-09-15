import type { Model } from "mongoose";

import ContactModel from "../../../../../contact/adapters/out/persistence/schemas/Contact.schema.js";
import GatewayIntentModel from "../../../../../gateway/adapters/out/persistence/schemas/GatewayIntent.schema.js";
import RaffleModel from "../../../../../raffle/adapters/out/persistence/schemas/Raffle.schema.js";
import TicketModel from "../../../../../ticket/adapters/out/persistence/schemas/Ticket.schema.js";
import UserModel from "../../../../../user/adapters/out/persistence/schemas/User.schema.js";
import type {
	DashboardStats,
	RafflePerformance,
	SalesPoint,
} from "../../../../domain/entities/DashboardStats.entity.js";
import type { IStatsRepository } from "../../../../domain/repositories/IStats.repository.js";

const SOLD_TICKET_STATUSES = ["purchased", "winner"] as const;

type CountRow = { _id: string; count: number };

export class StatsRepository implements IStatsRepository {
	async getDashboardStats(): Promise<DashboardStats> {
		const [raffles, tickets, users, contacts, salesByDay] = await Promise.all([
			this.countByStatus(RaffleModel, "status"),
			this.countByStatus(TicketModel, "status"),
			this.countByStatus(UserModel, "status"),
			ContactModel.countDocuments(),
			this.salesByDay(),
		]);

		const payments = (await GatewayIntentModel.aggregate<CountRow>([
			{ $group: { _id: "$status", count: { $sum: 1 } } },
		])) as CountRow[];
		const revenue = (await GatewayIntentModel.aggregate<{ total: number }>([
			{ $match: { status: "pagada" } },
			{ $group: { _id: null, total: { $sum: "$amountInCents" } } },
		])) as { total: number }[];

		const totalCents = revenue[0]?.total ?? 0;

		const [rafflePerformance, recentPaymentDocs] = await Promise.all([
			this.rafflePerformance(),
			GatewayIntentModel.find({ status: "pagada" })
				.sort({ createdAt: -1 })
				.limit(8)
				.lean(),
		]);

		return {
			summary: {
				raffles: this.summaryRaffles(raffles),
				tickets: this.summaryTickets(tickets),
				revenue: { totalCents },
				users: this.summaryUsers(users),
				contacts: { total: contacts },
				payments: this.summaryPayments(
					new Map(payments.map((p) => [p._id as string, p.count])),
				),
			},
			salesByDay,
			rafflePerformance,
			recentPayments: recentPaymentDocs.map((p) => ({
				reference: p.reference,
				amountInCents: p.amountInCents,
				currency: p.currency,
				customerEmail: p.customerEmail,
				contactName: p.contactName,
				paymentMethodType: p.paymentMethodType,
				createdAt: p.createdAt,
			})),
		};
	}

	private async countByStatus<TModel extends Model<any>>(
		model: TModel,
		field: string,
	): Promise<CountRow[]> {
		return (await model.aggregate<CountRow>([
			{ $group: { _id: `$${field}`, count: { $sum: 1 } } },
		])) as CountRow[];
	}

	private summaryRaffles(rows: CountRow[]) {
		const map = this.toMap(rows);
		return {
			total: map.get("total") ?? this.sumStatuses(rows),
			draft: map.get("draft") ?? 0,
			active: map.get("active") ?? 0,
			drawn: map.get("drawn") ?? 0,
		};
	}

	private summaryTickets(rows: CountRow[]) {
		const map = this.toMap(rows);
		const sold = SOLD_TICKET_STATUSES.reduce(
			(acc, s) => acc + (map.get(s) ?? 0),
			0,
		);
		return {
			available: map.get("available") ?? 0,
			reserved: map.get("reserved") ?? 0,
			purchased: map.get("purchased") ?? 0,
			winner: map.get("winner") ?? 0,
			sold,
		};
	}

	private summaryUsers(rows: CountRow[]) {
		const map = this.toMap(rows);
		return {
			total: this.sumStatuses(rows),
			active: map.get("activo") ?? 0,
			pendiente: map.get("pendiente") ?? 0,
		};
	}

	private summaryPayments(
		intentCounts: Map<string, number>,
	): DashboardStats["summary"]["payments"] {
		return {
			total: this.sumStatuses(
				[...intentCounts.entries()].map(([key, count]) => ({
					_id: key,
					count,
				})),
			),
			creada: intentCounts.get("creada") ?? 0,
			pagada: intentCounts.get("pagada") ?? 0,
			declinada: intentCounts.get("declinada") ?? 0,
			anulada: intentCounts.get("anulada") ?? 0,
			error: intentCounts.get("error") ?? 0,
		};
	}

	private toMap(rows: CountRow[]): Map<string, number> {
		return new Map(rows.map((r) => [r._id as string, r.count]));
	}

	private sumStatuses(rows: CountRow[]): number {
		return rows.reduce((acc, r) => acc + r.count, 0);
	}

	private async salesByDay(): Promise<SalesPoint[]> {
		const start = new Date();
		start.setUTCHours(0, 0, 0, 0);
		start.setUTCDate(start.getUTCDate() - 29);

		const rows = await GatewayIntentModel.aggregate<{
			_id: string;
			revenueCents: number;
			intents: number;
		}>([
			{ $match: { status: "pagada", createdAt: { $gte: start } } },
			{
				$group: {
					_id: {
						$dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
					},
					revenueCents: { $sum: "$amountInCents" },
					intents: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		const byDate = new Map(rows.map((r) => [r._id, r]));
		const points: SalesPoint[] = [];
		for (let i = 0; i < 30; i++) {
			const day = new Date(start);
			day.setUTCDate(start.getUTCDate() + i);
			const key = day.toISOString().slice(0, 10);
			const row = byDate.get(key);
			points.push({
				date: key,
				revenueCents: row?.revenueCents ?? 0,
				intents: row?.intents ?? 0,
			});
		}
		return points;
	}

	private async rafflePerformance(): Promise<RafflePerformance[]> {
		const [raffles, ticketGroups] = await Promise.all([
			RaffleModel.find({}).lean(),
			TicketModel.aggregate<{
				_id: { raffleId: string; status: string };
				count: number;
			}>([
				{
					$group: {
						_id: { raffleId: "$raffleId", status: "$status" },
						count: { $sum: 1 },
					},
				},
			]),
		]);

		const countsByRaffle = new Map<string, Map<string, number>>();
		for (const row of ticketGroups) {
			const raffleId = row._id.raffleId.toString();
			const inner = countsByRaffle.get(raffleId) ?? new Map<string, number>();
			inner.set(row._id.status, row.count);
			countsByRaffle.set(raffleId, inner);
		}

		return raffles.map((raffle) => {
			const counts =
				countsByRaffle.get(raffle._id.toString()) ?? new Map<string, number>();
			const sold = SOLD_TICKET_STATUSES.reduce(
				(acc, s) => acc + (counts.get(s) ?? 0),
				0,
			);
			return {
				raffleId: raffle._id.toString(),
				title: raffle.title,
				status: raffle.status,
				maxTickets: raffle.maxTickets,
				sold,
				available: counts.get("available") ?? 0,
				fillRate: raffle.maxTickets > 0 ? sold / raffle.maxTickets : 0,
				revenueCents: sold * raffle.ticketPrice * 100,
			};
		});
	}
}
