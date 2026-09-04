export interface CreateWompiLinkInput {
	name: string;
	description?: string;
	amountInCents: number;
	singleUse?: boolean;
	expiresAt?: Date | null;
	sku?: string;
	redirectUrl?: string;
}

export interface WompiLinkData {
	id: string;
	url: string;
}

export type WompiTransactionStatus =
	| "APPROVED"
	| "DECLINED"
	| "VOIDED"
	| "ERROR"
	| "PENDING";

export interface WompiEventTransaction {
	id: string;
	amount_in_cents: number;
	reference: string;
	customer_email?: string;
	currency: string;
	payment_method_type?: string;
	status: WompiTransactionStatus;
	payment_link_id?: string | null;
	customer_data?: { phone_number?: string; full_name?: string } | null;
}

export interface WompiEventPayload {
	event: string;
	data: { transaction?: WompiEventTransaction };
	environment?: string;
	signature?: { properties?: string[]; checksum?: string };
	timestamp?: number;
	sent_at?: string;
}

export interface IWompiPort {
	createPaymentLink(
		input: CreateWompiLinkInput,
		privateKey: string,
	): Promise<WompiLinkData>;
	verifyEventChecksum(payload: WompiEventPayload, eventsKey: string): boolean;
	getTransaction(
		transactionId: string,
		privateKey: string,
	): Promise<WompiEventTransaction | null>;
	getLinkTransactions(
		linkId: string,
		privateKey: string,
	): Promise<WompiEventTransaction[]>;
}
