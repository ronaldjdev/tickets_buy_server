import type { NextFunction, Request, Response } from "express";

import type { GetPublicIntent } from "@/features/gateway/application/use-cases/GetPublicIntent.uc.js";
import type { CreatePurchase } from "@/features/ticket/application/use-cases/CreatePurchase.uc.js";
import response from "@/shared/http/Response.utils.js";

export class PurchaseController {
	constructor(
		private readonly createPurchase: CreatePurchase,
		private readonly getIntent: GetPublicIntent,
	) {}

	create = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await this.createPurchase.execute(req.body);
			response(res, 201, "Enlace de pago generado", result);
		} catch (error) {
			next(error);
		}
	};

	status = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const intent = await this.getIntent.execute(
				req.params.reference as string,
			);
			response(res, 200, "Estado de la compra", intent);
		} catch (error) {
			next(error);
		}
	};
}
