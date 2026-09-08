import type { PaymentMethod, PaymentStatus } from "@/shared/types/types.js";

export interface ConfirmTicketPaymentInput {
	purchaseId: string;
	amount: number;
	method: PaymentMethod;
	status?: PaymentStatus;
	paymentDate: string;
	userId?: string;
	userName?: string;
	paymentId: string;
	gateway?: string;
	gatewayTransactionId?: string;
	payerName?: string;
	payerEmail?: string;
	payerPhone?: string;
}

export interface ConfirmedTicketPayment {
	purchaseId: string;
	amount: number;
	ticketCount: number;
	ticketNumbers?: number[];
	maxTickets?: number;
}

export interface IConfirmTicketPayment {
	execute(input: ConfirmTicketPaymentInput): Promise<ConfirmedTicketPayment>;
}
