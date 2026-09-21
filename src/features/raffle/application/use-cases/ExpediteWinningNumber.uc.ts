import type { ITicketService } from "../../../../shared/contracts/ticket/ITicketService.contract.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type {
	Raffle,
	RafflePrizeType,
} from "../../domain/entities/Raffle.entity.js";
import {
	PrizeWithoutWinningNumberError,
	RaffleAlreadyDrawnError,
	RaffleNotFoundError,
	WinningNumberAlreadyExpeditedError,
	WinningNumberSalesNotReachedError,
} from "../../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface ExpediteWinningNumberCommand {
	raffleId: string;
	prizeType: RafflePrizeType;
	expeditedBy: string;
}

/**
 * Expide manualmente el número ganador de un premio. Solo puede expedirse si:
 * - el premio tiene número ganador configurado;
 * - aún no fue expedido (doble expedición → error);
 * - el sorteo no está sorteado;
 * - las ventas reales (purchased + winner) alcanzan el mínimo configurado.
 */
export class ExpediteWinningNumber {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly ticketService: ITicketService,
		private readonly logger?: ILogger,
	) {}

	async execute(command: ExpediteWinningNumberCommand): Promise<Raffle> {
		const raffle = await this.raffleRepository.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);
		if (raffle.status === "drawn")
			throw new RaffleAlreadyDrawnError(command.raffleId);

		const prize = (raffle.prizes ?? []).find(
			(p) => p.type === command.prizeType,
		);
		if (!prize || prize.winningNumber === undefined) {
			throw new PrizeWithoutWinningNumberError(
				command.raffleId,
				command.prizeType,
			);
		}
		if (prize.winningExpeditedAt) {
			throw new WinningNumberAlreadyExpeditedError(
				command.raffleId,
				command.prizeType,
			);
		}

		const minimum = prize.winningMinSoldTickets ?? 0;
		const sold = await this.ticketService.countSoldTickets(command.raffleId);
		if (sold < minimum) {
			throw new WinningNumberSalesNotReachedError(
				command.raffleId,
				command.prizeType,
				minimum,
			);
		}

		const updated = await this.raffleRepository.update({
			...raffle,
			prizes: (raffle.prizes ?? []).map((p) =>
				p.type === command.prizeType
					? {
							...p,
							winningExpeditedAt: new Date().toISOString(),
							winningExpeditedBy: command.expeditedBy,
						}
					: p,
			),
		});

		this.logger?.info("Número ganador expedido", {
			operation: "raffle.expedite_winning_number",
			raffleId: updated.id,
			prizeType: command.prizeType,
			winningNumber: prize.winningNumber,
			sold,
			minimum,
			expeditedBy: command.expeditedBy,
		});

		return updated;
	}
}
