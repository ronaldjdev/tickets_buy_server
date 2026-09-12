import { randomUUID } from "node:crypto";
import type { ITicketService } from "../../../../shared/contracts/ticket/ITicketService.contract.js";
import { ensureUniqueSlug } from "../../../../shared/utils/ensureUniqueSlug.js";
import { slugify } from "../../../../shared/utils/slugify.js";
import type {
	Raffle,
	RafflePrize,
	RaffleStatus,
} from "../../domain/entities/Raffle.entity.js";
import type { IRaffleRepository } from "../../domain/repositories/IRaffle.repository.js";

export interface CreateRaffleCommand {
	title: string;
	description?: string;
	prizes?: RafflePrize[];
	startDate: Date;
	endDate: Date;
	ticketPrice: number;
	maxTickets: number;
	status?: RaffleStatus;
}

export class CreateRaffle {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly ticketService: ITicketService,
	) {}

	async execute(command: CreateRaffleCommand): Promise<Raffle> {
		if (!command) throw new Error("Comando requerido");
		if (command.maxTickets <= 0)
			throw new Error("maxTickets debe ser mayor a 0");
		if (command.ticketPrice < 0)
			throw new Error("ticketPrice no puede ser negativo");

		const id = randomUUID();
		const slug = await ensureUniqueSlug(slugify(command.title), (s) =>
			this.raffleRepository.findBySlug(s),
		);

		if (command.status === "active") {
			await this.raffleRepository.deactivateActiveRaffles(id);
		}

		const raffle: Raffle = {
			id,
			slug,
			title: command.title,
			description: command.description,
			prizes: command.prizes ?? [],
			startDate: command.startDate,
			endDate: command.endDate,
			ticketPrice: command.ticketPrice,
			maxTickets: command.maxTickets,
			status: command.status ?? "draft",
		};

		const saved = await this.raffleRepository.save(raffle);
		await this.ticketService.createAvailableTickets(
			raffle.id,
			raffle.maxTickets,
		);

		return saved;
	}
}
