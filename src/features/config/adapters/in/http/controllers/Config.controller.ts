import type { NextFunction, Request, Response } from "express";
import type {
	AddConfig,
	GetConfig,
	TestEmailIntegration,
	UpdateConfig,
} from "@/features/config/application/use-cases/index.js";
import type { Config } from "@/features/config/domain/entities/Config.entity.js";
import type { EmailIntegrationSettings } from "@/infra/email/index.js";
import response from "@/shared/http/Response.utils.js";

export class ConfigController {
	constructor(
		private readonly addConfig: AddConfig,
		private readonly getConfig: GetConfig,
		private readonly updateConfig: UpdateConfig,
		private readonly testEmailUc: TestEmailIntegration,
	) {}

	add = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const config = await this.addConfig.execute(req.body as Config);
			response(res, 201, "Configuración guardada", config);
		} catch (error) {
			next(error);
		}
	};

	get = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const config = await this.getConfig.execute();
			response(res, 200, "Configuración encontrada", config);
		} catch (error) {
			next(error);
		}
	};

	public = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const config = await this.getConfig.execute();
			response(res, 200, "Configuración pública", {
				general: {
					nameBusiness: config?.general?.nameBusiness,
					email: config?.general?.email,
					phone: config?.general?.phone,
					logoUrl: config?.general?.logoUrl,
				},
				homepage: config?.homepage ?? null,
			});
		} catch (error) {
			next(error);
		}
	};

	update = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const config = await this.updateConfig.execute(
				req.body as Partial<Config>,
			);
			response(res, 200, "Configuración actualizada", config);
		} catch (error) {
			next(error);
		}
	};

	testEmail = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await this.testEmailUc.execute(
				req.body as EmailIntegrationSettings,
			);
			response(res, result.ok ? 200 : 422, result.message, result);
		} catch (error) {
			next(error);
		}
	};
}
