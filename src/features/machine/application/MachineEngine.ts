import { randomUUID } from "node:crypto";
import type {
	MachinePrizeConfigPayload,
	RafflePayload,
	RafflePrizePayload,
} from "../../../shared/contracts/raffle/IRaffleService.contract.js";
import type { IRaffleRepository } from "../../raffle/domain/repositories/IRaffle.repository.js";
import type {
	MachinePlay,
	MachinePlayResult,
	MachineWonPrize,
} from "../domain/entities/MachinePlay.entity.js";

type AvailablePrize = {
	prize: MachinePrizeConfigPayload;
	end: number;
};

export interface MachinePlayContext {
	raffle: RafflePayload;
	reference: string;
	purchaseId: string;
	documentNumber?: string;
	playedIndex: number;
}

/**
 * Motor compartido de la máquina: resuelve el resultado (pool disponible +
 * roll), reclama el premio y construye el registro del tiro. Lo usan tanto el
 * flujo por referencia como el flujo por documento.
 */
export class MachineEngine {
	constructor(private readonly raffleRepository: IRaffleRepository) {}

	async play(context: MachinePlayContext): Promise<MachinePlay> {
		const result = await this.resolveResult(
			context.raffle,
			context.raffle.machine?.prizes ?? [],
			context.purchaseId,
		);

		return {
			id: randomUUID(),
			raffleId: context.raffle.id,
			purchaseId: context.purchaseId,
			reference: context.reference,
			documentNumber: context.documentNumber,
			playedIndex: context.playedIndex,
			result,
		};
	}

	private async resolveResult(
		raffle: RafflePayload,
		configPrizeList: MachinePrizeConfigPayload[],
		purchaseId: string,
	): Promise<MachinePlayResult> {
		const available = this.buildAvailable(raffle.prizes, configPrizeList);
		const winTotal =
			available.length > 0 ? available[available.length - 1].end : 0;

		if (winTotal <= 0 || Math.random() * 100 > winTotal) {
			return { won: false };
		}

		const roll = Math.random() * 100;
		const target = available.find((item) => roll <= item.end);
		if (!target) return { won: false };

		return this.tryClaim(target.prize, raffle, purchaseId);
	}

	private buildAvailable(
		rafflePrizes: RafflePrizePayload[] | undefined,
		configPrizeList: MachinePrizeConfigPayload[],
	): AvailablePrize[] {
		let end = 0;
		const available: AvailablePrize[] = [];
		for (const prize of configPrizeList) {
			if (this.isAvailable(prize, rafflePrizes)) {
				end += prize.winRate;
				available.push({ prize, end });
			}
		}
		return available;
	}

	private isAvailable(
		prize: MachinePrizeConfigPayload,
		rafflePrizes: RafflePrizePayload[] | undefined,
	): boolean {
		if (prize.kind === "instant") return prize.stock > 0;
		const rafflePrize = (rafflePrizes ?? []).find(
			(p) => p.type === prize.prizeType,
		);
		return Boolean(rafflePrize) && !rafflePrize?.machineClaimedAt;
	}

	private async tryClaim(
		prize: MachinePrizeConfigPayload,
		raffle: { id: string; prizes?: RafflePrizePayload[] },
		purchaseId: string,
	): Promise<MachinePlayResult> {
		if (prize.kind === "seco") {
			const claimed = await this.raffleRepository.claimMachineSecoPrize(
				raffle.id,
				prize.prizeType,
				purchaseId,
			);
			if (!claimed) return { won: false };
			const rafflePrize = (raffle.prizes ?? []).find(
				(p) => p.type === prize.prizeType,
			);
			return {
				won: true,
				prize: {
					kind: "seco",
					prizeType: prize.prizeType,
					name: rafflePrize?.name ?? prize.prizeType,
					description: rafflePrize?.description,
					imageUrl: rafflePrize?.imageUrl,
					schedule: rafflePrize?.schedule,
				} satisfies MachineWonPrize,
			};
		}

		const claimed = await this.raffleRepository.decrementMachineInstantStock(
			raffle.id,
			prize.id,
		);
		if (!claimed) return { won: false };
		return {
			won: true,
			prize: {
				kind: "instant",
				prizeId: prize.id,
				name: prize.name,
				description: prize.description,
				imageUrl: prize.imageUrl,
			} satisfies MachineWonPrize,
		};
	}
}
