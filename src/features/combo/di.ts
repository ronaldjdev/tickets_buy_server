import type { IRaffleService } from "@/shared/contracts/raffle/IRaffleService.contract.js";

import { ComboController } from "./adapters/in/http/controllers/Combo.controller.js";
import { ComboRepository } from "./adapters/out/persistence/repositories/Combo.repository.js";
import { CreateCombo } from "./application/use-cases/CreateCombo.uc.js";
import { DeleteCombo } from "./application/use-cases/DeleteCombo.uc.js";
import { ListCombos } from "./application/use-cases/ListCombos.uc.js";
import { UpdateCombo } from "./application/use-cases/UpdateCombo.uc.js";

export function createComboModule(raffleService: IRaffleService): {
	controller: ComboController;
} {
	const comboRepository = new ComboRepository();

	const controller = new ComboController(
		new CreateCombo(comboRepository, raffleService),
		new UpdateCombo(comboRepository, raffleService),
		new DeleteCombo(comboRepository),
		new ListCombos(comboRepository),
	);

	return { controller };
}
