import { UseCaseError } from "@/shared/errors/UseCaseError.js";

import { ComboNotFoundError } from "../../domain/errors/Combo.error.js";
import type { IComboRepository } from "../../domain/repositories/ICombo.repository.js";

export class DeleteCombo {
	constructor(private readonly comboRepository: IComboRepository) {}

	async execute(id: string): Promise<boolean> {
		if (!id) throw new UseCaseError("El id del combo es obligatorio.");

		const combo = await this.comboRepository.findById(id);
		if (!combo) throw new ComboNotFoundError(id);

		const deleted = await this.comboRepository.delete(id);
		if (!deleted) throw new UseCaseError("No se pudo eliminar el combo.");
		return deleted;
	}
}
