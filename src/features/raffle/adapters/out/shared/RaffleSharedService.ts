import type {
	IRaffleService,
	RafflePayload,
} from "../../../../../shared/contracts/raffle/IRaffleService.contract.js";
import type { IRaffleRepository } from "../../../domain/repositories/IRaffle.repository.js";

export class RaffleSharedService implements IRaffleService {
	constructor(private readonly raffleRepository: IRaffleRepository) {}

	async findById(id: string): Promise<RafflePayload | null> {
		const raffle = await this.raffleRepository.findById(id);
		if (!raffle) return null;
		return {
			id: raffle.id,
			title: raffle.title,
			status: raffle.status,
			ticketPrice: raffle.ticketPrice,
			maxTickets: raffle.maxTickets,
		};
	}
}
