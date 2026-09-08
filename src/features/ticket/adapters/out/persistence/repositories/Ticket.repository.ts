import { TicketMapper } from "@/features/ticket/application/mappers/Ticket.mapper";
import type {
	Ticket,
	TicketStatus,
} from "@/features/ticket/domain/entities/Ticket.entity";
import type {
	ITicketRepository,
	ReserveTicketsData,
} from "@/features/ticket/domain/repositories/ITicket.repository";
import { RepositoryError } from "@/shared/errors/RepositoryError";
import TicketModel from "../schemas/Ticket.schema";

export class TicketRepository implements ITicketRepository {
	async findById(id: string): Promise<Ticket | null> {
		const doc = await TicketModel.findById(id).lean();
		return doc
			? TicketMapper.toDomain(doc as unknown as Record<string, unknown>)
			: null;
	}

	async findByIds(ids: string[]): Promise<Ticket[]> {
		if (ids.length === 0) return [];
		const docs = await TicketModel.find({ _id: { $in: ids } }).lean();
		return docs.map((d) =>
			TicketMapper.toDomain(d as unknown as Record<string, unknown>),
		);
	}

	async findByRaffle(raffleId: string): Promise<Ticket[]> {
		const docs = await TicketModel.find({ raffleId }).lean();
		return docs.map((d) =>
			TicketMapper.toDomain(d as unknown as Record<string, unknown>),
		);
	}

	async findByPurchaseId(purchaseId: string): Promise<Ticket[]> {
		const docs = await TicketModel.find({ purchaseId }).lean();
		return docs.map((d) =>
			TicketMapper.toDomain(d as unknown as Record<string, unknown>),
		);
	}

	async findWinningTicket(raffleId: string): Promise<Ticket | null> {
		const doc = await TicketModel.findOne({
			raffleId,
			status: "winner",
		}).lean();
		return doc
			? TicketMapper.toDomain(doc as unknown as Record<string, unknown>)
			: null;
	}

	async save(ticket: Ticket): Promise<Ticket> {
		const dto = TicketMapper.toPersistence(ticket);
		const created = await TicketModel.create(dto);
		return TicketMapper.toDomain(
			created.toObject() as unknown as Record<string, unknown>,
		);
	}

	async saveMany(tickets: Ticket[]): Promise<Ticket[]> {
		const docs = await TicketModel.insertMany(
			tickets.map((t) => TicketMapper.toPersistence(t)),
		);
		return docs.map((d) =>
			TicketMapper.toDomain(d as unknown as Record<string, unknown>),
		);
	}

	async reserveTickets(
		ticketIds: string[],
		data: ReserveTicketsData,
	): Promise<number> {
		try {
			const result = await TicketModel.updateMany(
				{ _id: { $in: ticketIds }, status: "available" },
				{
					$set: {
						status: "reserved" satisfies TicketStatus,
						buyerName: data.buyerName,
						buyerEmail: data.buyerEmail,
						buyerPhone: data.buyerPhone,
						purchaseId: data.purchaseId,
						reservedUntil: data.reservedUntil,
					},
				},
			);
			return result.modifiedCount ?? 0;
		} catch (error) {
			throw new RepositoryError(
				`No se pudieron reservar los tickets: ${(error as Error).message}`,
			);
		}
	}

	async markPurchasedByPurchaseId(purchaseId: string): Promise<number> {
		try {
			const result = await TicketModel.updateMany(
				{ purchaseId, status: "reserved" },
				{
					$set: {
						status: "purchased" satisfies TicketStatus,
						reservedUntil: null,
					},
				},
			);
			return result.modifiedCount ?? 0;
		} catch (error) {
			throw new RepositoryError(
				`No se pudieron confirmar los tickets: ${(error as Error).message}`,
			);
		}
	}

	async releaseExpiredReserved(until: Date): Promise<number> {
		try {
			const result = await TicketModel.updateMany(
				{ status: "reserved", reservedUntil: { $lte: until } },
				{
					$set: {
						status: "available" satisfies TicketStatus,
						reservedUntil: null,
					},
					$unset: {
						buyerName: "",
						buyerEmail: "",
						buyerPhone: "",
						purchaseId: "",
					},
				},
			);
			return result.modifiedCount ?? 0;
		} catch (error) {
			throw new RepositoryError(
				`No se pudieron liberar las reservas expiradas: ${(error as Error).message}`,
			);
		}
	}

	async deleteAvailableBeyond(
		raffleId: string,
		afterNumber: number,
	): Promise<number> {
		try {
			const result = await TicketModel.deleteMany({
				raffleId,
				number: { $gt: afterNumber },
				status: "available",
			});
			return result.deletedCount ?? 0;
		} catch (error) {
			throw new RepositoryError(
				`No se pudieron eliminar los tickets disponibles: ${(error as Error).message}`,
			);
		}
	}

	async deleteByRaffle(raffleId: string): Promise<number> {
		try {
			const result = await TicketModel.deleteMany({ raffleId });
			return result.deletedCount ?? 0;
		} catch (error) {
			throw new RepositoryError(
				`No se pudieron eliminar los tickets del sorteo: ${(error as Error).message}`,
			);
		}
	}
}
