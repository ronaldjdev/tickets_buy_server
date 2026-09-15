import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { Config } from "../../domain/entities/Config.entity.js";
import type { IConfigRepository } from "../../domain/repositories/IConfig.repository.js";

export class AddConfig {
	constructor(
		private readonly configRepo: IConfigRepository,
		private readonly logger: ILogger,
	) {}

	async execute(data: Config): Promise<Config | null> {
		if (!data) {
			throw new Error("Faltan datos para crear la configuración.");
		}
		const config = await this.configRepo.create(data);
		this.logger.info("Configuración creada", {
			operation: "config.create",
			isSingleton: config?.isSingleton,
		});
		return config;
	}
}
