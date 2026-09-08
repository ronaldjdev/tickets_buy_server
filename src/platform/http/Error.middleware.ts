import type { NextFunction, Request, Response } from "express";
import logger from "@/platform/logger/index.js";
import { AppError } from "@/shared/errors/AppError.js";
import response from "@/shared/http/Response.utils.js";

export function errorHandler(
	error: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
) {
	if (error instanceof AppError) {
		return response(res, error.statusCode, error.message);
	}

	const message = (error as Error)?.message ?? "Error interno del servidor";
	logger.error("Error no controlado:", {
		error: message,
		stack: (error as Error)?.stack,
	});
	return response(res, 500, message);
}
