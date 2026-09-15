import { RepositoryError } from "../../../../../../shared/errors/RepositoryError.js";
import { TicketMapper } from "../../../../application/mappers/Ticket.mapper.js";
import type {
	Ticket,
	TicketStatus,
} from "../../../../domain/entities/Ticket.entity.js";
import type {
	ITicketRepository,
	ReserveTicketsData,
} from "../../../../domain/repositories/ITicket.repository.js";
import TicketModel from "../schemas/Ticket.schema.js";

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

	async findByRaffle(
		raffleId: string,
		statuses?: TicketStatus[],
	): Promise<Ticket[]> {
		const docs = await TicketModel.find({
			raffleId,
			...(statuses && statuses.length > 0 ? { status: { $in: statuses } } : {}),
		}).lean();
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

	async findByDocumentNumber(
		documentNumber: string,
		statuses?: TicketStatus[],
	): Promise<Ticket[]> {
		const docs = await TicketModel.find({
			buyerDocumentNumber: documentNumber,
			...(statuses && statuses.length > 0 ? { status: { $in: statuses } } : {}),
		})
			.sort({ createdAt: -1 })
			.limit(500)
			.lean();
		return docs.map((d) =>
			TicketMapper.toDomain(d as unknown as Record<string, unknown>),
		);
	}

	async countByRaffle(
		raffleId: string,
		statuses: TicketStatus[],
	): Promise<number> {
		if (statuses.length === 0) return 0;
		return TicketModel.countDocuments({
			raffleId,
			status: { $in: statuses },
		});
	}

	async findNumbersByRaffle(raffleId: string): Promise<number[]> {
		return TicketModel.distinct("number", { raffleId });
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
		const dtos = tickets.map((t) => TicketMapper.toPersistence(t));
		const ids = dtos.map((d) => d._id as string);
		try {
			const docs = await TicketModel.insertMany(dtos, { ordered: false });
			return docs.map((d) =>
				TicketMapper.toDomain(d as unknown as Record<string, unknown>),
			);
		} catch {
			// Colisiones de número (índice único): los insertados persisten;
			// se reconcilian re-consultando por _id y el resto queda ignorado.
			const docs = await TicketModel.find({ _id: { $in: ids } }).lean();
			return docs.map((d) =>
				TicketMapper.toDomain(d as unknown as Record<string, unknown>),
			);
		}
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
						buyerLastName: data.buyerLastName,
						buyerEmail: data.buyerEmail,
						buyerPhone: data.buyerPhone,
						buyerDocumentType: data.buyerDocumentType,
						buyerDocumentNumber: data.buyerDocumentNumber,
						buyerCountry: data.buyerCountry,
						buyerAddress: data.buyerAddress,
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
			const result = await TicketModel.deleteMany({
				status: "reserved",
				reservedUntil: { $lte: until },
			});
			return result.deletedCount ?? 0;
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
