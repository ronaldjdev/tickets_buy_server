import type { Raffle } from "../../domain/entities/Raffle.entity.js";
import { RaffleNotFoundError } from "../../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface GetRaffleCommand {
	raffleId: string;
}

export class GetRaffle {
	constructor(private readonly raffleRepository: IRaffleRepository) {}

	async execute(command: GetRaffleCommand): Promise<Raffle> {
		const raffle = await this.raffleRepository.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);
		return raffle;
	}
}
