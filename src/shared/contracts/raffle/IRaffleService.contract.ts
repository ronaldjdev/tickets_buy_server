export interface RafflePrizePayload {
	type: string;
	name: string;
	description?: string;
	winningNumber?: number;
	winningMinSoldTickets?: number;
	winningStatus?: "blocked" | "enabled" | "expedited";
	winningExpeditedAt?: string;
	winningExpeditedBy?: string;
}

export interface RafflePayload {
	id: string;
	title: string;
	status: "draft" | "active" | "drawn";
	ticketPrice: number;
	maxTickets: number;
	minTickets?: number;
	ticketIssuance?: "random" | "consecutive";
	description?: string;
	endDate?: string;
	soldTickets?: number;
	prizes?: RafflePrizePayload[];
}

export interface IRaffleService {
	findById(id: string): Promise<RafflePayload | null>;
}
