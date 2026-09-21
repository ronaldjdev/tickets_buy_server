import type {
	MachinePrizeConfigPayload,
	RafflePrizePayload,
} from "../../../shared/contracts/raffle/IRaffleService.contract.js";

export type MachinePoolItem = {
	winRate: number;
} & (
	| {
			kind: "seco";
			prizeType: string;
			name: string;
			description?: string;
			imageUrl?: string;
			claimed: boolean;
	  }
	| {
			kind: "instant";
			id: string;
			name: string;
			description?: string;
			imageUrl?: string;
			stock: number;
	  }
);

/** Construye el pool visible (con disponibilidad) a partir de la config. */
export function buildMachinePool(
	configPrizes: MachinePrizeConfigPayload[],
	rafflePrizes: RafflePrizePayload[] | undefined,
): MachinePoolItem[] {
	return configPrizes.map((prize) => {
		if (prize.kind === "instant") {
			return {
				kind: "instant",
				id: prize.id,
				name: prize.name,
				description: prize.description,
				imageUrl: prize.imageUrl,
				stock: prize.stock,
				winRate: prize.winRate,
			} satisfies MachinePoolItem;
		}
		const rafflePrize = (rafflePrizes ?? []).find(
			(p) => p.type === prize.prizeType,
		);
		return {
			kind: "seco",
			prizeType: prize.prizeType,
			name: rafflePrize?.name ?? prize.prizeType,
			description: rafflePrize?.description,
			imageUrl: rafflePrize?.imageUrl,
			claimed: Boolean(rafflePrize?.machineClaimedAt),
			winRate: prize.winRate,
		} satisfies MachinePoolItem;
	});
}
