import { randomBytes } from "node:crypto";
import type {
	GatewayLinkRequest,
	GatewayLinkResult,
	IGatewayLinkCreator,
} from "../../../../shared/contracts/IGatewayLinkCreator.contract.js";
import type { IWompiConfigReader } from "../../../../shared/contracts/IWompiConfigReader.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { IGatewayIntentRepository } from "../../domain/repositories/IGatewayIntent.repository.js";

export class CreateTicketPayment implements IGatewayLinkCreator {
	constructor(
		private readonly wompiConfigReader: IWompiConfigReader,
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly logger: ILogger,
		private readonly redirectBaseUrl?: string,
	) {}

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
		const checkoutUrl = this.redirectBaseUrl
			? `${this.redirectBaseUrl}/pagar/${reference}`
			: `${reference}`;

		const intent = await this.intentRepo.create({
			reference,
			gateway: "wompi",
			mode: "widget",
			purchaseId: input.purchaseId,
			ticketIds: input.ticketIds,
			contactId: input.contactId,
			contactName: input.contactName,
			contactPhone: input.contactPhone,
			amountInCents: input.amountInCents,
			currency: "COP",
			status: "creada",
			expiresAt,
			checkoutUrl,
		});

		this.logger.info("Cobro con Widget creado", {
			operation: "gateway.create_ticket_payment",
			reference: intent.reference,
			amountInCents: intent.amountInCents,
			purchaseId: intent.purchaseId,
			checkoutUrl,
		});

		return {
			reference: intent.reference,
			checkoutUrl,
			amountInCents: intent.amountInCents,
			purchaseId: intent.purchaseId,
		};
	}
}
