import type { IMachineSettings } from "../../../../shared/contracts/IMachineSettings.contract.js";
import type { IRaffleService } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { IGatewayIntentRepository } from "../../../gateway/domain/repositories/IGatewayIntent.repository.js";
import type { ITicketRepository } from "../../../ticket/domain/repositories/ITicket.repository.js";
import type { MachinePlay } from "../../domain/entities/MachinePlay.entity.js";
import type { IMachinePlayRepository } from "../../domain/repositories/IMachinePlay.repository.js";
import { buildMachinePool, type MachinePoolItem } from "../MachinePool.js";

export type { MachinePoolItem };

export interface MachineSession {
	reference: string;
	raffleId: string;
	raffleTitle: string;
	playsGranted: number;
	playsUsed: number;
	playsRemaining: number;
	pool: MachinePoolItem[];
	lastPlays: MachinePlay[];
	enabled: boolean;
}

const ALWAYS_ENABLED: IMachineSettings = {
	isEnabled: async () => true,
	setEnabled: async () => {},
	getPlaysRule: async () => null,
	setPlaysRule: async () => {},
};

export class GetMachineSession {
	constructor(
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly ticketRepository: ITicketRepository,
		private readonly raffleService: IRaffleService,
		private readonly machinePlayRepository: IMachinePlayRepository,
		private readonly settings: IMachineSettings = ALWAYS_ENABLED,
	) {}

	async execute(reference: string): Promise<MachineSession> {
		if (!reference?.trim()) {
			throw new UseCaseError("La referencia es obligatoria.");
		}

		const intent = await this.intentRepo.findByReference(reference.trim());
		if (!intent) throw new UseCaseError("Compra no encontrada.");
		if (intent.status !== "pagada") {
			throw new UseCaseError("Debes completar el pago para jugar.");
		}

		const granted = intent.plays ?? 0;
		const used = await this.machinePlayRepository.countByReference(reference);
		const raffleId = await this.resolveRaffleId(intent);
		const raffle = await this.raffleService.findById(raffleId);

		const pool = buildMachinePool(
			raffle?.machine?.prizes ?? [],
			raffle?.prizes,
		);

		return {
			reference: intent.reference,
			raffleId,
			raffleTitle: raffle?.title ?? "Sorteo",
			playsGranted: granted,
			playsUsed: used,
			playsRemaining: Math.max(0, granted - used),
			pool,
			lastPlays: await this.machinePlayRepository.byReference(reference, 10),
			enabled: await this.isEnabled(raffle?.machine?.enabled),
		};
	}

	private async isEnabled(raffleEnabled?: boolean): Promise<boolean> {
		if (!(await this.settings.isEnabled())) return false;
		return raffleEnabled !== false;
	}

	private async resolveRaffleId(intent: {
		raffleId?: string;
		ticketIds?: string[];
	}): Promise<string> {
		if (intent.raffleId) return intent.raffleId;
		if (intent.ticketIds?.length) {
			const tickets = await this.ticketRepository.findByIds(intent.ticketIds);
			const raffleId = tickets[0]?.raffleId;
			if (raffleId) return raffleId;
		}
		throw new UseCaseError("No se pudo identificar la rifa de esta compra.");
	}
}
