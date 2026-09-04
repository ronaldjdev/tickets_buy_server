import type { GatewayIntent } from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IGatewayCreditReader } from "@/shared/contracts/IGatewayCreditReader.contract.js";
import type { RegisterGatewayPaymentInput } from "@/shared/contracts/IRegisterGatewayPayment.contract.js";
import type { WompiEventTransaction, WompiTransactionStatus } from "@/shared/port/IWompi.port.js";

export const INTENT_STATUS_MAP: Record<WompiTransactionStatus, GatewayIntent["status"]> = {
  APPROVED: "pagada",
  DECLINED: "declinada",
  VOIDED: "anulada",
  ERROR: "error",
  PENDING: "creada"
};

export class WompiIntentProcessor {
  constructor(
    private readonly intentRepo: IGatewayIntentRepository,
    private readonly registerPayment: {
      execute(input: RegisterGatewayPaymentInput): Promise<unknown>;
    },
    private readonly creditReader: IGatewayCreditReader
  ) {}

  async apply(
    intent: GatewayIntent,
    transaction: WompiEventTransaction
  ): Promise<GatewayIntent["status"]> {
    await this.intentRepo.updateByReference(intent.reference, {
      status: INTENT_STATUS_MAP[transaction.status],
      transactionId: transaction.id,
      paymentMethodType: transaction.payment_method_type,
      customerEmail: transaction.customer_email
    });

    if (transaction.status === "APPROVED") {
      await this.registerApprovedPayment(intent, transaction);
    }

    return INTENT_STATUS_MAP[transaction.status];
  }

  private async registerApprovedPayment(
    intent: GatewayIntent,
    transaction: WompiEventTransaction
  ): Promise<void> {
    const amount = transaction.amount_in_cents / 100;
    const credit = await this.creditReader.findById(intent.creditId);
    const installmentsCovered = credit?.installmentValue
      ? Math.max(1, Math.floor(amount / credit.installmentValue))
      : 1;

    await this.registerPayment.execute({
      creditId: intent.creditId,
      amount,
      installmentsCovered,
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
      payerPhone: transaction.customer_data?.phone_number ?? intent.contactPhone
    });
  }

  private mapMethod(paymentMethodType?: string): RegisterGatewayPaymentInput["method"] {
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
