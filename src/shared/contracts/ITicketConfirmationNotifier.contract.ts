export interface TicketConfirmationNotification {
	purchaseId: string;
	buyerEmail?: string;
	buyerName?: string;
	raffleTitle: string;
	numbers: number[];
	amount: number;
	maxTickets?: number;
}

export interface ITicketConfirmationNotifier {
	notify(input: TicketConfirmationNotification): Promise<void>;
}
