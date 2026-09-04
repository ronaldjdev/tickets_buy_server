import type {
	Raffle,
	RaffleStatus,
} from "../../domain/entities/Raffle.entity.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface ListRafflesCommand {
	status?: RaffleStatus;
	limit?: number;
	offset?: number;
}

export class ListRaffles {
	constructor(private readonly raffleRepository: IRaffleRepository) {}

	async execute(command: ListRafflesCommand): Promise<Raffle[]> {
		return this.raffleRepository.list({
			status: command.status,
			limit: command.limit,
			offset: command.offset,
		});
	}
}
