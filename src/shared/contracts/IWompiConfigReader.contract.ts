export interface WompiSettings {
	enabled?: boolean;
	environment?: "test" | "prod";
	publicKey?: string;
	privateKey?: string;
	integrityKey?: string;
	eventsKey?: string;
}

export interface IWompiConfigReader {
	getWompiSettings(): Promise<WompiSettings | null>;
}
