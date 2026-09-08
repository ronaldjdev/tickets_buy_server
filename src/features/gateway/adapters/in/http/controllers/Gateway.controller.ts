import type { NextFunction, Request, Response } from "express";

import type { GetGatewayStatus } from "@/features/gateway/application/use-cases/GetGatewayStatus.uc.js";
import type { GetPublicIntent } from "@/features/gateway/application/use-cases/GetPublicIntent.uc.js";
import type { HandleWompiEvent } from "@/features/gateway/application/use-cases/HandleWompiEvent.uc.js";
import type { ListGatewayIntents } from "@/features/gateway/application/use-cases/ListGatewayIntents.uc.js";
import type {
	VerifyGatewayTransaction,
	VerifyGatewayTransactionInput,
} from "@/features/gateway/application/use-cases/VerifyGatewayTransaction.uc";
import logger from "@/platform/logger/index";
import response from "@/shared/http/Response.utils";
import type { WompiEventPayload } from "@/shared/port/IWompi.port";
import type { Paginate } from "@/shared/types/types.js";

export class GatewayController {
	constructor(
		private readonly getPublicIntent: GetPublicIntent,
		private readonly getStatus: GetGatewayStatus,
		private readonly handleWompiEvent: HandleWompiEvent,
		private readonly verifyTransaction: VerifyGatewayTransaction,
		private readonly listGatewayIntents: ListGatewayIntents,
	) {}

	getIntent = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const intent = await this.getPublicIntent.execute(
				req.params.reference as string,
			);
			response(res, 200, "Cobro encontrado", intent);
		} catch (error) {
			next(error);
		}
	};

	listIntents = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const page = req.query.page ? Number(req.query.page) : 1;
			const limit = req.query.limit ? Number(req.query.limit) : 20;

			const result = await this.listGatewayIntents.execute({
				status: req.query.status as never,
				q: (req.query.q as string | undefined) || undefined,
				page,
				limit,
			});

			const totalPages = Math.ceil(result.total / limit);
			const paginate: Paginate = {
				page,
				limit,
				total: result.total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			};

			response(
				res,
				200,
				"Cobros listados",
				result.intents,
				result.total,
				paginate,
			);
		} catch (error) {
			next(error);
		}
	};

	syncIntent = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const input: VerifyGatewayTransactionInput = {
				reference: req.params.reference as string,
				transactionId:
					(req.query.transactionId as string | undefined) || undefined,
			};
			const result = await this.verifyTransaction.execute(input);
			logger.info("[Wompi] Sincronización de transacción", result);
			response(res, 200, "Estado sincronizado", result);
		} catch (error) {
			next(error);
		}
	};

	status = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const gateways = await this.getStatus.execute();
			response(res, 200, "Estado de pasarelas", gateways);
		} catch (error) {
			next(error);
		}
	};

	wompiEvents = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const payload = req.body as WompiEventPayload;
			const result = await this.handleWompiEvent.execute(payload);
			logger.info("[Wompi] Evento recibido", result);
			response(res, 200, "OK", result);
		} catch (error) {
			next(error);
		}
	};
}
