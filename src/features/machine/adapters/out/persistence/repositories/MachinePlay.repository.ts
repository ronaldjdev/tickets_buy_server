import { RepositoryError } from "../../../../../../shared/errors/RepositoryError.js";
import type { MachinePlay } from "../../../../domain/entities/MachinePlay.entity.js";
import type {
	IMachinePlayRepository,
	MachinePlayListQuery,
	MachinePlayListResult,
} from "../../../../domain/repositories/IMachinePlay.repository.js";

import MachinePlayModel from "../schemas/MachinePlay.schema.js";

type MachinePlayDoc = {
	_id: string;
	raffleId: string;
	purchaseId: string;
	reference: string;
	documentNumber?: string;
	playedIndex: number;
	result: MachinePlay["result"];
	delivered?: boolean;
	deliveredAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
};

export class MachinePlayRepository implements IMachinePlayRepository {
	private toDomain(doc: MachinePlayDoc): MachinePlay {
		return {
			id: doc._id,
			raffleId: doc.raffleId,
			purchaseId: doc.purchaseId,
			reference: doc.reference,
			documentNumber: doc.documentNumber,
			playedIndex: doc.playedIndex,
			result: doc.result,
			delivered: doc.delivered,
			deliveredAt: doc.deliveredAt,
			createdAt: doc.createdAt,
		};
	}

	async save(play: MachinePlay): Promise<MachinePlay | null> {
		try {
			const doc = await MachinePlayModel.findOneAndUpdate(
				{ _id: play.id },
				{
					$setOnInsert: {
						raffleId: play.raffleId,
						purchaseId: play.purchaseId,
						reference: play.reference,
						documentNumber: play.documentNumber,
						playedIndex: play.playedIndex,
					},
					$set: { result: play.result },
				},
				{ new: true, upsert: true, runValidators: true },
			).lean();
			return doc ? this.toDomain(doc as unknown as MachinePlayDoc) : null;
		} catch (error) {
			throw new RepositoryError(
				`No se pudo guardar el tiro de la máquina: ${(error as Error).message}`,
			);
		}
	}

	async countByReference(reference: string): Promise<number> {
		return MachinePlayModel.countDocuments({ reference });
	}

	async byReference(reference: string, limit = 10): Promise<MachinePlay[]> {
		const docs = await MachinePlayModel.find({ reference })
			.sort({ playedIndex: -1 })
			.limit(Math.min(50, Math.max(1, limit)))
			.lean();
		return docs.map((d) => this.toDomain(d as unknown as MachinePlayDoc));
	}

	async countByDocumentRaffle(
		documentNumber: string,
		raffleId: string,
	): Promise<number> {
		return MachinePlayModel.countDocuments({ documentNumber, raffleId });
	}

	async byDocumentRaffle(
		documentNumber: string,
		raffleId: string,
		limit = 10,
	): Promise<MachinePlay[]> {
		const docs = await MachinePlayModel.find({ documentNumber, raffleId })
			.sort({ createdAt: -1 })
			.limit(Math.min(50, Math.max(1, limit)))
			.lean();
		return docs.map((d) => this.toDomain(d as unknown as MachinePlayDoc));
	}

	async findById(id: string): Promise<MachinePlay | null> {
		const doc = await MachinePlayModel.findById(id).lean();
		return doc ? this.toDomain(doc as unknown as MachinePlayDoc) : null;
	}

	async updateDelivered(
		id: string,
		delivered: boolean,
	): Promise<MachinePlay | null> {
		const doc = await MachinePlayModel.findByIdAndUpdate(
			id,
			{
				$set: {
					delivered,
					deliveredAt: delivered ? new Date() : null,
				},
			},
			{ new: true },
		).lean();
		return doc ? this.toDomain(doc as unknown as MachinePlayDoc) : null;
	}

	async list(query: MachinePlayListQuery): Promise<MachinePlayListResult> {
		const filter: Record<string, unknown> = {};
		if (query.raffleId) filter.raffleId = query.raffleId;
		if (query.documentNumber) filter.documentNumber = query.documentNumber;
		if (query.won !== undefined) filter["result.won"] = query.won;
		if (query.delivered !== undefined) filter.delivered = query.delivered;

		const page = Math.max(1, query.page ?? 1);
		const limit = Math.min(100, Math.max(1, query.limit ?? 20));

		const [docs, total] = await Promise.all([
			MachinePlayModel.find(filter)
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			MachinePlayModel.countDocuments(filter),
		]);

		return {
			plays: docs.map((d) => this.toDomain(d as unknown as MachinePlayDoc)),
			total,
		};
	}
}
