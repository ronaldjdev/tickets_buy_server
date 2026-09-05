import type { PaymentMethod, PaymentStatus } from "@/shared/types/types.js";

export interface RegisterGatewayPaymentInput {
	creditId: string;
	amount: number;
	installmentsCovered: number;
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

export interface RegisteredPaymentData {
	paymentId: string;
	creditId: string;
	amount: number;
}

export interface IRegisterGatewayPayment {
	execute(input: RegisterGatewayPaymentInput): Promise<RegisteredPaymentData>;
}
