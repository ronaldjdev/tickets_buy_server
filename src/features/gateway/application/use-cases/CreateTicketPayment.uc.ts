import { randomBytes } from "node:crypto";

import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type {
	GatewayLinkRequest,
	GatewayLinkResult,
	IGatewayLinkCreator,
} from "@/shared/contracts/IGatewayLinkCreator.contract.js";
import type { IWompiConfigReader } from "@/shared/contracts/IWompiConfigReader.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { IWompiPort } from "@/shared/port/IWompi.port.js";

export class CreateTicketPayment implements IGatewayLinkCreator {
	constructor(
		private readonly wompiConfigReader: IWompiConfigReader,
		private readonly wompiPort: IWompiPort,
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly redirectBaseUrl?: string,
	) { }

	private validate(input: GatewayLinkRequest): void {
		if (!input.purchaseId) throw new UseCaseError("La compra es obligatoria.");
		if (!input.ticketIds?.length)
			throw new UseCaseError("Debe existir al menos un ticket.");
		if (!Number.isFinite(input.amountInCents) || input.amountInCents <= 0) {
			throw new UseCaseError("El monto del cobro debe ser mayor a cero.");
		}
	}

	async execute(input: GatewayLinkRequest): Promise<GatewayLinkResult> {
		this.validate(input);

		const settings = await this.wompiConfigReader.getWompiSettings();
		if (!settings?.enabled || !settings.privateKey) {
			throw new UseCaseError(
				"Wompi no está habilitado o falta la llave privada.",
			);
		}

		const expiresAt = new Date(
			Date.now() + (input.expiresInMinutes ?? 15) * 60 * 1000,
		);
		const reference = `${input.purchaseId}-${randomBytes(6).toString("hex")}`;

		const intent = await this.intentRepo.create({
			reference,
			gateway: "wompi",
			mode: "link",
			purchaseId: input.purchaseId,
			ticketIds: input.ticketIds,
			contactId: input.contactId,
			contactName: input.contactName,
			contactPhone: input.contactPhone,
			amountInCents: input.amountInCents,
			currency: "COP",
			status: "creada",
			expiresAt,
		});

		const link = await this.wompiPort.createPaymentLink(
			{
				name: `Boletos sorteo ${input.purchaseId}`,
				description: `Compra de boletos referencia ${reference}`,
				amountInCents: input.amountInCents,
				singleUse: true,
				expiresAt,
				sku: reference.slice(0, 36),
				redirectUrl: this.redirectBaseUrl
					? `${this.redirectBaseUrl}/pagar/${reference}`
					: undefined,
			},
			settings.privateKey,
		);

		const stored =
			(await this.intentRepo.updateByReference(reference, {
				linkId: link.id,
				checkoutUrl: link.url,
			})) ?? intent;

		return {
			reference: stored.reference,
			checkoutUrl: stored.checkoutUrl!,
			amountInCents: stored.amountInCents,
			purchaseId: stored.purchaseId,
		};
	}
}
