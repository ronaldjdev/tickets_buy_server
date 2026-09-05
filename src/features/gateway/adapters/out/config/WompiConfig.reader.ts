import type { IPublicIntentConfig } from "@/shared/contracts/IPublicIntentConfig.contract.js";
import type {
	IWompiConfigReader,
	WompiSettings,
} from "@/shared/contracts/IWompiConfigReader.contract.js";

interface GatewayConfigStore {
	findSingleton(): Promise<{
		wompi?: WompiSettings;
		general?: { nameBusiness?: string };
	} | null>;
}

export class WompiConfigReader implements IWompiConfigReader {
	constructor(private readonly configRepo: GatewayConfigStore) {}

	async getWompiSettings(): Promise<WompiSettings | null> {
		const config = await this.configRepo.findSingleton();
		return config?.wompi ?? null;
	}
}

export class PublicIntentConfig implements IPublicIntentConfig {
	constructor(private readonly configRepo: GatewayConfigStore) {}

	async getBusinessName(): Promise<string | undefined> {
		const config = await this.configRepo.findSingleton();
		return config?.general?.nameBusiness;
	}
}
