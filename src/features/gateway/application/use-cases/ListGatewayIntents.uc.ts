import type { GatewayIntentStatus } from "../../domain/entities/GatewayIntent.entity.js";
import type {
	GatewayIntentListResult,
	IGatewayIntentRepository,
} from "../../domain/repositories/IGatewayIntent.repository.js";

export interface ListGatewayIntentsCommand {
	status?: GatewayIntentStatus;
	q?: string;
	page?: number;
	limit?: number;
}

export class ListGatewayIntents {
	constructor(private readonly intentRepository: IGatewayIntentRepository) {}

	async execute(
		command: ListGatewayIntentsCommand,
	): Promise<GatewayIntentListResult> {
		return this.intentRepository.list({
			status: command.status,
			q: command.q,
			page: command.page,
			limit: command.limit,
		});
	}
}
