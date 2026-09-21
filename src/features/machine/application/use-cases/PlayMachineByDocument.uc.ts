import type { IMachineSettings } from "../../../../shared/contracts/IMachineSettings.contract.js";
import type {
	IRaffleService,
	RafflePayload,
} from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import { ValidationError } from "../../../../shared/errors/ValidationError.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { GatewayIntent } from "../../../gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "../../../gateway/domain/repositories/IGatewayIntent.repository.js";
import type { IRaffleRepository } from "../../../raffle/domain/repositories/IRaffle.repository.js";
import type { ITicketRepository } from "../../../ticket/domain/repositories/ITicket.repository.js";
import type { MachineGrant } from "../../domain/entities/MachineGrant.entity.js";
import type { MachinePlay } from "../../domain/entities/MachinePlay.entity.js";
import {
	MachineDisabledError,
	MachineNoPlaysError,
	NoMachineConfiguredError,
} from "../../domain/errors/Machine.error.js";
import type { IMachineGrantRepository } from "../../domain/repositories/IMachineGrant.repository.js";
import type { IMachinePlayRepository } from "../../domain/repositories/IMachinePlay.repository.js";
import { findPaidIntentsByDocument } from "../findPaidIntentsByDocument.js";
import { MachineEngine } from "../MachineEngine.js";

export interface PlayMachineByDocumentResult {
	play: MachinePlay;
	playsRemaining: number;
}

interface ConsumptionSlot {
	reference: string;
	purchaseId: string;
	playedIndex: number;
}

export class PlayMachineByDocument {
	private readonly engine: MachineEngine;

	constructor(
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly ticketRepository: ITicketRepository,
		private readonly raffleService: IRaffleService,
		raffleRepository: IRaffleRepository,
		private readonly machinePlayRepository: IMachinePlayRepository,
		private readonly grantRepository: IMachineGrantRepository,
		private readonly settings: IMachineSettings,
		private readonly logger: ILogger,
	) {
		this.engine = new MachineEngine(raffleRepository);
	}

	async execute(
		documentNumber: string,
		raffleId: string,
	): Promise<PlayMachineByDocumentResult> {
		const doc = (documentNumber ?? "").trim();
		if (!doc) {
			throw new ValidationError("Ingresa tu número de documento para jugar.");
		}
		if (!raffleId?.trim())
			throw new ValidationError("El sorteo es obligatorio.");

		const raffle = await this.raffleService.findById(raffleId.trim());
		if (!raffle) throw new UseCaseError("No se pudo cargar la rifa.");

		await this.assertEnabled(raffle);
		if (!raffle.machine || raffle.machine.prizes.length === 0) {
			throw new NoMachineConfiguredError();
		}

		const [intents, grants] = await Promise.all([
			findPaidIntentsByDocument(
				this.intentRepo,
				this.ticketRepository,
				doc,
				raffle.id,
			),
			this.grantRepository.byDocumentRaffle(doc, raffle.id),
		]);

		const purchased = intents.reduce((sum, i) => sum + (i.plays ?? 0), 0);
		const adjustments = grants.reduce((sum, g) => sum + g.delta, 0);
		const granted = purchased + adjustments;
		const used = await this.machinePlayRepository.countByDocumentRaffle(
			doc,
			raffle.id,
		);
		const balance = granted - used;
		if (balance <= 0) throw new MachineNoPlaysError();

		const slot = await this.pickSlot(intents, grants);
		if (!slot) throw new MachineNoPlaysError();

		const play = await this.engine.play({
			raffle,
			reference: slot.reference,
			purchaseId: slot.purchaseId,
			documentNumber: doc,
			playedIndex: slot.playedIndex,
		});

		try {
			await this.machinePlayRepository.save(play);
		} catch (error) {
			throw new UseCaseError(
				`No se pudo registrar tu tiro: ${(error as Error).message}`,
			);
		}

		this.logger.info("Tiro de máquina jugado por documento", {
			operation: "machine.play_by_document",
			documentNumber: doc,
			raffleId: raffle.id,
			reference: slot.reference,
			purchaseId: slot.purchaseId,
			playedIndex: slot.playedIndex,
			won: play.result.won,
			prize: play.result.won ? play.result.prize.name : null,
		});

		return { play, playsRemaining: balance - 1 };
	}

	private async assertEnabled(raffle: RafflePayload): Promise<void> {
		if (!(await this.settings.isEnabled())) throw new MachineDisabledError();
		if (raffle.machine?.enabled === false) throw new MachineDisabledError();
	}

	/**
	 * Elige de dónde consumir el tiro: la compra pagada más antigua con saldo o,
	 * si no hay, el primer crédito manual positivo con saldo. El `reference`
	 * sintético `credit:<id>` reusa el mismo contador anti-doble-tiro.
	 */
	private async pickSlot(
		intents: GatewayIntent[],
		grants: MachineGrant[],
	): Promise<ConsumptionSlot | null> {
		for (const intent of intents) {
			const granted = intent.plays ?? 0;
			if (granted <= 0) continue;
			const used = await this.machinePlayRepository.countByReference(
				intent.reference,
			);
			if (used < granted) {
				return {
					reference: intent.reference,
					purchaseId: intent.purchaseId,
					playedIndex: used + 1,
				};
			}
		}

		for (const grant of grants) {
			if (grant.delta <= 0) continue;
			const reference = this.creditReference(grant);
			const used = await this.machinePlayRepository.countByReference(reference);
			if (used < grant.delta) {
				return {
					reference,
					purchaseId: reference,
					playedIndex: used + 1,
				};
			}
		}

		return null;
	}

	private creditReference(grant: MachineGrant): string {
		return `credit:${grant.id}`;
	}
}
