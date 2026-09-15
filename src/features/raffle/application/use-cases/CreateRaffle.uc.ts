import { randomUUID } from "node:crypto";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import { ensureUniqueSlug } from "../../../../shared/utils/ensureUniqueSlug.js";
import { slugify } from "../../../../shared/utils/slugify.js";
import type {
	Raffle,
	RafflePrize,
	RaffleStatus,
	TicketIssuanceMode,
} from "../../domain/entities/Raffle.entity.js";
import {
	isTicketIssuanceMode,
	validatePrizes,
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
	minTickets?: number;
	ticketIssuance?: TicketIssuanceMode;
	status?: RaffleStatus;
}

export class CreateRaffle {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly logger: ILogger,
	) {}

	async execute(command: CreateRaffleCommand): Promise<Raffle> {
		if (!command) throw new Error("Comando requerido");
		if (command.maxTickets <= 0)
			throw new Error("maxTickets debe ser mayor a 0");
		if (command.ticketPrice < 0)
			throw new Error("ticketPrice no puede ser negativo");

		const minTickets = command.minTickets ?? 1;
		if (!Number.isInteger(minTickets) || minTickets < 1) {
			throw new Error("minTickets debe ser un entero mayor o igual a 1");
		}
		if (minTickets > command.maxTickets) {
			throw new Error("minTickets no puede superar maxTickets");
		}

		const ticketIssuance = command.ticketIssuance ?? "random";
		if (!isTicketIssuanceMode(ticketIssuance)) {
			throw new Error(
				"ticketIssuance debe ser 'random' o 'consecutive'",
			);
		}

		validatePrizes(command.prizes);

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
			minTickets,
			ticketIssuance,
			status: command.status ?? "draft",
		};

		const saved = await this.raffleRepository.save(raffle);

		this.logger.info("Sorteo creado", {
			operation: "raffle.create",
			raffleId: saved.id,
			slug: saved.slug,
			title: saved.title,
			status: saved.status,
			maxTickets: saved.maxTickets,
		});

		return saved;
	}
}
