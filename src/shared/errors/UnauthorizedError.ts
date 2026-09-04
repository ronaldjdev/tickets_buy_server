// src/shared/errors/UnauthorizedError.ts
import { AppError } from "./AppError.js";

/**
 * UnauthorizedError - Error de autenticación
 *
 * Uso: Problemas de autenticación y autorización.
 * Contexto:
 * - Token JWT expirado o inválido
 * - Credenciales incorrectas
 * - Sesión no válida o expirada
 * - Falta de token de acceso
 *
 * Capa:
 * - Middlewares de autenticación (firebase-auth.middleware.ts)
 * - Adaptadores de autenticación (src/adapters/out/auth/)
 * - Use cases que requieren autenticación
 *
 * HTTP Status: 401 Unauthorized
 *
 * Ejemplo:
 * ```typescript
 * if (!idToken) {
 *   throw new UnauthorizedError("Token de acceso requerido.");
 * }
 *
 * if (error.code === 'auth/id-token-expired') {
 *   throw new UnauthorizedError("Token expirado.");
 * }
 * ```
 */
export class UnauthorizedError extends AppError {
	constructor(message = "Acceso no autorizado") {
		super(message, 401, "UnauthorizedError");
	}
}
