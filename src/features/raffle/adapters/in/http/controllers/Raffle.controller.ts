import type { NextFunction, Request, Response } from "express";
import type { CreateRaffle } from "../../../../application/use-cases/CreateRaffle.uc.js";
import type { DrawWinner } from "../../../../application/use-cases/DrawWinner.uc.js";
import type { ListRaffles } from "../../../../application/use-cases/ListRaffles.uc.js";

export class RaffleController {
	constructor(
		private readonly createRaffle: CreateRaffle,
		private readonly listRaffles: ListRaffles,
		private readonly drawWinner: DrawWinner,
	) {}

	createRaffleHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const raffle = await this.createRaffle.execute(req.body);
			res.status(201).json({ data: raffle });
		} catch (error) {
			next(error);
		}
	};

	listRafflesHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const raffles = await this.listRaffles.execute({
				status: req.query.status as never,
				limit: req.query.limit ? Number(req.query.limit) : undefined,
				offset: req.query.offset ? Number(req.query.offset) : undefined,
			});
			res.status(200).json({ data: raffles });
		} catch (error) {
			next(error);
		}
	};

	drawWinnerHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const raffle = await this.drawWinner.execute({
				raffleId: String(req.params.id),
			});
			res.status(200).json({ data: raffle });
		} catch (error) {
			next(error);
		}
	};
}
