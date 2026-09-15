import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { Config } from "../../domain/entities/Config.entity.js";
import type { IConfigRepository } from "../../domain/repositories/IConfig.repository.js";

export class UpdateConfig {
	constructor(
		private readonly configRepo: IConfigRepository,
		private readonly logger: ILogger,
	) {}

	async execute(data: Partial<Config>): Promise<Config | null> {
		if (!data) {
			throw new Error(
				"No se proporcionaron datos para actualizar la configuración.",
			);
		}
		const updated = await this.configRepo.update(data);
		this.logger.info("Configuración actualizada", {
			operation: "config.update",
			isSingleton: updated?.isSingleton,
		});
		return updated;
	}
}
