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

	async findBySlug(slug: string): Promise<Raffle | null> {
		const doc = await RaffleModel.findOne({ slug }).lean();
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

	async deactivateActiveRaffles(exceptRaffleId: string): Promise<void> {
		await RaffleModel.updateMany(
			{ status: "active", _id: { $ne: exceptRaffleId } },
			{ $set: { status: "draft" } },
		);
	}

	async claimMachineSecoPrize(
		raffleId: string,
		prizeType: string,
		claimedByPurchaseId: string,
	): Promise<boolean> {
		const result = await RaffleModel.updateOne(
			{
				_id: raffleId,
				"prizes.type": prizeType,
				"prizes.machineClaimedAt": { $exists: false },
			},
			{
				$set: {
					"prizes.$.machineClaimedAt": new Date().toISOString(),
					"prizes.$.machineClaimedByPurchaseId": claimedByPurchaseId,
				},
			},
		);
		return (result.modifiedCount ?? 0) > 0;
	}

	async decrementMachineInstantStock(
		raffleId: string,
		prizeId: string,
	): Promise<boolean> {
		const result = await RaffleModel.updateOne(
			{
				_id: raffleId,
				"machine.prizes.id": prizeId,
				"machine.prizes.stock": { $gt: 0 },
			},
			{ $inc: { "machine.prizes.$.stock": -1 } },
		);
		return (result.modifiedCount ?? 0) > 0;
	}

	async releaseMachineSecoPrize(
		raffleId: string,
		prizeType: string,
	): Promise<boolean> {
		const result = await RaffleModel.updateOne(
			{
				_id: raffleId,
				"prizes.type": prizeType,
				"prizes.machineClaimedAt": { $exists: true },
			},
			{
				$unset: {
					"prizes.$.machineClaimedAt": "",
					"prizes.$.machineClaimedByPurchaseId": "",
				},
			},
		);
		return (result.modifiedCount ?? 0) > 0;
	}

	async restockMachineInstantPrize(
		raffleId: string,
		prizeId: string,
		amount: number,
	): Promise<boolean> {
		const result = await RaffleModel.updateOne(
			{ _id: raffleId, "machine.prizes.id": prizeId },
			{ $inc: { "machine.prizes.$.stock": amount } },
		);
		return (result.modifiedCount ?? 0) > 0;
	}
}
