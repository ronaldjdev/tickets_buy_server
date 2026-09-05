export interface GatewayLinkRequest {
	purchaseId: string;
	ticketIds: string[];
	contactId?: string;
	contactName?: string;
	contactPhone?: string;
	amountInCents: number;
	expiresInMinutes?: number;
}

export interface GatewayLinkResult {
	reference: string;
	checkoutUrl: string;
	amountInCents: number;
	purchaseId: string;
}

export interface IGatewayLinkCreator {
	execute(input: GatewayLinkRequest): Promise<GatewayLinkResult>;
}
