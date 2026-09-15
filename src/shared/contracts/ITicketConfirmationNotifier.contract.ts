import type { RafflePrizePayload } from "./raffle/IRaffleService.contract.js";

export interface TicketConfirmationNotification {
	purchaseId: string;
	buyerEmail?: string;
	buyerName?: string;
	raffleTitle: string;
	raffleDescription?: string;
	raffleEndDate?: string;
	raffleTicketPrice?: number;
	prizes?: RafflePrizePayload[];
	numbers: number[];
	amount: number;
	maxTickets?: number;
}

export interface ITicketConfirmationNotifier {
	notify(input: TicketConfirmationNotification): Promise<void>;
}
