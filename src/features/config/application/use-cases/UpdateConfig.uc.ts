import type { Config } from "@/features/config/domain/entities/Config.entity.js";
import type { IConfigRepository } from "@/features/config/domain/repositories/IConfig.repository.js";

export class UpdateConfig {
	constructor(private readonly configRepo: IConfigRepository) {}

	async execute(data: Partial<Config>): Promise<Config | null> {
		if (!data) {
			throw new Error(
				"No se proporcionaron datos para actualizar la configuración.",
			);
		}
		return await this.configRepo.update(data);
	}
}
