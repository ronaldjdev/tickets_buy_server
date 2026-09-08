import type { GatewayIntent } from "../entities/GatewayIntent.entity.js";

export interface GatewayIntentListQuery {
	status?: GatewayIntent["status"];
	page?: number;
	limit?: number;
}

export interface GatewayIntentListResult {
	intents: GatewayIntent[];
	total: number;
}

export interface IGatewayIntentRepository {
	create(intent: Partial<GatewayIntent>): Promise<GatewayIntent>;
	findByReference(reference: string): Promise<GatewayIntent | null>;
	findByLinkId(linkId: string): Promise<GatewayIntent | null>;
	findPaidByContactId(contactId: string): Promise<GatewayIntent[]>;
	updateByReference(
		reference: string,
		data: Partial<GatewayIntent>,
	): Promise<GatewayIntent | null>;
	list(query: GatewayIntentListQuery): Promise<GatewayIntentListResult>;
}
