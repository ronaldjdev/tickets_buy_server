import type { IPublicIntentConfig } from "../../../../shared/contracts/IPublicIntentConfig.contract.js";
import type { IWompiConfigReader } from "../../../../shared/contracts/IWompiConfigReader.contract.js";
import type { IRaffleService } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { ITicketRepository } from "../../../ticket/domain/repositories/ITicket.repository.js";
import { buildIntegritySignature } from "../../adapters/out/wompi/WompiSignature.utils.js";
import type {
	GatewayIntent,
	PublicGatewayIntent,
} from "../../domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "../../domain/repositories/IGatewayIntent.repository.js";

export class GetPublicIntent {
	constructor(
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly publicConfig: IPublicIntentConfig,
		private readonly wompiConfigReader: IWompiConfigReader,
		private readonly ticketRepository: ITicketRepository,
		private readonly raffleService: IRaffleService,
	) {}

	private async toPublic(
		intent: GatewayIntent,
		businessName?: string,
	): Promise<PublicGatewayIntent> {
		const base: PublicGatewayIntent = {
			reference: intent.reference,
			gateway: intent.gateway,
			status: intent.status,
			amountInCents: intent.amountInCents,
			currency: intent.currency,
			contactName: intent.contactName,
			businessName,
			purchaseId: intent.purchaseId,
			expiresAt: intent.expiresAt?.toISOString() ?? null,
			widget: null,
		};

		if (intent.status === "pagada") {
			const tickets = await this.ticketRepository.findByIds(
				intent.ticketIds ?? [],
			);
			base.ticketNumbers = tickets.map((t) => t.number).sort((a, b) => a - b);

			const raffleId = tickets[0]?.raffleId ?? intent.raffleId;
			if (raffleId) {
				const raffle = await this.raffleService.findById(raffleId);
				base.maxTickets = raffle?.maxTickets;
			}
			base.plays = intent.plays ?? 0;
		}

		if (intent.status !== "creada" || intent.gateway !== "wompi") {
			return base;
		}

		const settings = await this.wompiConfigReader.getWompiSettings();
		if (!settings?.enabled || !settings.publicKey || !settings.integrityKey) {
			return base;
		}

		return {
			...base,
			widget: {
				publicKey: settings.publicKey,
				signatureIntegrity: buildIntegritySignature(
					intent.reference,
					intent.amountInCents,
					intent.currency,
					settings.integrityKey,
				),
			},
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
