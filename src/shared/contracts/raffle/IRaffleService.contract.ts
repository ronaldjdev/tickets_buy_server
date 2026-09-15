export interface RafflePrizePayload {
	type: string;
	name: string;
	description?: string;
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
	prizes?: RafflePrizePayload[];
}

export interface IRaffleService {
	findById(id: string): Promise<RafflePayload | null>;
}
