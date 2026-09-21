import type { ITicketService } from "../../../../shared/contracts/ticket/ITicketService.contract.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { NotificationService } from "../../../notification/application/services/NotificationService.js";
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
		private readonly notificationService?: NotificationService,
		private readonly logger?: ILogger,
	) {}

	async execute(command: DrawWinnerCommand): Promise<Raffle> {
		const raffle = await this.raffleRepository.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);
		if (raffle.status === "drawn")
			throw new RaffleAlreadyDrawnError(command.raffleId);

		const expeditedPrize =
			(raffle.prizes ?? []).find(
				(p) => p.type === "mayor" && p.winningExpeditedAt,
			) ??
			(raffle.prizes ?? []).find(
				(p) => p.winningExpeditedAt && p.winningNumber !== undefined,
			);

		if (expeditedPrize?.winningNumber !== undefined) {
			return this.drawGuaranteedWinner(raffle, expeditedPrize.winningNumber);
		}

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

		await this.notifyDrawn(drawn, winnerTicket.number, winnerTicket.id);

		this.logger?.info("Ganador asignado", {
			operation: "raffle.draw_winner",
			raffleId: drawn.id,
			winnerTicketId: winnerTicket.id,
			winnerNumber: winnerTicket.number,
			title: drawn.title,
		});

		return drawn;
	}

	private async drawGuaranteedWinner(
		raffle: Raffle,
		winningNumber: number,
	): Promise<Raffle> {
		const winnerTicket = await this.ticketService.createGuaranteedWinner(
			raffle.id,
			winningNumber,
		);

		const drawn = await this.raffleRepository.update({
			...raffle,
			status: "drawn",
			winnerTicketId: winnerTicket.id,
		});

		await this.notifyDrawn(drawn, winnerTicket.number, winnerTicket.id);

		this.logger?.info("Ganador garantizado asignado", {
			operation: "raffle.draw_winner",
			raffleId: drawn.id,
			winnerTicketId: winnerTicket.id,
			winnerNumber: winnerTicket.number,
			guaranteed: true,
			title: drawn.title,
		});

		return drawn;
	}

	private async notifyDrawn(
		drawn: Raffle,
		winnerNumber: number,
		winnerTicketId: string,
	): Promise<void> {
		if (!this.notificationService) return;
		try {
			await this.notificationService.notifyUsers({
				type: "sale_drawn",
				title: "Ganador asignado",
				message: `El sorteo "${drawn.title}" ya tiene ganador (boleta #${winnerNumber}).`,
				metadata: {
					raffleId: drawn.id,
					winnerTicketId,
				},
			});
		} catch (error) {
			this.logger?.warn("No se pudo emitir notificación de ganador asignado", {
				error,
			});
		}
	}
}
