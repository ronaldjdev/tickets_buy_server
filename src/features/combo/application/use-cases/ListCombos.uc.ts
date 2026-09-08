import type { Combo } from "../../domain/entities/Combo.entity.js";
import type { IComboRepository } from "../../domain/repositories/ICombo.repository.js";

export class ListCombos {
	constructor(private readonly comboRepository: IComboRepository) {}

	async execute(raffleId?: string): Promise<Combo[]> {
		return raffleId
			? this.comboRepository.byRaffle(raffleId)
			: this.comboRepository.list();
	}
}
