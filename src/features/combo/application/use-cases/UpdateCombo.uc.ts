import { RaffleNotFoundError } from "@/features/ticket/domain/errors/Ticket.error.js";
import type { IRaffleService } from "@/shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

import type { Combo } from "../../domain/entities/Combo.entity.js";
import { ComboNotFoundError } from "../../domain/errors/Combo.error.js";
import type { IComboRepository } from "../../domain/repositories/ICombo.repository.js";

export interface UpdateComboCommand {
	id: string;
	name?: string;
	ticketCount?: number;
	price?: number;
}

export class UpdateCombo {
	constructor(
		private readonly comboRepository: IComboRepository,
		private readonly raffleService: IRaffleService,
	) { }

	async execute(command: UpdateComboCommand): Promise<Combo> {
		if (!command.id) throw new UseCaseError("El id del combo es obligatorio.");

		const combo = await this.comboRepository.findById(command.id);
		if (!combo) throw new ComboNotFoundError(command.id);

		const next = {
			name: command.name?.trim() ?? combo.name,
			ticketCount: command.ticketCount ?? combo.ticketCount,
			price: command.price ?? combo.price,
		};
		if (!next.name)
			throw new UseCaseError("El nombre del combo es obligatorio.");
		if (!Number.isInteger(next.ticketCount) || next.ticketCount < 1) {
			throw new UseCaseError(
				"La cantidad de boletos debe ser un número entero mayor a 0.",
			);
		}
		if (!Number.isFinite(next.price) || next.price < 0) {
			throw new UseCaseError("El precio del combo no puede ser negativo.");
		}

		const raffle = await this.raffleService.findById(combo.raffleId);
		if (!raffle) throw new RaffleNotFoundError(combo.raffleId);
		if (next.ticketCount > raffle.maxTickets) {
			throw new UseCaseError(
				`El combo no puede superar los ${raffle.maxTickets} boletos de la sorteo.`,
			);
		}

		const combos = await this.comboRepository.byRaffle(combo.raffleId);
		if (combos.some((c) => c.id !== combo.id && c.name === next.name)) {
			throw new UseCaseError(
				`Ya existe un combo llamado "${next.name}" en esta sorteo.`,
			);
		}

		const updated = await this.comboRepository.update(combo.id, next);
		if (!updated) throw new UseCaseError("No se pudo actualizar el combo.");
		return updated;
	}
}
