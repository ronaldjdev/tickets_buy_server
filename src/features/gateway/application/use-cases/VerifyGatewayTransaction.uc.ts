import type { WompiIntentProcessor } from "@/features/gateway/application/use-cases/shared/WompiIntentProcessor.js";
import type { GatewayIntent } from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IWompiConfigReader } from "@/shared/contracts/IWompiConfigReader.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type {
	IWompiPort,
	WompiEventTransaction,
} from "@/shared/port/IWompi.port.js";

export interface VerifyGatewayTransactionInput {
	reference: string;
	transactionId?: string;
}

export interface VerifyGatewayTransactionResult {
	reference: string;
	status: GatewayIntent["status"];
	updated: boolean;
}

export class VerifyGatewayTransaction {
	constructor(
		private readonly wompiConfigReader: IWompiConfigReader,
		private readonly wompiPort: IWompiPort,
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly processor: WompiIntentProcessor,
	) {}

	async execute(
		input: VerifyGatewayTransactionInput,
	): Promise<VerifyGatewayTransactionResult> {
		if (!input?.reference)
			throw new UseCaseError("La referencia es obligatoria.");

		const intent = await this.intentRepo.findByReference(input.reference);
		if (!intent) throw new UseCaseError("Cobro no encontrado.");
		if (intent.gateway !== "wompi")
			throw new UseCaseError("El cobro no pertenece a Wompi.");

		const unchanged: VerifyGatewayTransactionResult = {
			reference: intent.reference,
			status: intent.status,
			updated: false,
		};

		if (intent.status !== "creada") return unchanged;

		const settings = await this.wompiConfigReader.getWompiSettings();
		if (!settings?.enabled || !settings.privateKey) return unchanged;

		const transaction = await this.findTransaction(
			intent,
			input.transactionId,
			settings.privateKey,
		);
		if (!transaction || !this.belongsToIntent(intent, transaction))
			return unchanged;
		if (transaction.status === "PENDING") return unchanged;

		const status = await this.processor.apply(intent, transaction);
		return { reference: intent.reference, status, updated: true };
	}

	private async findTransaction(
		intent: GatewayIntent,
		transactionId: string | undefined,
		privateKey: string,
	): Promise<WompiEventTransaction | null> {
		if (transactionId) {
			return await this.wompiPort.getTransaction(transactionId, privateKey);
		}
		if (!intent.linkId) return null;
		const transactions = await this.wompiPort.getLinkTransactions(
			intent.linkId,
			privateKey,
		);
		return transactions[0] ?? null;
	}

	private belongsToIntent(
		intent: GatewayIntent,
		transaction: WompiEventTransaction,
	): boolean {
		const matchesReference = Boolean(
			transaction.reference && transaction.reference === intent.reference,
		);
		const matchesLink = Boolean(
			intent.linkId && transaction.payment_link_id === intent.linkId,
		);
		return matchesReference || matchesLink;
	}
}
