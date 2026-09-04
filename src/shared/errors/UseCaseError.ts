// src/shared/errors/UseCaseError.ts
import { AppError } from "./AppError.js";

/**
 * UseCaseError - Error en lógica de casos de uso
 *
 * Uso: Errores durante la ejecución de casos de uso de aplicación.
 * Contexto:
 * - Flujos de negocio que fallan (CreateLead, ProcessCall)
 * - Orquestación de operaciones complejas
 * - Coordinación entre múltiples repositorios
 * - Validaciones de flujo de negocio
 *
 * Capa: Exclusivo de src/application/use-cases/
 * HTTP Status: 400 Bad Request (configurable)
 *
 * Ejemplo:
 * ```typescript
 * // En ProcessPendingLead use case
 * if (pendingLeads.length === 0) {
 *   throw new UseCaseError("No hay leads pendientes para procesar.");
 * }
 *
 * // En InitiateCall use case
 * if (lead.callAttempts >= MAX_ATTEMPTS) {
 *   throw new UseCaseError(
 *     "Lead ha excedido el máximo de intentos de llamada."
 *   );
 * }
 * ```
 */
export class UseCaseError extends AppError {
	constructor(message: string, statusCode = 400) {
		super(message, statusCode, "UseCaseError");
	}
}
