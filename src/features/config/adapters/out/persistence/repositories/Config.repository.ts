import { RepositoryError } from "../../../../../../shared/errors/RepositoryError.js";
import type { Config } from "../../../../domain/entities/Config.entity.js";
import type { IConfigRepository } from "../../../../domain/repositories/IConfig.repository.js";

import ConfigModel from "../schemas/Config.schema.js";

export class ConfigRepository implements IConfigRepository {
	async create(data: Partial<Config>): Promise<Config> {
		try {
			const doc = await ConfigModel.findOneAndUpdate(
				{ isSingleton: true },
				{ $set: { ...data, isSingleton: true } },
				{ new: true, upsert: true, runValidators: true },
			).lean();
			return doc as unknown as Config;
		} catch (error) {
			throw new RepositoryError(
				`No se pudo guardar la configuración: ${(error as Error).message}`,
			);
		}
	}

	async findSingleton(): Promise<Config | null> {
		const doc = await ConfigModel.findOne({ isSingleton: true }).lean();
		return doc ? (doc as unknown as Config) : null;
	}

	async update(data: Partial<Config>): Promise<Config | null> {
		const doc = await ConfigModel.findOneAndUpdate(
			{ isSingleton: true },
			{ $set: data },
			{ new: true },
		).lean();
		return doc ? (doc as unknown as Config) : null;
	}
}
