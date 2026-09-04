// src/shared/errors/AppError.ts

/**
 * AppError - Error de aplicación genérico
 *
 * Uso: Errores controlados a nivel de aplicación que no encajan en categorías específicas.
 * Contexto:
 * - Errores de negocio generales (usuario no encontrado - 404)
 * - Recursos no disponibles
 * - Operaciones no permitidas por reglas de negocio
 *
 * Capa: Puede ser lanzado desde cualquier capa
 *
 * Ejemplo:
 * ```typescript
 * throw new AppError("Usuario no encontrado.", 404);
 * throw new AppError("Operación no permitida.", 403);
 * ```
 */
export class AppError extends Error {
	public readonly statusCode: number;
	public readonly name: string;

	constructor(message: string, statusCode = 500, name = "AppError") {
		super(message);
		this.statusCode = statusCode;
		this.name = name;

		Error.captureStackTrace(this, this.constructor);
	}
}
