import type { Raffle } from "../../domain/entities/Raffle.entity.js";
import { RaffleNotFoundError } from "../../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface GetRaffleBySlugCommand {
	slug: string;
}

export class GetRaffleBySlug {
	constructor(private readonly raffleRepository: IRaffleRepository) {}

	async execute(command: GetRaffleBySlugCommand): Promise<Raffle> {
		const raffle = await this.raffleRepository.findBySlug(command.slug);
		if (!raffle) throw new RaffleNotFoundError(command.slug);
		return raffle;
	}
}
