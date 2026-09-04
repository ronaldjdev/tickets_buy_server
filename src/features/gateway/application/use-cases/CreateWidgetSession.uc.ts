import { createHash, randomBytes } from "node:crypto";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IGatewayCreditReader } from "@/shared/contracts/IGatewayCreditReader.contract.js";
import type { IWompiConfigReader } from "@/shared/contracts/IWompiConfigReader.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export interface CreateWidgetSessionInput {
  creditId: string;
  amount: number;
  expiresInDays?: number;
}

export interface WidgetSessionData {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: string;
  signatureIntegrity: string;
}

export function buildIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integrityKey: string
): string {
  const concat = `${reference}${amountInCents}${currency}${integrityKey}`;
  return createHash("sha256").update(concat).digest("hex");
}

export class CreateWidgetSession {
  constructor(
    private readonly wompiConfigReader: IWompiConfigReader,
    private readonly intentRepo: IGatewayIntentRepository,
    private readonly creditReader: IGatewayCreditReader
  ) {}

  async execute(input: CreateWidgetSessionInput): Promise<WidgetSessionData> {
    if (!input.creditId) throw new UseCaseError("El crédito es obligatorio.");
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new UseCaseError("El monto del cobro debe ser mayor a cero.");
    }

    const settings = await this.wompiConfigReader.getWompiSettings();
    if (!settings?.enabled || !settings.publicKey || !settings.integrityKey) {
      throw new UseCaseError(
        "Wompi no está habilitado o faltan las llaves públicas/de integridad."
      );
    }

    const credit = await this.creditReader.findById(input.creditId);
    if (!credit) throw new UseCaseError("El crédito no existe.");
    if (credit.status === "pagado") throw new UseCaseError("El crédito ya fue pagado.");

    const amountInCents = Math.round(input.amount * 100);
    const currency = "COP";
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    const reference = `${input.creditId}-w-${randomBytes(6).toString("hex")}`;

    await this.intentRepo.create({
      reference,
      gateway: "wompi",
      mode: "widget",
      creditId: input.creditId,
      contactId: credit.userId,
      contactName: credit.userName,
      amountInCents,
      currency,
      status: "creada",
      expiresAt
    });

    const signatureIntegrity = buildIntegritySignature(
      reference,
      amountInCents,
      currency,
      settings.integrityKey
    );

    return {
      publicKey: settings.publicKey,
      reference,
      amountInCents,
      currency,
      signatureIntegrity
    };
  }
}
