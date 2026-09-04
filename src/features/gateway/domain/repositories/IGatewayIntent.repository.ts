import type { GatewayIntent } from "../entities/GatewayIntent.entity.js";

export interface IGatewayIntentRepository {
  create(intent: Partial<GatewayIntent>): Promise<GatewayIntent>;
  findByReference(reference: string): Promise<GatewayIntent | null>;
  findByLinkId(linkId: string): Promise<GatewayIntent | null>;
  updateByReference(reference: string, data: Partial<GatewayIntent>): Promise<GatewayIntent | null>;
}
