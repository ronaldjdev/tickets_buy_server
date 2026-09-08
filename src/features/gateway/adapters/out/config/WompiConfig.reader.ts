import type { IPublicIntentConfig } from "@/shared/contracts/IPublicIntentConfig.contract.js";
import type {
	IWompiConfigReader,
	WompiSettings,
} from "@/shared/contracts/IWompiConfigReader.contract.js";

type PaymentEnvironment = "sandbox" | "production";

interface PaymentProviderSettings {
	enabled?: boolean;
	environment?: PaymentEnvironment | "test" | "prod";
	publicKey?: string;
	privateKey?: string;
	integrityKey?: string;
	eventsKey?: string;
}

interface GatewayConfigStore {
	findSingleton(): Promise<{
		wompi?: WompiSettings;
		integrations?: {
			payments?: Record<string, PaymentProviderSettings>;
		};
		general?: { nameBusiness?: string };
	} | null>;
}

export class WompiConfigReader implements IWompiConfigReader {
	constructor(private readonly configRepo: GatewayConfigStore) {}

	async getWompiSettings(): Promise<WompiSettings | null> {
		const config = await this.configRepo.findSingleton();
		const settings =
			config?.integrations?.payments?.wompi ?? config?.wompi ?? null;
		if (!settings) return null;
		return {
			enabled: settings.enabled,
			environment: this.mapEnvironment(settings.environment),
			publicKey: settings.publicKey,
			privateKey: settings.privateKey,
			integrityKey: settings.integrityKey,
			eventsKey: settings.eventsKey,
		};
	}

	private mapEnvironment(
		environment: PaymentProviderSettings["environment"],
	): WompiSettings["environment"] {
		if (environment === "production" || environment === "prod") return "prod";
		if (environment === "sandbox" || environment === "test") return "test";
		return undefined;
	}
}

export class PublicIntentConfig implements IPublicIntentConfig {
	constructor(private readonly configRepo: GatewayConfigStore) {}

	async getBusinessName(): Promise<string | undefined> {
		const config = await this.configRepo.findSingleton();
		return config?.general?.nameBusiness;
	}
}
