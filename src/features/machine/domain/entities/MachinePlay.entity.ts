export type MachineWonPrize =
	| {
			kind: "seco";
			prizeType: string;
			name: string;
			description?: string;
			imageUrl?: string;
			schedule?:
				| { mode: "weekday"; weekday: number }
				| { mode: "date"; date: string };
	  }
	| {
			kind: "instant";
			prizeId: string;
			name: string;
			description?: string;
			imageUrl?: string;
	  };

export type MachinePlayResult =
	| { won: true; prize: MachineWonPrize }
	| { won: false };

/**
 * Registro de un tiro de la máquina. Cada tiro consume una jugada otorgada
 * por la compra de un combo (idea: índice único por compra).
 */
export interface MachinePlay {
	id: string;
	raffleId: string;
	purchaseId: string;
	reference: string;
	/** Documento (cédula) de quien jugó, para balances por documento. */
	documentNumber?: string;
	/** Número de tiro dentro de la compra (1-based). */
	playedIndex: number;
	result: MachinePlayResult;
	/** Entrega del premio (física) confirmada por un admin. */
	delivered?: boolean;
	deliveredAt?: Date;
	createdAt?: Date;
}
