import type { NextFunction, Request, Response } from "express";

import type { CreateGatewayLinkDTO } from "@/features/gateway/adapters/in/http/dto/gateway.dto.js";
import type { CreateGatewayLink } from "@/features/gateway/application/use-cases/CreateGatewayLink.uc.js";
import type { CreateWidgetSession } from "@/features/gateway/application/use-cases/CreateWidgetSession.uc.js";
import type { GetGatewayStatus } from "@/features/gateway/application/use-cases/GetGatewayStatus.uc.js";
import type { GetPublicIntent } from "@/features/gateway/application/use-cases/GetPublicIntent.uc.js";
import type { HandleWompiEvent } from "@/features/gateway/application/use-cases/HandleWompiEvent.uc.js";
import type {
	VerifyGatewayTransaction,
	VerifyGatewayTransactionInput,
} from "@/features/gateway/application/use-cases/VerifyGatewayTransaction.uc";
import logger from "@/platform/logger/index";
import response from "@/shared/http/Response.utils";
import type { WompiEventPayload } from "@/shared/port/IWompi.port";

export class GatewayController {
	constructor(
		private readonly createLink: CreateGatewayLink,
		private readonly createWidgetSession: CreateWidgetSession,
		private readonly getPublicIntent: GetPublicIntent,
		private readonly getStatus: GetGatewayStatus,
		private readonly handleWompiEvent: HandleWompiEvent,
		private readonly verifyTransaction: VerifyGatewayTransaction,
	) {}

	createPaymentLink = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const input = req.body as CreateGatewayLinkDTO;
			const result = await this.createLink.execute(input);
			response(res, 201, "Enlace de pago generado", {
				intent: result.intent,
				sentViaWhatsApp: result.sentViaWhatsApp,
			});
		} catch (error) {
			next(error);
		}
	};

	createWidget = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const session = await this.createWidgetSession.execute(req.body);
			response(res, 201, "Sesión de widget creada", session);
		} catch (error) {
			next(error);
		}
	};

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
