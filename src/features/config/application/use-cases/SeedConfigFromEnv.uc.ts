import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { Config } from "../../domain/entities/Config.entity.js";
import type { IConfigRepository } from "../../domain/repositories/IConfig.repository.js";

function envBool(value: string | undefined): boolean {
	if (value === undefined) return true;
	return value.toLowerCase() === "true";
}

export class SeedConfigFromEnv {
	constructor(
		private readonly configRepo: IConfigRepository,
		private readonly logger: ILogger,
	) {}

	async execute(): Promise<void> {
		const existing = await this.configRepo.findSingleton();
		if (existing) return;

		const wompi: NonNullable<Config["wompi"]> = {
			enabled: envBool(process.env.WOMPI_ENABLED),
			environment: process.env.WOMPI_ENVIRONMENT === "prod" ? "prod" : "test",
			publicKey: process.env.WOMPI_PUBLIC_KEY ?? "",
			privateKey: process.env.WOMPI_PRIVATE_KEY ?? "",
			integrityKey: process.env.WOMPI_INTEGRITY_KEY ?? "",
			eventsKey: process.env.WOMPI_EVENTS_KEY ?? "",
		};

		await this.configRepo.create({
			isSingleton: true,
			general: {
				nameBusiness: process.env.BUSINESS_NAME ?? "RifaPro",
				email: process.env.BUSINESS_EMAIL,
				phone: process.env.BUSINESS_PHONE,
			},
			wompi,
		});
		this.logger.info("Configuración sembrada desde entorno", {
			operation: "config.seed_from_env",
		});
	}
}
