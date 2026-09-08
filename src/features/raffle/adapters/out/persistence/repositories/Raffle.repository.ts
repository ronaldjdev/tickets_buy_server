import { RaffleMapper } from "../../../../application/mappers/Raffle.mapper.js";
import type { Raffle } from "../../../../domain/entities/Raffle.entity.js";
import type {
	IRaffleRepository,
	RaffleQuery,
} from "../../../../domain/repositories/IRaffle.repository.js";
import RaffleModel from "../schemas/Raffle.schema.js";

export class RaffleRepository implements IRaffleRepository {
	async findById(id: string): Promise<Raffle | null> {
		const doc = await RaffleModel.findById(id).lean();
		return doc
			? RaffleMapper.toDomain(doc as unknown as Record<string, unknown>)
			: null;
	}

	async list(query: RaffleQuery): Promise<Raffle[]> {
		const filter: Record<string, unknown> = {};
		if (query.status) filter.status = query.status;

		const docs = await RaffleModel.find(filter)
			.limit(query.limit ?? 50)
			.skip(query.offset ?? 0)
			.lean();

		return docs.map((d) =>
			RaffleMapper.toDomain(d as unknown as Record<string, unknown>),
		);
	}

	async save(raffle: Raffle): Promise<Raffle> {
		const dto = RaffleMapper.toPersistence(raffle);
		const created = await RaffleModel.create(dto);
		return RaffleMapper.toDomain(
			created.toObject() as unknown as Record<string, unknown>,
		);
	}

	async update(raffle: Raffle): Promise<Raffle> {
		const dto = RaffleMapper.toPersistence(raffle);
		const doc = await RaffleModel.findByIdAndUpdate(raffle.id, dto, {
			new: true,
		});
		if (!doc) throw new Error(`Raffle no encontrada: ${raffle.id}`);
		return RaffleMapper.toDomain(
			doc.toObject() as unknown as Record<string, unknown>,
		);
	}

	async delete(id: string): Promise<void> {
		await RaffleModel.findByIdAndDelete(id);
	}
}
