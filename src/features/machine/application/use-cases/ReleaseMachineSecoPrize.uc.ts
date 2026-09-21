import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { IRaffleRepository } from "../../../raffle/domain/repositories/IRaffle.repository.js";

export class ReleaseMachineSecoPrize {
	constructor(private readonly raffleRepository: IRaffleRepository) {}

	async execute(raffleId: string, prizeType: string): Promise<void> {
		if (!raffleId?.trim()) throw new UseCaseError("El sorteo es obligatorio.");
		if (!prizeType?.startsWith("seco")) {
			throw new UseCaseError("Solo se pueden reponer premios secos.");
		}
		const released = await this.raffleRepository.releaseMachineSecoPrize(
			raffleId.trim(),
			prizeType,
		);
		if (!released) {
			throw new UseCaseError(
				"El premio seco no estaba reclamado por la máquina.",
			);
		}
	}
}
