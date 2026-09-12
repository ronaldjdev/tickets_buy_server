import type { ITicketService } from "../../../../shared/contracts/ticket/ITicketService.contract.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import { RaffleNotFoundError } from "../../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface DeleteRaffleCommand {
	raffleId: string;
}

export class DeleteRaffle {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly ticketService: ITicketService,
		private readonly logger: ILogger,
	) {}

	async execute(command: DeleteRaffleCommand): Promise<void> {
		const raffle = await this.raffleRepository.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);

		const tickets = await this.ticketService.listTickets(raffle.id);
		if (
			tickets.some((t) => t.status === "purchased" || t.status === "winner")
		) {
			throw new Error("No se puede eliminar un sorteo con tickets vendidos");
		}

		await this.ticketService.deleteByRaffle(raffle.id);
		await this.raffleRepository.delete(raffle.id);

		this.logger.info("Sorteo eliminado", {
			operation: "raffle.delete",
			raffleId: raffle.id,
			title: raffle.title,
		});
	}
}
