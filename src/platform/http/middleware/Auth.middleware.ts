import type { NextFunction, Request, Response } from "express";

import { UserRepository } from "@/features/user/adapters/out/persistence/repositories/User.repository.js";
import { getAuthApi } from "@/platform/auth/auth.config.js";
import logger from "@/platform/logger/index.js";
import { AppError } from "@/shared/errors/AppError.js";

const userRepo = new UserRepository();

export async function requireAuth(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	try {
		const auth = await getAuthApi();
		const session = await auth.getSession({
			headers: req.headers as Record<string, string>,
		});

		if (!session?.user) {
			throw new AppError("Sesión inválida o expirada", 401);
		}

		const user = await userRepo.findByUserId(session.user.id);

		if (!user) {
			throw new AppError("Usuario no encontrado", 401);
		}

		if (user.status !== "activo") {
			const messages: Record<string, string> = {
				pendiente:
					"Tu cuenta está pendiente de aprobación por un administrador",
				suspendido: "Tu cuenta ha sido suspendida. Contacta al administrador",
				bloqueado: "Tu cuenta ha sido bloqueada. Contacta al administrador",
			};
			throw new AppError(messages[user.status] || "Cuenta no activa", 403);
		}

		req.user = {
			id: session.user.id,
			email: session.user.email,
			name: session.user.name,
			role: (session.user as any).role || "vendedor",
		};

		next();
	} catch (error: any) {
		if (error instanceof AppError) {
			next(error);
		} else {
			logger.error("Error en middleware de autenticación:", {
				error: error.message,
			});
			next(new AppError("Error de autenticación", 401));
		}
	}
}

export function requireRole(...roles: string[]) {
	return (req: Request, _res: Response, next: NextFunction) => {
		if (!req.user) {
			return next(new AppError("No autorizado", 401));
		}
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError("No tienes permisos para realizar esta acción", 403),
			);
		}
		next();
	};
}
