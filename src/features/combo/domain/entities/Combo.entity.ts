export interface Combo {
	id: string;
	raffleId: string;
	name: string;
	ticketCount: number;
	price: number;
	recommended?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}
