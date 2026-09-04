import type { ConfigRepository } from "@/features/config/adapters/out/persistence/repositories/Config.repository.js";
import type { IPublicIntentConfig } from "@/shared/contracts/IPublicIntentConfig.contract.js";
import type {
	IWompiConfigReader,
	WompiSettings,
} from "@/shared/contracts/IWompiConfigReader.contract.js";

export class WompiConfigReader implements IWompiConfigReader {
	constructor(private readonly configRepo: ConfigRepository) {}

	async getWompiSettings(): Promise<WompiSettings | null> {
		const config = await this.configRepo.findSingleton();
		return config?.wompi ?? null;
	}
}

export class PublicIntentConfig implements IPublicIntentConfig {
	constructor(private readonly configRepo: ConfigRepository) {}

	async getBusinessName(): Promise<string | undefined> {
		const config = await this.configRepo.findSingleton();
		return config?.general?.nameBusiness;
	}
}
