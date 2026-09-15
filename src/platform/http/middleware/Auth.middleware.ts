import type { NextFunction, Request, Response } from "express";

import { UserRepository } from "../../../features/user/adapters/out/persistence/repositories/User.repository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { getAuthApi } from "../../auth/auth.config.js";
import logger from "../../logger/index.js";

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

		if (session?.user) {
			await attachUser(req, session.user, true);
			return next();
		}

		throw new AppError("Sesión inválida o expirada", 401);
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

export async function optionalAuth(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	try {
		const auth = await getAuthApi();
		const session = await auth.getSession({
			headers: req.headers as Record<string, string>,
		});

		if (session?.user) {
			await attachUser(req, session.user, false);
		}
		next();
	} catch {
		next();
	}
}

async function attachUser(req: Request, sessionUser: any, strict: boolean) {
	const user = await userRepo.findByUserId(sessionUser.id);
	if (!user) return;

	const role = sessionUser.role || "vendedor";

	if (user.status !== "activo") {
		if (strict) {
			const messages: Record<string, string> = {
				pendiente:
					"Tu cuenta está pendiente de aprobación por un administrador",
				suspendido: "Tu cuenta ha sido suspendida. Contacta al administrador",
				bloqueado: "Tu cuenta ha sido bloqueada. Contacta al administrador",
			};
			throw new AppError(messages[user.status] || "Cuenta no activa", 403);
		}
		return;
	}

	req.user = {
		id: sessionUser.id,
		email: sessionUser.email,
		name: sessionUser.name,
		role: user.role || role,
	};
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
