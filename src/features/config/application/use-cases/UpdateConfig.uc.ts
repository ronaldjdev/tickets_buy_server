import type { Config } from "@/features/config/domain/entities/Config.entity.js";
import type { IConfigRepository } from "@/features/config/domain/repositories/IConfig.repository.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";

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
