import type { IMachineSettings } from "../../../../shared/contracts/IMachineSettings.contract.js";
import type { RafflePayload } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { IGatewayIntentRepository } from "../../../gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IRaffleRepository } from "../../../raffle/domain/repositories/IRaffle.repository.js";
import type { ITicketRepository } from "../../../ticket/domain/repositories/ITicket.repository.js";
import type { MachinePlay } from "../../domain/entities/MachinePlay.entity.js";
import {
	MachineDisabledError,
	MachineNoPlaysError,
	NoMachineConfiguredError,
} from "../../domain/errors/Machine.error.js";
import type { IMachinePlayRepository } from "../../domain/repositories/IMachinePlay.repository.js";
import { MachineEngine } from "../MachineEngine.js";

export interface PlayMachineResult {
	play: MachinePlay;
	playsRemaining: number;
}

const ALWAYS_ENABLED: IMachineSettings = {
	isEnabled: async () => true,
	setEnabled: async () => {},
};

export class PlayMachine {
	private readonly engine: MachineEngine;

	constructor(
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly ticketRepository: ITicketRepository,
		private readonly raffleService: {
			findById(id: string): Promise<RafflePayload | null>;
		},
		raffleRepository: IRaffleRepository,
		private readonly machinePlayRepository: IMachinePlayRepository,
		private readonly logger: ILogger,
		private readonly settings: IMachineSettings = ALWAYS_ENABLED,
	) {
		this.engine = new MachineEngine(raffleRepository);
	}

	async execute(reference: string): Promise<PlayMachineResult> {
		if (!reference?.trim()) {
			throw new UseCaseError("La referencia es obligatoria.");
		}

		const intent = await this.intentRepo.findByReference(reference.trim());
		if (!intent) throw new UseCaseError("Compra no encontrada.");
		if (intent.status !== "pagada") {
			throw new UseCaseError("Debes completar el pago para jugar.");
		}

		const granted = intent.plays ?? 0;
		if (granted <= 0) {
			throw new UseCaseError("Esta compra no incluye tiros de la máquina.");
		}

		const used = await this.machinePlayRepository.countByReference(reference);
		const remaining = granted - used;
		if (remaining <= 0) throw new MachineNoPlaysError();

		const raffleId = await this.resolveRaffleId(intent);
		const raffle = await this.raffleService.findById(raffleId);
		if (!raffle) throw new UseCaseError("No se pudo cargar la rifa.");

		await this.assertEnabled(raffle);

		const machine = raffle.machine;
		if (!machine || machine.prizes.length === 0) {
			throw new NoMachineConfiguredError();
		}

		const documentNumber = await this.resolveDocumentNumber(intent);
		const playedIndex = used + 1;

		const play = await this.engine.play({
			raffle,
			reference,
			purchaseId: intent.purchaseId,
			documentNumber,
			playedIndex,
		});

		try {
			await this.machinePlayRepository.save(play);
		} catch (error) {
			throw new UseCaseError(
				`No se pudo registrar tu tiro: ${(error as Error).message}`,
			);
		}

		this.logger.info("Tiro de máquina jugado", {
			operation: "machine.play",
			reference,
			raffleId: raffle.id,
			purchaseId: intent.purchaseId,
			playedIndex,
			won: play.result.won,
			prize: play.result.won ? play.result.prize.name : null,
		});

		return { play, playsRemaining: granted - playedIndex };
	}

	private async assertEnabled(raffle: RafflePayload): Promise<void> {
		if (!(await this.settings.isEnabled())) throw new MachineDisabledError();
		if (raffle.machine?.enabled === false) throw new MachineDisabledError();
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

	private async resolveDocumentNumber(intent: {
		buyerDocumentNumber?: string;
		ticketIds?: string[];
	}): Promise<string | undefined> {
		if (intent.buyerDocumentNumber?.trim()) {
			return intent.buyerDocumentNumber.trim();
		}
		if (intent.ticketIds?.length) {
			const tickets = await this.ticketRepository.findByIds(intent.ticketIds);
			return tickets.find((t) => t.buyerDocumentNumber)?.buyerDocumentNumber;
		}
		return undefined;
	}
}
