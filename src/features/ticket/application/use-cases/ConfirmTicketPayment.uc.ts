import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository.js";
import type {
	ConfirmedTicketPayment,
	ConfirmTicketPaymentInput,
	IConfirmTicketPayment,
} from "@/shared/contracts/IConfirmTicketPayment.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class ConfirmTicketPayment implements IConfirmTicketPayment {
	constructor(private readonly ticketRepository: ITicketRepository) {}

	async execute(
		input: ConfirmTicketPaymentInput,
	): Promise<ConfirmedTicketPayment> {
		if (!input.purchaseId) throw new UseCaseError("La compra es obligatoria.");

		const ticketCount = await this.ticketRepository.markPurchasedByPurchaseId(
			input.purchaseId,
		);

		return {
			purchaseId: input.purchaseId,
			amount: input.amount,
			ticketCount,
		};
	}
}
