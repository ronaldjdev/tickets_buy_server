export type RaffleStatus = "draft" | "active" | "drawn";

export type RafflePrize = {
	name: string;
	description?: string;
};

export interface Raffle {
	id: string;
	title: string;
	description?: string;
	prize: RafflePrize;
	startDate: Date;
	endDate: Date;
	ticketPrice: number;
	maxTickets: number;
	status: RaffleStatus;
	winnerTicketId?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
