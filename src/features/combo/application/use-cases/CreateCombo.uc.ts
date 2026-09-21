import { randomUUID } from "node:crypto";
import type { IRaffleService } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import { RaffleNotFoundError } from "../../../ticket/domain/errors/Ticket.error.js";

import type { Combo } from "../../domain/entities/Combo.entity.js";
import type { IComboRepository } from "../../domain/repositories/ICombo.repository.js";

export interface CreateComboCommand {
	raffleId: string;
	name: string;
	ticketCount: number;
	price: number;
	plays?: number;
}

export class CreateCombo {
	constructor(
		private readonly comboRepository: IComboRepository,
		private readonly raffleService: IRaffleService,
		private readonly logger: ILogger,
	) {}

	async execute(command: CreateComboCommand): Promise<Combo> {
		const name = command?.name?.trim();
		if (!name) throw new UseCaseError("El nombre del combo es obligatorio.");
		if (!command.raffleId?.trim())
			throw new UseCaseError("La sorteo del combo es obligatoria.");
		if (!Number.isInteger(command.ticketCount) || command.ticketCount < 1) {
			throw new UseCaseError(
				"La cantidad de boletos debe ser un número entero mayor a 0.",
			);
		}
		if (!Number.isFinite(command.price) || command.price < 0) {
			throw new UseCaseError("El precio del combo no puede ser negativo.");
		}
		const plays = command.plays ?? 0;
		if (!Number.isInteger(plays) || plays < 0) {
			throw new UseCaseError(
				"Los tiros de la máquina deben ser un número entero mayor o igual a 0.",
			);
		}

		const raffle = await this.raffleService.findById(command.raffleId);
		if (!raffle) throw new RaffleNotFoundError(command.raffleId);
		if (command.ticketCount > raffle.maxTickets) {
			throw new UseCaseError(
				`El combo no puede superar los ${raffle.maxTickets} boletos de la sorteo.`,
			);
		}
		const minTickets = raffle.minTickets ?? 1;
		if (command.ticketCount < minTickets) {
			throw new UseCaseError(
				`El combo no puede tener menos de ${minTickets} boletos (mínimo de compra de la sorteo).`,
			);
		}

		const combos = await this.comboRepository.byRaffle(command.raffleId);
		if (combos.some((c) => c.name === name)) {
			throw new UseCaseError(
				`Ya existe un combo llamado "${name}" en esta sorteo.`,
			);
		}

		const saved = await this.comboRepository.save({
			id: randomUUID(),
			raffleId: command.raffleId,
			name,
			ticketCount: command.ticketCount,
			price: command.price,
			plays,
		});
		if (!saved) throw new UseCaseError("No se pudo crear el combo.");

		this.logger.info("Combo creado", {
			operation: "combo.create",
			comboId: saved.id,
			raffleId: saved.raffleId,
			name: saved.name,
			ticketCount: saved.ticketCount,
			plays: saved.plays,
		});
		return saved;
	}
}
