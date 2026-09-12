import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";

import { ComboNotFoundError } from "../../domain/errors/Combo.error.js";
import type { IComboRepository } from "../../domain/repositories/ICombo.repository.js";

export class DeleteCombo {
	constructor(
		private readonly comboRepository: IComboRepository,
		private readonly logger: ILogger,
	) {}

	async execute(id: string): Promise<boolean> {
		if (!id) throw new UseCaseError("El id del combo es obligatorio.");

		const combo = await this.comboRepository.findById(id);
		if (!combo) throw new ComboNotFoundError(id);

		const deleted = await this.comboRepository.delete(id);
		if (!deleted) throw new UseCaseError("No se pudo eliminar el combo.");

		this.logger.info("Combo eliminado", {
			operation: "combo.delete",
			comboId: combo.id,
			raffleId: combo.raffleId,
			name: combo.name,
		});
		return deleted;
	}
}
