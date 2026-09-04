export interface RafflePayload {
	id: string;
	title: string;
	status: "draft" | "active" | "drawn";
	ticketPrice: number;
	maxTickets: number;
}

export interface IRaffleService {
	findById(id: string): Promise<RafflePayload | null>;
}
