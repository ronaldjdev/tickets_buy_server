import type { Config } from "@/features/config/domain/entities/Config.entity.js";
import type { IConfigRepository } from "@/features/config/domain/repositories/IConfig.repository.js";

export class AddConfig {
	constructor(private readonly configRepo: IConfigRepository) {}

	async execute(data: Config): Promise<Config | null> {
		if (!data) {
			throw new Error("Faltan datos para crear la configuración.");
		}
		return await this.configRepo.create(data);
	}
}
