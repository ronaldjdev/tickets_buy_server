// src/shared/errors/DomainError.ts
import { AppError } from "./AppError.js";

/**
 * DomainError - Error de reglas de dominio
 *
 * Uso: Violaciones de invariantes y reglas de negocio del dominio.
 * Contexto:
 * - Reglas de negocio no cumplidas (entidades/core)
 * - Invariantes del dominio violadas
 * - Lógica de negocio fundamental comprometida
 *
 * Capa: Exclusivo de src/domain/entities/ y src/domain/
 * HTTP Status: 422 Unprocessable Entity
 *
 * Ejemplo:
 * ```typescript
 * // En una entidad Lead
 * if (!this.email && !this.phone) {
 *   throw new DomainError("Un lead debe tener al menos email o teléfono.");
 * }
 *
 * // En validación de estado de Call
 * if (this.status === CallStatus.COMPLETED && !this.duration) {
 *   throw new DomainError("Una llamada completada debe tener duración.");
 * }
 * ```
 */
export class DomainError extends AppError {
	constructor(message: string) {
		super(message, 422, "DomainError");
	}
}
