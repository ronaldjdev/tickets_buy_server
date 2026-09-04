import type { ClientSession } from "mongoose";

import type { GatewayIntent } from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import { RepositoryError } from "@/shared/errors/RepositoryError.js";

import GatewayIntentModel from "../schemas/GatewayIntent.schema.js";

export class GatewayIntentRepository implements IGatewayIntentRepository {
  async create(intent: Partial<GatewayIntent>, session?: ClientSession): Promise<GatewayIntent> {
    try {
      const doc = await GatewayIntentModel.create([intent], { session });
      return doc[0].toObject() as unknown as GatewayIntent;
    } catch (error) {
      throw new RepositoryError(`No se pudo crear el cobro: ${(error as Error).message}`);
    }
  }

  async findByReference(reference: string): Promise<GatewayIntent | null> {
    const doc = await GatewayIntentModel.findOne({ reference }).lean();
    return (doc as unknown as GatewayIntent) ?? null;
  }

  async findByLinkId(linkId: string): Promise<GatewayIntent | null> {
    const doc = await GatewayIntentModel.findOne({ linkId }).sort({ createdAt: -1 }).lean();
    return (doc as unknown as GatewayIntent) ?? null;
  }

  async updateByReference(
    reference: string,
    data: Partial<GatewayIntent>,
    session?: ClientSession
  ): Promise<GatewayIntent | null> {
    const doc = await GatewayIntentModel.findOneAndUpdate({ reference }, data, {
      new: true,
      session
    }).lean();
    return (doc as unknown as GatewayIntent) ?? null;
  }
}
