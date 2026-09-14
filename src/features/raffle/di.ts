import type { NotificationService } from "../../features/notification/application/services/NotificationService.js";
import type { IRaffleService } from "../../shared/contracts/raffle/IRaffleService.contract.js";
import type { ITicketService } from "../../shared/contracts/ticket/ITicketService.contract.js";
import type { ILogger } from "../../shared/port/ILogger.port.js";
import { RaffleController } from "./adapters/in/http/controllers/Raffle.controller.js";
import { RaffleRepository } from "./adapters/out/persistence/repositories/Raffle.repository.js";
import { RaffleSharedService } from "./adapters/out/shared/RaffleSharedService.js";
import { ChangeRaffleStatus } from "./application/use-cases/ChangeRaffleStatus.uc.js";
import { CreateRaffle } from "./application/use-cases/CreateRaffle.uc.js";
import { DeleteRaffle } from "./application/use-cases/DeleteRaffle.uc.js";
import { DrawWinner } from "./application/use-cases/DrawWinner.uc.js";
import { GetRaffle } from "./application/use-cases/GetRaffle.uc.js";
import { GetRaffleBySlug } from "./application/use-cases/GetRaffleBySlug.uc.js";
import { ListRaffles } from "./application/use-cases/ListRaffles.uc.js";
import { UpdateRaffle } from "./application/use-cases/UpdateRaffle.uc.js";

export function createRaffleModule(
	ticketService: ITicketService,
	logger: ILogger,
	notificationService?: NotificationService,
): {
	controller: RaffleController;
	sharedService: IRaffleService;
} {
	const raffleRepository = new RaffleRepository();

	const createRaffle = new CreateRaffle(raffleRepository, logger);
	const listRaffles = new ListRaffles(raffleRepository);
	const drawWinner = new DrawWinner(
		raffleRepository,
		ticketService,
		notificationService,
		logger,
	);
	const getRaffle = new GetRaffle(raffleRepository);
	const getRaffleBySlug = new GetRaffleBySlug(raffleRepository);
	const updateRaffle = new UpdateRaffle(
		raffleRepository,
		ticketService,
		logger,
	);
	const changeRaffleStatus = new ChangeRaffleStatus(
		raffleRepository,
		notificationService,
		logger,
	);
	const deleteRaffle = new DeleteRaffle(
		raffleRepository,
		ticketService,
		logger,
	);

	const controller = new RaffleController(
		createRaffle,
		listRaffles,
		drawWinner,
		getRaffle,
		getRaffleBySlug,
		updateRaffle,
		changeRaffleStatus,
		deleteRaffle,
	);
	const sharedService = new RaffleSharedService(raffleRepository);

	return { controller, sharedService };
}
