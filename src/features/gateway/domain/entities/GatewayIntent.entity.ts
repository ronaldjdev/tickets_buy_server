export type GatewayName = "wompi" | "epayco";
export type GatewayMode = "link" | "widget";

export type GatewayIntentStatus = "creada" | "pagada" | "declinada" | "anulada" | "error";

export interface GatewayIntent {
  reference: string;
  gateway: GatewayName;
  mode: GatewayMode;
  creditId: string;
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
  amountInCents: number;
  currency: string;
  status: GatewayIntentStatus;
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
  widget?: { publicKey: string; signatureIntegrity: string } | null;
}
