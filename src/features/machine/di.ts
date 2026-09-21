import { appLogger } from "../../platform/di/Logger.di.js";
import type { IRaffleService } from "../../shared/contracts/raffle/IRaffleService.contract.js";
import type { ILogger } from "../../shared/port/ILogger.port.js";
import { machineSettings } from "../config/di.js";
import { GatewayIntentRepository } from "../gateway/adapters/out/persistence/repositories/GatewayIntent.repository.js";
import type { IRaffleRepository } from "../raffle/domain/repositories/IRaffle.repository.js";
import { TicketRepository } from "../ticket/adapters/out/persistence/repositories/Ticket.repository.js";
import { MachineController } from "./adapters/in/http/controllers/Machine.controller.js";
import { MachineGrantRepository } from "./adapters/out/persistence/repositories/MachineGrant.repository.js";
import { MachinePlayRepository } from "./adapters/out/persistence/repositories/MachinePlay.repository.js";
import { GetDocumentMachineOverview } from "./application/use-cases/GetDocumentMachineOverview.uc.js";
import { GetDocumentMachineSession } from "./application/use-cases/GetDocumentMachineSession.uc.js";
import { GetMachineSession } from "./application/use-cases/GetMachineSession.uc.js";
import { GrantMachinePlays } from "./application/use-cases/GrantMachinePlays.uc.js";
import { ListMachineGrants } from "./application/use-cases/ListMachineGrants.uc.js";
import { ListMachinePlays } from "./application/use-cases/ListMachinePlays.uc.js";
import { MarkMachinePrizeDelivered } from "./application/use-cases/MarkMachinePrizeDelivered.uc.js";
import { PlayMachine } from "./application/use-cases/PlayMachine.uc.js";
import { PlayMachineByDocument } from "./application/use-cases/PlayMachineByDocument.uc.js";
import { ReleaseMachineSecoPrize } from "./application/use-cases/ReleaseMachineSecoPrize.uc.js";
import { RestockMachineInstantPrize } from "./application/use-cases/RestockMachineInstantPrize.uc.js";

export function createMachineModule(deps: {
	raffleService: IRaffleService;
	raffleRepository: IRaffleRepository;
	logger?: ILogger;
}): {
	controller: MachineController;
} {
	const logger = deps.logger ?? appLogger;
	const machinePlayRepository = new MachinePlayRepository();
	const machineGrantRepository = new MachineGrantRepository();
	const intentRepo = new GatewayIntentRepository();
	const ticketRepository = new TicketRepository();

	const getMachineSession = new GetMachineSession(
		intentRepo,
		ticketRepository,
		deps.raffleService,
		machinePlayRepository,
		machineSettings,
	);
	const playMachine = new PlayMachine(
		intentRepo,
		ticketRepository,
		deps.raffleService,
		deps.raffleRepository,
		machinePlayRepository,
		logger,
		machineSettings,
	);
	const getDocumentMachineOverview = new GetDocumentMachineOverview(
		intentRepo,
		ticketRepository,
		deps.raffleService,
		machinePlayRepository,
		machineGrantRepository,
		machineSettings,
	);
	const getDocumentMachineSession = new GetDocumentMachineSession(
		intentRepo,
		ticketRepository,
		deps.raffleService,
		machinePlayRepository,
		machineGrantRepository,
		machineSettings,
	);
	const playMachineByDocument = new PlayMachineByDocument(
		intentRepo,
		ticketRepository,
		deps.raffleService,
		deps.raffleRepository,
		machinePlayRepository,
		machineGrantRepository,
		machineSettings,
		logger,
	);
	const listMachinePlays = new ListMachinePlays(machinePlayRepository);
	const markMachinePrizeDelivered = new MarkMachinePrizeDelivered(
		machinePlayRepository,
	);
	const releaseMachineSecoPrize = new ReleaseMachineSecoPrize(
		deps.raffleRepository,
	);
	const restockMachineInstantPrize = new RestockMachineInstantPrize(
		deps.raffleRepository,
	);
	const listMachineGrants = new ListMachineGrants(machineGrantRepository);
	const grantMachinePlays = new GrantMachinePlays(
		machineGrantRepository,
		deps.raffleService,
	);

	return {
		controller: new MachineController(
			playMachine,
			getMachineSession,
			getDocumentMachineOverview,
			getDocumentMachineSession,
			playMachineByDocument,
			listMachinePlays,
			markMachinePrizeDelivered,
			releaseMachineSecoPrize,
			restockMachineInstantPrize,
			listMachineGrants,
			grantMachinePlays,
			machineSettings,
		),
	};
}
