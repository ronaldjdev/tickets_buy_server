import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { IRaffleRepository } from "../../../raffle/domain/repositories/IRaffle.repository.js";

export class RestockMachineInstantPrize {
	constructor(private readonly raffleRepository: IRaffleRepository) {}

	async execute(
		raffleId: string,
		prizeId: string,
		amount: number,
	): Promise<void> {
		if (!raffleId?.trim()) throw new UseCaseError("El sorteo es obligatorio.");
		if (!prizeId?.trim()) throw new UseCaseError("El premio es obligatorio.");
		if (!Number.isInteger(amount) || amount <= 0) {
			throw new UseCaseError(
				"La cantidad a reponer debe ser un entero mayor a 0.",
			);
		}
		const restocked = await this.raffleRepository.restockMachineInstantPrize(
			raffleId.trim(),
			prizeId.trim(),
			amount,
		);
		if (!restocked) throw new UseCaseError("El premio instantáneo no existe.");
	}
}
