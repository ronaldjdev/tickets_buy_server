export type GatewayName = "wompi" | "epayco";
export type GatewayMode = "link" | "widget";

export type GatewayIntentStatus =
	| "creada"
	| "pagada"
	| "declinada"
	| "anulada"
	| "error";

export interface GatewayIntent {
	reference: string;
	gateway: GatewayName;
	mode: GatewayMode;
	purchaseId: string;
	ticketIds: string[];
	contactId?: string;
	contactName?: string;
	contactPhone?: string;
	amountInCents: number;
	currency: string;
	status: GatewayIntentStatus;
	/** Sorteo a la que pertenece la compra. */
	raffleId?: string;
	/** Documento (cédula) del comprador; permite jugar la máquina por documento. */
	buyerDocumentNumber?: string;
	/** Tiros de la máquina de premios otorgados por esta compra. */
	plays?: number;
	linkId?: string | null;
	checkoutUrl?: string | null;
	transactionId?: string | null;
	paymentMethodType?: string | null;
	customerEmail?: string | null;
	expiresAt?: Date | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface PublicGatewayIntent {
	reference: string;
	gateway: GatewayName;
	status: GatewayIntentStatus;
	amountInCents: number;
	currency: string;
	contactName?: string;
	businessName?: string;
	purchaseId?: string;
	ticketNumbers?: number[];
	maxTickets?: number;
	plays?: number;
	widget?: { publicKey: string; signatureIntegrity: string } | null;
	expiresAt?: string | null;
}
