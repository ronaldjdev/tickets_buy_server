import type { IMachineSettings } from "../../../../shared/contracts/IMachineSettings.contract.js";
import type { IRaffleService } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import { ValidationError } from "../../../../shared/errors/ValidationError.js";
import type { IGatewayIntentRepository } from "../../../gateway/domain/repositories/IGatewayIntent.repository.js";
import type { ITicketRepository } from "../../../ticket/domain/repositories/ITicket.repository.js";
import type { MachinePlay } from "../../domain/entities/MachinePlay.entity.js";
import type { IMachineGrantRepository } from "../../domain/repositories/IMachineGrant.repository.js";
import type { IMachinePlayRepository } from "../../domain/repositories/IMachinePlay.repository.js";
import { findPaidIntentsByDocument } from "../findPaidIntentsByDocument.js";
import { buildMachinePool, type MachinePoolItem } from "../MachinePool.js";

export interface DocumentMachineSession {
	documentNumber: string;
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
};

export class GetDocumentMachineSession {
	constructor(
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly ticketRepository: ITicketRepository,
		private readonly raffleService: IRaffleService,
		private readonly machinePlayRepository: IMachinePlayRepository,
		private readonly grantRepository: IMachineGrantRepository,
		private readonly settings: IMachineSettings = ALWAYS_ENABLED,
	) {}

	async execute(
		documentNumber: string,
		raffleId: string,
	): Promise<DocumentMachineSession> {
		const doc = (documentNumber ?? "").trim();
		if (!doc) {
			throw new ValidationError("Ingresa tu número de documento para jugar.");
		}
		if (!raffleId?.trim())
			throw new ValidationError("El sorteo es obligatorio.");

		const raffle = await this.raffleService.findById(raffleId.trim());
		if (!raffle) throw new UseCaseError("No se pudo cargar la rifa.");

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
		const granted = Math.max(0, purchased + adjustments);
		const used = await this.machinePlayRepository.countByDocumentRaffle(
			doc,
			raffle.id,
		);

		const enabled =
			(await this.settings.isEnabled()) && raffle.machine?.enabled !== false;

		return {
			documentNumber: doc,
			raffleId: raffle.id,
			raffleTitle: raffle.title,
			playsGranted: granted,
			playsUsed: used,
			playsRemaining: Math.max(0, granted - used),
			pool: buildMachinePool(raffle.machine?.prizes ?? [], raffle.prizes),
			lastPlays: await this.machinePlayRepository.byDocumentRaffle(
				doc,
				raffle.id,
				10,
			),
			enabled,
		};
	}
}
