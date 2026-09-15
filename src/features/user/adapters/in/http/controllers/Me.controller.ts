import type { NextFunction, Request, Response } from "express";
import { getAuthApi } from "../../../../../../platform/auth/auth.config.js";
import logger from "../../../../../../platform/logger/index.js";
import response from "../../../../../../shared/http/Response.utils.js";
import type {
	CreateUser,
	UpdateUser,
} from "../../../../application/use-cases/index.js";
import type { IUserRepository } from "../../../../domain/repositories/IUser.repository.js";

export class MeController {
	constructor(
		private readonly userRepo: IUserRepository,
		private readonly updateUser: UpdateUser,
		private readonly createUser: CreateUser,
	) {}

	get = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.user) return response(res, 401, "No autenticado");
			let user = await this.userRepo.findByUserId(req.user.id);
			if (!user) {
				const userCount = await this.userRepo.count();
				const isFirstUser = userCount === 0;
				user = await this.createUser.execute({
					userId: req.user.id,
					name: req.user.name || "Sin nombre",
					email: req.user.email,
					documentType: "CC",
					documentNumber: "pendiente",
					phone: "pendiente",
					role: isFirstUser ? "admin" : "vendedor",
					status: isFirstUser ? "activo" : "pendiente",
				} as any);
				if (isFirstUser) {
					try {
						const auth = await getAuthApi();
						await (auth as any).setRole({
							body: { userId: req.user.id, role: "admin" },
							headers: req.headers,
						});
					} catch (err) {
						logger.warn("No se pudo sincronizar rol admin con Better Auth", {
							error: err,
						});
					}
				}
				logger.info("Perfil auto-creado para usuario:", {
					userId: req.user.id,
				});
			}
			response(res, 200, "Perfil obtenido correctamente.", user);
		} catch (error: any) {
			next(error);
		}
	};

	update = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.user) return response(res, 401, "No autenticado");
			const body = req.body as Record<string, unknown>;
			const user = await this.userRepo.findByUserId(req.user.id);
			if (!user) return response(res, 404, "Usuario no encontrado");
			const allowedFields = ["name", "phone"];
			const filteredBody: Record<string, unknown> = Object.keys(body)
				.filter((k) => allowedFields.includes(k))
				.reduce(
					(obj, k) => {
						obj[k] = body[k];
						return obj;
					},
					{} as Record<string, unknown>,
				);
			const updated = await this.updateUser.execute(
				(user as any)._id,
				filteredBody,
			);

			if (filteredBody.name) {
				try {
					const auth = await getAuthApi();
					await (auth as any).updateUser({
						body: { name: filteredBody.name },
						headers: req.headers,
					});
				} catch (err) {
					logger.warn("No se pudo sincronizar nombre con Better Auth", {
						userId: req.user.id,
						error: (err as Error)?.message,
					});
				}
			}

			response(res, 200, "Perfil actualizado correctamente.", updated);
		} catch (error: any) {
			next(error);
		}
	};
}
