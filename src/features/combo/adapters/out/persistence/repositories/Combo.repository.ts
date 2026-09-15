import { RepositoryError } from "../../../../../../shared/errors/RepositoryError.js";
import type { Combo } from "../../../../domain/entities/Combo.entity.js";
import type { IComboRepository } from "../../../../domain/repositories/ICombo.repository.js";

import ComboModel from "../schemas/Combo.schema.js";

type ComboDoc = {
	_id: string;
	raffleId: string;
	name: string;
	ticketCount: number;
	price: number;
	recommended: boolean;
	createdAt?: Date;
	updatedAt?: Date;
};

export class ComboRepository implements IComboRepository {
	private toDomain(doc: ComboDoc): Combo {
		return {
			id: doc._id,
			raffleId: doc.raffleId,
			name: doc.name,
			ticketCount: doc.ticketCount,
			price: doc.price,
			recommended: doc.recommended,
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt,
		};
	}

	private toPersistence(combo: Combo) {
		return {
			raffleId: combo.raffleId,
			name: combo.name,
			ticketCount: combo.ticketCount,
			price: combo.price,
			recommended: combo.recommended ?? false,
		};
	}

	async save(combo: Combo): Promise<Combo | null> {
		try {
			const doc = await ComboModel.findOneAndUpdate(
				{ _id: combo.id },
				{ $set: this.toPersistence(combo) },
				{ new: true, upsert: true, runValidators: true },
			).lean();
			return doc ? this.toDomain(doc as unknown as ComboDoc) : null;
		} catch (error) {
			throw new RepositoryError(
				`No se pudo guardar el combo: ${(error as Error).message}`,
			);
		}
	}

	async findById(id: string): Promise<Combo | null> {
		const doc = await ComboModel.findOne({ _id: id }).lean();
		return doc ? this.toDomain(doc as unknown as ComboDoc) : null;
	}

	async byRaffle(raffleId: string): Promise<Combo[]> {
		const docs = await ComboModel.find({ raffleId })
			.sort({ recommended: -1, ticketCount: 1 })
			.lean();
		return docs.map((d) => this.toDomain(d as unknown as ComboDoc));
	}

	async list(): Promise<Combo[]> {
		const docs = await ComboModel.find()
			.sort({ recommended: -1, createdAt: 1 })
			.lean();
		return docs.map((d) => this.toDomain(d as unknown as ComboDoc));
	}

	async update(id: string, data: Partial<Combo>): Promise<Combo | null> {
		const doc = await ComboModel.findOneAndUpdate({ _id: id }, data, {
			new: true,
			runValidators: true,
		}).lean();
		return doc ? this.toDomain(doc as unknown as ComboDoc) : null;
	}

	async delete(id: string): Promise<boolean> {
		const result = await ComboModel.deleteOne({ _id: id });
		return (result.deletedCount ?? 0) > 0;
	}

	async clearRecommended(raffleId: string, exceptId: string): Promise<void> {
		await ComboModel.updateMany(
			{ raffleId, _id: { $ne: exceptId } },
			{ $set: { recommended: false } },
		);
	}
}
