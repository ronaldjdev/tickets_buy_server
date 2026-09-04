// src/shared/errors/ValidationError.ts
import { AppError } from "./AppError.js";

/**
 * ValidationError - Error de validación de entrada
 *
 * Uso: Datos de entrada inválidos o que no cumplen requisitos.
 * Contexto:
 * - Parámetros de entrada faltantes o inválidos
 * - Formato de datos incorrecto (email, teléfono, etc.)
 * - Validaciones de esquema (Joi, Zod)
 * - Constraints de Firebase (weak-password, invalid-email)
 *
 * Capa:
 * - Controllers (src/adapters/in/http/controllers/)
 * - Validation middlewares
 * - Adaptadores que validan input (Firebase)
 *
 * HTTP Status: 400 Bad Request
 *
 * Ejemplo:
 * ```typescript
 * if (!data.email || !data.password) {
 *   throw new ValidationError("Email y contraseña son requeridos.");
 * }
 *
 * if (error.code === 'auth/weak-password') {
 *   throw new ValidationError(
 *     "La contraseña debe tener al menos 6 caracteres."
 *   );
 * }
 *
 * // Con detalles adicionales
 * throw new ValidationError("Datos inválidos", {
 *   email: "formato incorrecto",
 *   phone: "requerido"
 * });
 * ```
 */
export class ValidationError extends AppError {
	public readonly details?: Record<string, any>;

	constructor(message: string, details?: Record<string, any>) {
		super(message, 400, "ValidationError");
		this.details = details;
	}
}
