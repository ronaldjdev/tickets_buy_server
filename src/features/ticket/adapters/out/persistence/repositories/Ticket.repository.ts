import TicketModel from "../schemas/Ticket.schema";
import { TicketMapper } from "@/features/ticket/application/mappers/Ticket.mapper";
import type { Ticket } from "@/features/ticket/domain/entities/Ticket.entity";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository";

export class TicketRepository implements ITicketRepository {
	async findById(id: string): Promise<Ticket | null> {
		const doc = await TicketModel.findById(id).lean();
		return doc
			? TicketMapper.toDomain(doc as unknown as Record<string, unknown>)
			: null;
	}

	async findByRaffle(raffleId: string): Promise<Ticket[]> {
		const docs = await TicketModel.find({ raffleId }).lean();
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
}
