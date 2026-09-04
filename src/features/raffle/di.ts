import type { IRaffleService } from "../../shared/contracts/raffle/IRaffleService.contract.js";
import type { ITicketService } from "../../shared/contracts/ticket/ITicketService.contract.js";
import { RaffleController } from "./adapters/in/http/controllers/Raffle.controller.js";
import { RaffleRepository } from "./adapters/out/persistence/repositories/Raffle.repository.js";
import { RaffleSharedService } from "./adapters/out/shared/RaffleSharedService.js";
import { CreateRaffle } from "./application/use-cases/CreateRaffle.uc.js";
import { DrawWinner } from "./application/use-cases/DrawWinner.uc.js";
import { ListRaffles } from "./application/use-cases/ListRaffles.uc.js";

export function createRaffleModule(ticketService: ITicketService): {
	controller: RaffleController;
	sharedService: IRaffleService;
} {
	const raffleRepository = new RaffleRepository();

	const createRaffle = new CreateRaffle(raffleRepository, ticketService);
	const listRaffles = new ListRaffles(raffleRepository);
	const drawWinner = new DrawWinner(raffleRepository, ticketService);

	const controller = new RaffleController(
		createRaffle,
		listRaffles,
		drawWinner,
	);
	const sharedService = new RaffleSharedService(raffleRepository);

	return { controller, sharedService };
}
