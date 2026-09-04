export interface CreateGatewayLinkDTO {
  creditId: string;
  amount: number;
  sendWhatsApp?: boolean;
  message?: string;
  expiresInDays?: number;
}

export interface CreateWidgetSessionDTO {
  creditId: string;
  amount: number;
  expiresInDays?: number;
}
