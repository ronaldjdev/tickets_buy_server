import type { GatewayIntent } from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type {
	ConfirmTicketPaymentInput,
	IConfirmTicketPayment,
} from "@/shared/contracts/IConfirmTicketPayment.contract.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";
import type {
	WompiEventTransaction,
	WompiTransactionStatus,
} from "@/shared/port/IWompi.port.js";
import type { PaymentMethod } from "@/shared/types/types.js";

export const INTENT_STATUS_MAP: Record<
	WompiTransactionStatus,
	GatewayIntent["status"]
> = {
	APPROVED: "pagada",
	DECLINED: "declinada",
	VOIDED: "anulada",
	ERROR: "error",
	PENDING: "creada",
};

export class WompiIntentProcessor {
	constructor(
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly confirmTicketPayment: IConfirmTicketPayment,
		private readonly logger: ILogger,
	) {}

	async apply(
		intent: GatewayIntent,
		transaction: WompiEventTransaction,
	): Promise<GatewayIntent["status"]> {
		const status = INTENT_STATUS_MAP[transaction.status];

		await this.intentRepo.updateByReference(intent.reference, {
			status,
			transactionId: transaction.id,
			paymentMethodType: transaction.payment_method_type,
			customerEmail: transaction.customer_email,
		});

		this.logger.info("Intent de pago actualizado", {
			operation: "gateway.intent_updated",
			reference: intent.reference,
			status,
			transactionId: transaction.id,
			gateway: "wompi",
		});

		if (transaction.status === "APPROVED") {
			await this.confirmApprovedPayment(intent, transaction);
		}

		return status;
	}

	private async confirmApprovedPayment(
		intent: GatewayIntent,
		transaction: WompiEventTransaction,
	): Promise<void> {
		await this.confirmTicketPayment.execute({
			purchaseId: intent.purchaseId,
			amount: transaction.amount_in_cents / 100,
			method: this.mapMethod(transaction.payment_method_type),
			status: "confirmado",
			paymentDate: new Date().toISOString(),
			userId: intent.contactId,
			userName: intent.contactName,
			paymentId: `wompi_${transaction.id}`,
			gateway: "wompi",
			gatewayTransactionId: transaction.id,
			payerName: transaction.customer_data?.full_name ?? intent.contactName,
			payerEmail: transaction.customer_email,
			payerPhone:
				transaction.customer_data?.phone_number ?? intent.contactPhone,
		});
	}

	private mapMethod(
		paymentMethodType?: string,
	): ConfirmTicketPaymentInput["method"] {
		return this.toPaymentMethod(paymentMethodType);
	}

	private toPaymentMethod(paymentMethodType?: string): PaymentMethod {
		switch (paymentMethodType) {
			case "PSE":
				return "pse";
			case "NEQUI":
				return "nequi";
			case "BANCOLOMBIA_TRANSFER":
				return "bancolombia";
			case "EFECTY":
				return "efecty";
			default:
				return "tarjeta";
		}
	}
}
