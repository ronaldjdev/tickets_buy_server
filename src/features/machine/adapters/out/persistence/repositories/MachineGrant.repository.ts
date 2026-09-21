import { RepositoryError } from "../../../../../../shared/errors/RepositoryError.js";
import type { MachineGrant } from "../../../../domain/entities/MachineGrant.entity.js";
import type {
	IMachineGrantRepository,
	MachineGrantListQuery,
} from "../../../../domain/repositories/IMachineGrant.repository.js";

import MachineGrantModel from "../schemas/MachineGrant.schema.js";

type MachineGrantDoc = {
	_id: string;
	documentNumber: string;
	raffleId: string;
	delta: number;
	note?: string;
	createdBy?: string;
	createdAt?: Date;
};

export class MachineGrantRepository implements IMachineGrantRepository {
	private toDomain(doc: MachineGrantDoc): MachineGrant {
		return {
			id: doc._id,
			documentNumber: doc.documentNumber,
			raffleId: doc.raffleId,
			delta: doc.delta,
			note: doc.note,
			createdBy: doc.createdBy,
			createdAt: doc.createdAt,
		};
	}

	async save(grant: MachineGrant): Promise<MachineGrant> {
		try {
			const doc = await MachineGrantModel.create({ _id: grant.id, ...grant });
			return this.toDomain(doc.toObject() as unknown as MachineGrantDoc);
		} catch (error) {
			throw new RepositoryError(
				`No se pudo registrar el ajuste de tiros: ${(error as Error).message}`,
			);
		}
	}

	async byDocumentRaffle(
		documentNumber: string,
		raffleId: string,
	): Promise<MachineGrant[]> {
		const docs = await MachineGrantModel.find({ documentNumber, raffleId })
			.sort({ createdAt: -1 })
			.lean();
		return docs.map((d) => this.toDomain(d as unknown as MachineGrantDoc));
	}

	async list(query: MachineGrantListQuery): Promise<MachineGrant[]> {
		const filter: Record<string, unknown> = {};
		if (query.documentNumber) filter.documentNumber = query.documentNumber;
		if (query.raffleId) filter.raffleId = query.raffleId;

		const docs = await MachineGrantModel.find(filter)
			.sort({ createdAt: -1 })
			.limit(Math.min(200, Math.max(1, query.limit ?? 50)))
			.lean();
		return docs.map((d) => this.toDomain(d as unknown as MachineGrantDoc));
	}
}
