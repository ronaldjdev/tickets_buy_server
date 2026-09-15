import { appLogger } from "../../platform/di/Logger.di.js";
import type { IRaffleService } from "../../shared/contracts/raffle/IRaffleService.contract.js";
import type { ILogger } from "../../shared/port/ILogger.port.js";

import { ComboController } from "./adapters/in/http/controllers/Combo.controller.js";
import { ComboRepository } from "./adapters/out/persistence/repositories/Combo.repository.js";
import { CreateCombo } from "./application/use-cases/CreateCombo.uc.js";
import { DeleteCombo } from "./application/use-cases/DeleteCombo.uc.js";
import { ListCombos } from "./application/use-cases/ListCombos.uc.js";
import { UpdateCombo } from "./application/use-cases/UpdateCombo.uc.js";

export function createComboModule(
	raffleService: IRaffleService,
	logger: ILogger = appLogger,
): {
	controller: ComboController;
} {
	const comboRepository = new ComboRepository();

	const controller = new ComboController(
		new CreateCombo(comboRepository, raffleService, logger),
		new UpdateCombo(comboRepository, raffleService, logger),
		new DeleteCombo(comboRepository, logger),
		new ListCombos(comboRepository),
	);

	return { controller };
}
