import type { NextFunction, Request, Response } from "express";
import type { ChangeRaffleStatus } from "../../../../application/use-cases/ChangeRaffleStatus.uc.js";
import type { CreateRaffle } from "../../../../application/use-cases/CreateRaffle.uc.js";
import type { DeleteRaffle } from "../../../../application/use-cases/DeleteRaffle.uc.js";
import type { DrawWinner } from "../../../../application/use-cases/DrawWinner.uc.js";
import type { GetRaffle } from "../../../../application/use-cases/GetRaffle.uc.js";
import type { GetRaffleBySlug } from "../../../../application/use-cases/GetRaffleBySlug.uc.js";
import type { ListRaffles } from "../../../../application/use-cases/ListRaffles.uc.js";
import type { UpdateRaffle } from "../../../../application/use-cases/UpdateRaffle.uc.js";

export class RaffleController {
	constructor(
		private readonly createRaffle: CreateRaffle,
		private readonly listRaffles: ListRaffles,
		private readonly drawWinner: DrawWinner,
		private readonly getRaffle: GetRaffle,
		private readonly getRaffleBySlug: GetRaffleBySlug,
		private readonly updateRaffle: UpdateRaffle,
		private readonly changeRaffleStatus: ChangeRaffleStatus,
		private readonly deleteRaffle: DeleteRaffle,
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

	getRaffleHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const raffle = await this.getRaffle.execute({
				raffleId: String(req.params.id),
			});
			res.status(200).json({ data: raffle });
		} catch (error) {
			next(error);
		}
	};

	getRaffleBySlugHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const raffle = await this.getRaffleBySlug.execute({
				slug: String(req.params.slug),
			});
			res.status(200).json({ data: raffle });
		} catch (error) {
			next(error);
		}
	};

	updateRaffleHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const raffle = await this.updateRaffle.execute({
				raffleId: String(req.params.id),
				...req.body,
			});
			res.status(200).json({ data: raffle });
		} catch (error) {
			next(error);
		}
	};

	changeRaffleStatusHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const raffle = await this.changeRaffleStatus.execute({
				raffleId: String(req.params.id),
				status: req.body.status,
			});
			res.status(200).json({ data: raffle });
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

	deleteRaffleHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			await this.deleteRaffle.execute({
				raffleId: String(req.params.id),
			});
			res.status(200).json({ data: { deleted: true } });
		} catch (error) {
			next(error);
		}
	};
}
