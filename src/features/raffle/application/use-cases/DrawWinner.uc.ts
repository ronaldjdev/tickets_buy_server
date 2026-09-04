import type { ITicketService } from "../../../../shared/contracts/ticket/ITicketService.contract.js";
import type { Raffle } from "../../domain/entities/Raffle.entity.js";
import {
	NoTicketsPurchasedError,
	RaffleAlreadyDrawnError,
	RaffleNotFoundError,
} from "../../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface DrawWinnerCommand {
	raffleId: string;
}

export class DrawWinner {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly ticketService: ITicketService,
	) {}

	async execute(command: DrawWinnerCommand): Promise<Raffle> {
		const raffle = await this.raffleRepository.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);
		if (raffle.status === "drawn")
			throw new RaffleAlreadyDrawnError(command.raffleId);

		const tickets = await this.ticketService.listTickets(command.raffleId);
		const purchased = tickets.filter((t) => t.status === "purchased");
		if (purchased.length === 0)
			throw new NoTicketsPurchasedError(command.raffleId);

		const winner = purchased[Math.floor(Math.random() * purchased.length)];
		const winnerTicket = await this.ticketService.markAsWinner(winner.id);

		const drawn = await this.raffleRepository.update({
			...raffle,
			status: "drawn",
			winnerTicketId: winnerTicket.id,
		});

		return drawn;
	}
}
