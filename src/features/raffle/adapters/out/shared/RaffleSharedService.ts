import type {
	IRaffleService,
	RafflePayload,
} from "../../../../../shared/contracts/raffle/IRaffleService.contract.js";
import type { ITicketService } from "../../../../../shared/contracts/ticket/ITicketService.contract.js";
import { getWinningNumberStatus } from "../../../domain/entities/Raffle.entity.js";
import type { IRaffleRepository } from "../../../domain/repositories/IRaffle.repository.js";

export class RaffleSharedService implements IRaffleService {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly ticketService: ITicketService,
	) {}

	async findById(id: string): Promise<RafflePayload | null> {
		const raffle = await this.raffleRepository.findById(id);
		if (!raffle) return null;
		const soldTickets = await this.ticketService.countSoldTickets(id);
		return {
			id: raffle.id,
			title: raffle.title,
			status: raffle.status,
			ticketPrice: raffle.ticketPrice,
			maxTickets: raffle.maxTickets,
			minTickets: raffle.minTickets,
			ticketIssuance: raffle.ticketIssuance ?? "random",
			description: raffle.description,
			endDate: raffle.endDate?.toISOString(),
			soldTickets,
			prizes: raffle.prizes?.map((p) => ({
				type: p.type,
				name: p.name,
				description: p.description,
				winningNumber: p.winningNumber,
				winningMinSoldTickets: p.winningMinSoldTickets,
				winningStatus: getWinningNumberStatus(p, soldTickets) ?? undefined,
				winningExpeditedAt: p.winningExpeditedAt,
				winningExpeditedBy: p.winningExpeditedBy,
			})),
		};
	}
}
