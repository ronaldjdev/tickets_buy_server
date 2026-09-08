import type { NextFunction, Request, Response } from "express";

import type {
	CreateCombo,
	DeleteCombo,
	ListCombos,
	UpdateCombo,
} from "@/features/combo/application/use-cases/index.js";
import response from "@/shared/http/Response.utils.js";

export class ComboController {
	constructor(
		private readonly createCombo: CreateCombo,
		private readonly updateCombo: UpdateCombo,
		private readonly deleteCombo: DeleteCombo,
		private readonly listCombos: ListCombos,
	) {}

	create = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const combo = await this.createCombo.execute(req.body);
			response(res, 201, "Combo creado", combo);
		} catch (error) {
			next(error);
		}
	};

	list = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const raffleId = String(req.query.raffleId ?? "");
			const combos = await this.listCombos.execute(raffleId || undefined);
			response(res, 200, "Combos listados", { combos });
		} catch (error) {
			next(error);
		}
	};

	update = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const combo = await this.updateCombo.execute({
				id: String(req.params.id),
				...req.body,
			});
			response(res, 200, "Combo actualizado", combo);
		} catch (error) {
			next(error);
		}
	};

	remove = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await this.deleteCombo.execute(String(req.params.id));
			response(res, 200, "Combo eliminado");
		} catch (error) {
			next(error);
		}
	};
}
