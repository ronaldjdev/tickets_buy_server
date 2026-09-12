import type { WompiIntentProcessor } from "@/features/gateway/application/use-cases/shared/WompiIntentProcessor.js";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IWompiConfigReader } from "@/shared/contracts/IWompiConfigReader.contract.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";
import type {
	IWompiPort,
	WompiEventPayload,
} from "@/shared/port/IWompi.port.js";

export interface HandleWompiEventResult {
	handled: boolean;
	reason?: string;
	intentStatus?: string;
}

export class HandleWompiEvent {
	constructor(
		private readonly wompiConfigReader: IWompiConfigReader,
		private readonly wompiPort: IWompiPort,
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly processor: WompiIntentProcessor,
		private readonly logger: ILogger,
	) {}

	async execute(payload: WompiEventPayload): Promise<HandleWompiEventResult> {
		const settings = await this.wompiConfigReader.getWompiSettings();
		if (!settings?.enabled || !settings.eventsKey) {
			return { handled: false, reason: "wompi_disabled" };
		}
		if (!this.wompiPort.verifyEventChecksum(payload, settings.eventsKey)) {
			this.logger.warn("[Wompi] Evento con firma inválida, se ignora");
			return { handled: false, reason: "invalid_signature" };
		}

		const transaction = payload.data?.transaction;
		if (payload.event !== "transaction.updated" || !transaction) {
			return { handled: false, reason: "event_ignored" };
		}

		const intent =
			(transaction.reference &&
				(await this.intentRepo.findByReference(transaction.reference))) ||
			(transaction.payment_link_id &&
				(await this.intentRepo.findByLinkId(transaction.payment_link_id)));

		if (!intent) {
			this.logger.warn("[Wompi] Transacción sin cobro asociado", {
				id: transaction.id,
			});
			return { handled: false, reason: "intent_not_found" };
		}
		if (intent.status === "pagada") {
			return {
				handled: false,
				reason: "already_processed",
				intentStatus: intent.status,
			};
		}

		const intentStatus = await this.processor.apply(intent, transaction);
		this.logger.info("[Wompi] Evento procesado", {
			operation: "gateway.handle_wompi_event",
			reference: intent.reference,
			intentStatus,
			transactionId: transaction.id,
		});
		return { handled: true, intentStatus };
	}
}
