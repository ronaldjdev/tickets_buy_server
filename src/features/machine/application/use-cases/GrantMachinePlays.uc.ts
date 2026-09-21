import { randomUUID } from "node:crypto";
import type { IRaffleService } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { MachineGrant } from "../../domain/entities/MachineGrant.entity.js";
import type { IMachineGrantRepository } from "../../domain/repositories/IMachineGrant.repository.js";

export interface GrantMachinePlaysCommand {
	documentNumber: string;
	raffleId: string;
	delta: number;
	note?: string;
	createdBy?: string;
}

export class GrantMachinePlays {
	constructor(
		private readonly grantRepository: IMachineGrantRepository,
		private readonly raffleService: IRaffleService,
	) {}

	async execute(command: GrantMachinePlaysCommand): Promise<MachineGrant> {
		const documentNumber = command.documentNumber?.trim();
		if (!documentNumber) {
			throw new UseCaseError("El número de documento es obligatorio.");
		}
		if (!command.raffleId?.trim()) {
			throw new UseCaseError("El sorteo es obligatorio.");
		}
		if (!Number.isInteger(command.delta) || command.delta === 0) {
			throw new UseCaseError(
				"La cantidad de tiros debe ser un entero distinto de 0 (positivo otorga, negativo quita).",
			);
		}

		const raffle = await this.raffleService.findById(command.raffleId.trim());
		if (!raffle) throw new UseCaseError("El sorteo no existe.");

		return this.grantRepository.save({
			id: randomUUID(),
			documentNumber,
			raffleId: raffle.id,
			delta: command.delta,
			note: command.note?.trim() || undefined,
			createdBy: command.createdBy,
		});
	}
}
