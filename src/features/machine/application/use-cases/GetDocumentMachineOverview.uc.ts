import type { IMachineSettings } from "../../../../shared/contracts/IMachineSettings.contract.js";
import type { IRaffleService } from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { ValidationError } from "../../../../shared/errors/ValidationError.js";
import type { IGatewayIntentRepository } from "../../../gateway/domain/repositories/IGatewayIntent.repository.js";
import type { ITicketRepository } from "../../../ticket/domain/repositories/ITicket.repository.js";
import type { IMachineGrantRepository } from "../../domain/repositories/IMachineGrant.repository.js";
import type { IMachinePlayRepository } from "../../domain/repositories/IMachinePlay.repository.js";
import { findPaidIntentsByDocument } from "../findPaidIntentsByDocument.js";

export interface DocumentMachineEntry {
	raffleId: string;
	raffleTitle: string;
	playsGranted: number;
	playsUsed: number;
	playsRemaining: number;
	enabled: boolean;
}

export interface DocumentMachineOverview {
	documentNumber: string;
	entries: DocumentMachineEntry[];
}

const ALWAYS_ENABLED: IMachineSettings = {
	isEnabled: async () => true,
	setEnabled: async () => {},
	getPlaysRule: async () => null,
	setPlaysRule: async () => {},
};

export class GetDocumentMachineOverview {
	constructor(
		private readonly intentRepo: IGatewayIntentRepository,
		private readonly ticketRepository: ITicketRepository,
		private readonly raffleService: IRaffleService,
		private readonly machinePlayRepository: IMachinePlayRepository,
		private readonly grantRepository: IMachineGrantRepository,
		private readonly settings: IMachineSettings = ALWAYS_ENABLED,
	) {}

	async execute(documentNumber: string): Promise<DocumentMachineOverview> {
		const doc = (documentNumber ?? "").trim();
		if (!doc) {
			throw new ValidationError("Ingresa tu número de documento para jugar.");
		}

		const [intents, grants, globalEnabled] = await Promise.all([
			findPaidIntentsByDocument(this.intentRepo, this.ticketRepository, doc),
			this.grantRepository.list({ documentNumber: doc, limit: 200 }),
			this.settings.isEnabled(),
		]);

		const raffleIds = [
			...new Set([
				...intents.map((i) => i.raffleId),
				...grants.map((g) => g.raffleId),
			]),
		].filter((id): id is string => Boolean(id));

		const entries: DocumentMachineEntry[] = [];
		for (const raffleId of raffleIds) {
			const purchased = intents
				.filter((i) => i.raffleId === raffleId)
				.reduce((sum, i) => sum + (i.plays ?? 0), 0);
			const adjustments = grants
				.filter((g) => g.raffleId === raffleId)
				.reduce((sum, g) => sum + g.delta, 0);
			const granted = purchased + adjustments;
			if (granted <= 0) continue;

			const used = await this.machinePlayRepository.countByDocumentRaffle(
				doc,
				raffleId,
			);
			const raffle = await this.raffleService.findById(raffleId);
			entries.push({
				raffleId,
				raffleTitle: raffle?.title ?? "Sorteo",
				playsGranted: granted,
				playsUsed: used,
				playsRemaining: Math.max(0, granted - used),
				enabled: globalEnabled && raffle?.machine?.enabled !== false,
			});
		}

		return { documentNumber: doc, entries };
	}
}
