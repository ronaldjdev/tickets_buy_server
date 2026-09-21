import type { ITicketService } from "../../../../shared/contracts/ticket/ITicketService.contract.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import { ensureUniqueSlug } from "../../../../shared/utils/ensureUniqueSlug.js";
import { slugify } from "../../../../shared/utils/slugify.js";
import type { IComboRepository } from "../../../combo/domain/repositories/ICombo.repository.js";
import type {
	Raffle,
	RaffleMachineConfig,
	RafflePrize,
	TicketIssuanceMode,
} from "../../domain/entities/Raffle.entity.js";
import {
	isTicketIssuanceMode,
	validateMachineConfig,
	validatePrizes,
	validateWinningNumberConfig,
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
	minTickets?: number;
	ticketIssuance?: TicketIssuanceMode;
	winnerTicketId?: string;
	machine?: RaffleMachineConfig;
}

export class UpdateRaffle {
	constructor(
		private readonly raffleRepository: IRaffleRepository,
		private readonly ticketService: ITicketService,
		private readonly logger: ILogger,
		private readonly comboRepository?: IComboRepository,
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
		if (
			command.ticketIssuance !== undefined &&
			!isTicketIssuanceMode(command.ticketIssuance)
		) {
			throw new Error("ticketIssuance debe ser 'random' o 'consecutive'");
		}
		validatePrizes(command.prizes);
		validateMachineConfig(command.machine, command.prizes ?? raffle.prizes);

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
			const newMax = command.maxTickets;
			if (newMax <= 0) {
				throw new Error("maxTickets debe ser mayor a 0");
			}

			const tickets = await this.ticketService.listTickets(raffle.id);
			const sold = tickets.filter((t) => t.status !== "available");
			if (newMax < sold.length) {
				throw new Error("maxTickets no puede ser menor a los tickets vendidos");
			}

			if (newMax < maxTickets) {
				if (sold.some((t) => t.number > newMax)) {
					throw new Error(
						"maxTickets no puede ser menor al número de un boleto vendido",
					);
				}
				await this.ticketService.releaseAvailableBeyond(raffle.id, newMax);
			}

			maxTickets = newMax;
		}

		validateWinningNumberConfig(command.prizes, maxTickets);
		if (command.prizes) {
			const existingNumbers = new Set(
				(await this.ticketService.listTickets(raffle.id)).map((t) => t.number),
			);
			for (const prize of command.prizes) {
				if (
					prize.winningNumber !== undefined &&
					existingNumbers.has(prize.winningNumber)
				) {
					throw new Error(
						`El número ganador ${prize.winningNumber} ya está asignado a un boleto; elige otro número`,
					);
				}
			}
		}

		let minTickets = raffle.minTickets ?? 1;
		if (command.minTickets !== undefined) {
			const newMin = command.minTickets;
			if (!Number.isInteger(newMin) || newMin < 1) {
				throw new Error("minTickets debe ser un entero mayor o igual a 1");
			}
			if (newMin > maxTickets) {
				throw new Error("minTickets no puede superar maxTickets");
			}
			if (this.comboRepository && newMin > minTickets) {
				const combos = await this.comboRepository.byRaffle(raffle.id);
				const below = combos
					.filter((c) => c.ticketCount < newMin)
					.map((c) => `${c.name} (${c.ticketCount})`);
				if (below.length > 0) {
					throw new Error(
						`No se puede subir el mínimo a ${newMin}: los combos ${below.join(", ")} tienen menos boletos. Ajusta o elimina esos combos primero.`,
					);
				}
			}
			minTickets = newMin;
		}

		const updated = await this.raffleRepository.update({
			...raffle,
			slug,
			title,
			description: command.description ?? raffle.description,
			prizes: command.prizes ?? raffle.prizes,
			startDate: command.startDate ?? raffle.startDate,
			endDate: command.endDate ?? raffle.endDate,
			ticketPrice: command.ticketPrice ?? raffle.ticketPrice,
			maxTickets,
			minTickets,
			ticketIssuance:
				command.ticketIssuance ?? raffle.ticketIssuance ?? "random",
			winnerTicketId: command.winnerTicketId ?? raffle.winnerTicketId,
			machine: command.machine ?? raffle.machine,
		});

		this.logger.info("Sorteo actualizado", {
			operation: "raffle.update",
			raffleId: updated.id,
			slug: updated.slug,
			title: updated.title,
			maxTickets: updated.maxTickets,
		});

		return updated;
	}
}
