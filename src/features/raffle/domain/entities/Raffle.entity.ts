export type RaffleStatus = "draft" | "active" | "drawn";

export type RafflePrizeType = "mayor" | "seco1" | "seco2" | "seco3" | "seco4";

export const PRIZE_LABELS: Record<RafflePrizeType, string> = {
	mayor: "Premio mayor",
	seco1: "1 seco",
	seco2: "2 seco",
	seco3: "3 seco",
	seco4: "4 seco",
};

export type RafflePrize = {
	type: RafflePrizeType;
	name: string;
	description?: string;
};

export interface Raffle {
	id: string;
	slug: string;
	title: string;
	description?: string;
	prizes?: RafflePrize[];
	startDate: Date;
	endDate: Date;
	ticketPrice: number;
	maxTickets: number;
	status: RaffleStatus;
	winnerTicketId?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
