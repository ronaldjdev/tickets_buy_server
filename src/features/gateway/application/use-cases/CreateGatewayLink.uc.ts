import { randomBytes } from "node:crypto";
import type { GatewayIntent } from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IContactReader } from "@/shared/contracts/IContactReader.contract.js";
import type { IGatewayCreditReader } from "@/shared/contracts/IGatewayCreditReader.contract.js";
import type { IWompiConfigReader } from "@/shared/contracts/IWompiConfigReader.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";
import type { IWompiPort } from "@/shared/port/IWompi.port.js";
import type { IWhatsAppTextSender } from "./IWhatsAppTextSender.port.js";

export interface CreateGatewayLinkInput {
  creditId: string;
  amount: number;
  sendWhatsApp?: boolean;
  message?: string;
  expiresInDays?: number;
}

const DEFAULT_TEMPLATE =
  "Hola {nombre}, aquí tienes tu enlace de pago por {monto} del crédito {credito}: {url}";

export class CreateGatewayLink {
  constructor(
    private readonly wompiConfigReader: IWompiConfigReader,
    private readonly wompiPort: IWompiPort,
    private readonly intentRepo: IGatewayIntentRepository,
    private readonly creditReader: IGatewayCreditReader,
    private readonly contactReader: IContactReader,
    private readonly whatsAppSender: IWhatsAppTextSender,
    private readonly logger: ILogger,
    private readonly redirectBaseUrl?: string
  ) {}

  private validate(input: CreateGatewayLinkInput): void {
    if (!input.creditId) throw new UseCaseError("El crédito es obligatorio.");
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new UseCaseError("El monto del cobro debe ser mayor a cero.");
    }
  }

  private buildMessage(
    template: string | undefined,
    contactName: string,
    amount: number,
    creditId: string,
    url: string
  ): string {
    const formatted = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(amount);
    return (template?.trim() || DEFAULT_TEMPLATE)
      .replaceAll("{nombre}", contactName || "cliente")
      .replaceAll("{monto}", formatted)
      .replaceAll("{credito}", creditId)
      .replaceAll("{url}", url);
  }

  async execute(
    input: CreateGatewayLinkInput
  ): Promise<{ intent: GatewayIntent; sentViaWhatsApp: boolean }> {
    this.validate(input);

    const settings = await this.wompiConfigReader.getWompiSettings();
    if (!settings?.enabled || !settings.privateKey) {
      throw new UseCaseError("Wompi no está habilitado o falta la llave privada.");
    }

    const credit = await this.creditReader.findById(input.creditId);
    if (!credit) throw new UseCaseError("El crédito no existe.");
    if (credit.status === "pagado") throw new UseCaseError("El crédito ya fue pagado.");

    const contact = credit.userId ? await this.contactReader.findById(credit.userId) : null;

    const amountInCents = Math.round(input.amount * 100);
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    const reference = `${input.creditId}-${randomBytes(6).toString("hex")}`;

    let intent = await this.intentRepo.create({
      reference,
      gateway: "wompi",
      mode: "link",
      creditId: input.creditId,
      contactId: credit.userId,
      contactName: contact?.name ?? credit.userName,
      contactPhone: contact?.phone,
      amountInCents,
      currency: "COP",
      status: "creada",
      expiresAt
    });

    const link = await this.wompiPort.createPaymentLink(
      {
        name: `Pago crédito ${input.creditId}`,
        description: `Cobro Celux referencia ${reference}`,
        amountInCents,
        singleUse: true,
        expiresAt,
        sku: reference.slice(0, 36),
        redirectUrl: this.redirectBaseUrl ? `${this.redirectBaseUrl}/pagar/${reference}` : undefined
      },
      settings.privateKey
    );

    intent =
      (await this.intentRepo.updateByReference(reference, {
        linkId: link.id,
        checkoutUrl: link.url
      })) ?? intent;

    let sentViaWhatsApp = false;
    if (input.sendWhatsApp !== false && contact?.phone) {
      try {
        const body = this.buildMessage(
          input.message,
          contact.name,
          input.amount,
          input.creditId,
          link.url
        );
        await this.whatsAppSender.send(contact.phone, body);
        sentViaWhatsApp = true;
      } catch (error) {
        this.logger.warn("[Gateway] No se pudo enviar el WhatsApp con el enlace", error);
      }
    }

    return { intent, sentViaWhatsApp };
  }
}
