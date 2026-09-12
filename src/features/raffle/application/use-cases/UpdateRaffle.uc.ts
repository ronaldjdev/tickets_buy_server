import type { ITicketService } from "../../../../shared/contracts/ticket/ITicketService.contract.js";
import { ensureUniqueSlug } from "../../../../shared/utils/ensureUniqueSlug.js";
import { slugify } from "../../../../shared/utils/slugify.js";
import type {
	Raffle,
	RafflePrize,
} from "../../domain/entities/Raffle.entity.js";
import { RaffleNotFoundError } from "../../domain/errors/Raffle.error.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface UpdateRaffleCommand {
	raffleId: string;
	title?: string;
	description?: string;
	prizes?: RafflePrize[];
	startDate?: Date;
	endDate?: Date;
	ticketPrice?: number;
	maxTickets?: number;
	winnerTicketId?: string;
}

export class UpdateRaffle {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly ticketService: ITicketService,
	) {}

	async execute(command: UpdateRaffleCommand): Promise<Raffle> {
		const raffle = await this.raffleRepository.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);
		if (raffle.status === "drawn") {
			throw new Error("No se puede editar un sorteo ya sorteado");
		}

		if (command.ticketPrice !== undefined && command.ticketPrice < 0) {
			throw new Error("ticketPrice no puede ser negativo");
		}

		const title = command.title ?? raffle.title;
		let slug = raffle.slug;
		if (command.title !== undefined && title !== raffle.title) {
			slug = await ensureUniqueSlug(
				slugify(title),
				(s) => this.raffleRepository.findBySlug(s),
				raffle.id,
			);
		}

		let maxTickets = raffle.maxTickets;
		if (command.maxTickets !== undefined) {
			if (command.maxTickets <= 0) {
				throw new Error("maxTickets debe ser mayor a 0");
			}

			const tickets = await this.ticketService.listTickets(raffle.id);
			const sold = tickets.filter((t) => t.status !== "available").length;
			if (command.maxTickets < sold) {
				throw new Error("maxTickets no puede ser menor a los tickets vendidos");
			}

			if (command.maxTickets > maxTickets) {
				await this.ticketService.createAvailableTickets(
					raffle.id,
					command.maxTickets - maxTickets,
					maxTickets + 1,
				);
			} else if (command.maxTickets < maxTickets) {
				await this.ticketService.releaseAvailableBeyond(
					raffle.id,
					command.maxTickets,
				);
			}
			maxTickets = command.maxTickets;
		}

		return this.raffleRepository.update({
			...raffle,
			slug,
			title,
			description: command.description ?? raffle.description,
			prizes: command.prizes ?? raffle.prizes,
			startDate: command.startDate ?? raffle.startDate,
			endDate: command.endDate ?? raffle.endDate,
			ticketPrice: command.ticketPrice ?? raffle.ticketPrice,
			maxTickets,
			winnerTicketId: command.winnerTicketId ?? raffle.winnerTicketId,
		});
	}
}
