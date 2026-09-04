import type {
  GatewayIntent,
  PublicGatewayIntent
} from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IPublicIntentConfig } from "@/shared/contracts/IPublicIntentConfig.contract.js";
import type { IWompiConfigReader } from "@/shared/contracts/IWompiConfigReader.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import { buildIntegritySignature } from "./CreateWidgetSession.uc.js";

export class GetPublicIntent {
  constructor(
    private readonly intentRepo: IGatewayIntentRepository,
    private readonly publicConfig: IPublicIntentConfig,
    private readonly wompiConfigReader: IWompiConfigReader
  ) {}

  private async toPublic(
    intent: GatewayIntent,
    businessName?: string
  ): Promise<PublicGatewayIntent> {
    const base = {
      reference: intent.reference,
      gateway: intent.gateway,
      status: intent.status,
      amountInCents: intent.amountInCents,
      currency: intent.currency,
      contactName: intent.contactName,
      businessName
    };

    if (intent.status !== "creada" || intent.gateway !== "wompi") {
      return { ...base, widget: null };
    }

    const settings = await this.wompiConfigReader.getWompiSettings();
    if (!settings?.enabled || !settings.publicKey || !settings.integrityKey) {
      return { ...base, widget: null };
    }

    return {
      ...base,
      widget: {
        publicKey: settings.publicKey,
        signatureIntegrity: buildIntegritySignature(
          intent.reference,
          intent.amountInCents,
          intent.currency,
          settings.integrityKey
        )
      }
    };
  }

  async execute(reference: string): Promise<PublicGatewayIntent> {
    if (!reference) throw new UseCaseError("La referencia es obligatoria.");
    const intent = await this.intentRepo.findByReference(reference);
    if (!intent) throw new UseCaseError("Cobro no encontrado.");
    const businessName = await this.publicConfig.getBusinessName();
    return await this.toPublic(intent, businessName);
  }
}
