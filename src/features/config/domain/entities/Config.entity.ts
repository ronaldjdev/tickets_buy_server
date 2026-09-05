import type { WompiSettings } from "@/shared/contracts/IWompiConfigReader.contract.js";

interface General {
	nameBusiness?: string;
	email?: string;
	phone?: string;
}

interface WompiConfig {
	enabled?: boolean;
	environment?: WompiSettings["environment"];
	publicKey?: string;
	privateKey?: string;
	integrityKey?: string;
	eventsKey?: string;
}

export interface Config {
	isSingleton?: boolean;
	general?: General;
	wompi?: WompiConfig;
	createdAt?: Date;
	updatedAt?: Date;
}
