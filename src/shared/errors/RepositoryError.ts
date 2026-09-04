// src/shared/errors/RepositoryError.ts
import { AppError } from "./AppError.js";

/**
 * RepositoryError - Error de capa de persistencia
 *
 * Uso: Errores en operaciones de base de datos o almacenamiento externo.
 * Contexto:
 * - Fallos de conexión a MongoDB
 * - Errores en queries de base de datos
 * - Problemas de Firebase (auth operations)
 * - Errores en adaptadores de infraestructura (src/adapters/out/)
 *
 * Capa: src/adapters/out/database/ y src/adapters/out/auth/
 * HTTP Status: 500 Internal Server Error
 *
 * Ejemplo:
 * ```typescript
 * try {
 *   await this.model.create(data);
 * } catch (error) {
 *   throw new RepositoryError(
 *     "Error al crear usuario en Firebase.",
 *     error
 *   );
 * }
 * ```
 */
export class RepositoryError extends AppError {
	public readonly originalError?: Error;

	constructor(message: string, originalError?: Error) {
		super(message, 500, "RepositoryError");
		this.originalError = originalError;
	}
}
