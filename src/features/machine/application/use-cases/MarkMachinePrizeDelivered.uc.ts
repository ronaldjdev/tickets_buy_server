import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { MachinePlay } from "../../domain/entities/MachinePlay.entity.js";
import { MachinePlayNotFoundError } from "../../domain/errors/Machine.error.js";
import type { IMachinePlayRepository } from "../../domain/repositories/IMachinePlay.repository.js";

export class MarkMachinePrizeDelivered {
	constructor(private readonly machinePlayRepository: IMachinePlayRepository) {}

	async execute(id: string, delivered: boolean): Promise<MachinePlay> {
		if (!id?.trim()) throw new UseCaseError("El tiro es obligatorio.");
		const play = await this.machinePlayRepository.findById(id.trim());
		if (!play) throw new MachinePlayNotFoundError();
		if (!play.result.won) {
			throw new UseCaseError(
				"Un tiro sin premio no se puede marcar como entregado.",
			);
		}
		const updated = await this.machinePlayRepository.updateDelivered(
			id.trim(),
			delivered,
		);
		if (!updated) throw new MachinePlayNotFoundError();
		return updated;
	}
}
