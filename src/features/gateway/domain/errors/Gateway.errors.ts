import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class GatewayDisabledError extends UseCaseError {
  constructor(gateway = "la pasarela") {
    super(`${gateway} no está habilitada o falta configuración de credenciales.`);
  }
}
