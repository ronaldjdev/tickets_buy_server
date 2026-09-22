export interface RafflePrizePayload {
	type: string;
	name: string;
	description?: string;
	imageUrl?: string;
	schedule?:
		| { mode: "weekday"; weekday: number }
		| { mode: "date"; date: string };
	winningNumber?: number;
	winningMinSoldTickets?: number;
	winningStatus?: "blocked" | "enabled" | "expedited";
	winningExpeditedAt?: string;
	winningExpeditedBy?: string;
	/** Fecha ISO en que el premio fue entregado vía máquina de tiros. */
	machineClaimedAt?: string;
	/** Compra (purchaseId) que reclamó el premio en la máquina. */
	machineClaimedByPurchaseId?: string;
}

export type MachinePrizeConfigPayload =
	| {
			kind: "seco";
			prizeType: string;
			winRate: number;
	  }
	| {
			kind: "instant";
			id: string;
			name: string;
			description?: string;
			imageUrl?: string;
			stock: number;
			winRate: number;
	  };

export interface RaffleMachineConfigPayload {
	prizes: MachinePrizeConfigPayload[];
	/** Interruptor de la máquina para esta sorteo (default true). */
	enabled?: boolean;
	/** Regla de tiros "por cada X boletos, Y tiros" para esta sorteo. */
	playsRule?: { every: number; plays: number };
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
	machine?: RaffleMachineConfigPayload;
}

export interface IRaffleService {
	findById(id: string): Promise<RafflePayload | null>;
}
