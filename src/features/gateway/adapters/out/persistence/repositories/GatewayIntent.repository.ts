import type { ClientSession } from "mongoose";

import type { GatewayIntent } from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type {
	GatewayIntentListQuery,
	IGatewayIntentRepository,
} from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import { RepositoryError } from "@/shared/errors/RepositoryError.js";

import GatewayIntentModel from "../schemas/GatewayIntent.schema.js";

export class GatewayIntentRepository implements IGatewayIntentRepository {
	async create(
		intent: Partial<GatewayIntent>,
		session?: ClientSession,
	): Promise<GatewayIntent> {
		try {
			const doc = await GatewayIntentModel.create([intent], { session });
			return doc[0].toObject() as unknown as GatewayIntent;
		} catch (error) {
			throw new RepositoryError(
				`No se pudo crear el cobro: ${(error as Error).message}`,
			);
		}
	}

	async findByReference(reference: string): Promise<GatewayIntent | null> {
		const doc = await GatewayIntentModel.findOne({ reference }).lean();
		return (doc as unknown as GatewayIntent) ?? null;
	}

	async findByLinkId(linkId: string): Promise<GatewayIntent | null> {
		const doc = await GatewayIntentModel.findOne({ linkId })
			.sort({ createdAt: -1 })
			.lean();
		return (doc as unknown as GatewayIntent) ?? null;
	}

	async findPaidByContactId(contactId: string): Promise<GatewayIntent[]> {
		const docs = await GatewayIntentModel.find({
			contactId,
			status: "pagada",
		})
			.sort({ createdAt: -1 })
			.lean();
		return docs as unknown as GatewayIntent[];
	}

	async updateByReference(
		reference: string,
		data: Partial<GatewayIntent>,
		session?: ClientSession,
	): Promise<GatewayIntent | null> {
		const doc = await GatewayIntentModel.findOneAndUpdate({ reference }, data, {
			new: true,
			session,
		}).lean();
		return (doc as unknown as GatewayIntent) ?? null;
	}

	async list(
		query: GatewayIntentListQuery,
	): Promise<{ intents: GatewayIntent[]; total: number }> {
		const filter: Record<string, unknown> = {};
		if (query.status) filter.status = query.status;

		const page = Math.max(1, query.page ?? 1);
		const limit = Math.min(100, Math.max(1, query.limit ?? 20));

		const [docs, total] = await Promise.all([
			GatewayIntentModel.find(filter)
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			GatewayIntentModel.countDocuments(filter),
		]);

		return { intents: docs as unknown as GatewayIntent[], total };
	}
}
