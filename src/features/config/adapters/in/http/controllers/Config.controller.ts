import type { NextFunction, Request, Response } from "express";
import type {
	AddConfig,
	GetConfig,
	UpdateConfig,
} from "@/features/config/application/use-cases/index.js";
import type { Config } from "@/features/config/domain/entities/Config.entity.js";
import response from "@/shared/http/Response.utils.js";

export class ConfigController {
	constructor(
		private readonly addConfig: AddConfig,
		private readonly getConfig: GetConfig,
		private readonly updateConfig: UpdateConfig,
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
				},
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
}
