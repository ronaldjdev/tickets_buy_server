export interface Combo {
	id: string;
	raffleId: string;
	name: string;
	ticketCount: number;
	price: number;
	/** Tiros en la máquina de premios que otorga este combo. */
	plays: number;
	recommended?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}
