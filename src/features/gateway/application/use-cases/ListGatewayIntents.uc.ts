import type { GatewayIntentStatus } from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type {
	GatewayIntentListResult,
	IGatewayIntentRepository,
} from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";

export interface ListGatewayIntentsCommand {
	status?: GatewayIntentStatus;
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
			page: command.page,
			limit: command.limit,
		});
	}
}
