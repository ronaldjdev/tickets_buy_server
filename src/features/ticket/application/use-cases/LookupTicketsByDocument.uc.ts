import type {
	IRaffleService,
	RafflePayload,
} from "../../../../shared/contracts/raffle/IRaffleService.contract.js";
import { ValidationError } from "../../../../shared/errors/ValidationError.js";
import type { Ticket } from "../../domain/entities/Ticket.entity.js";
import type { ITicketRepository } from "../../domain/repositories/ITicket.repository.js";

export type DocumentLookupTicketStatus = "pagada" | "pendiente";

export interface DocumentLookupPurchase {
	purchaseId: string;
	raffleId: string;
	raffleTitle?: string;
	maxTickets?: number;
	status: DocumentLookupTicketStatus;
	createdAt?: Date;
	ticketCount: number;
	ticketNumbers: number[];
}

export interface DocumentLookupResult {
	documentNumber: string;
	purchases: DocumentLookupPurchase[];
}

const DOCUMENT_PATTERN = /^[A-Za-z0-9\u00C0-\u024F .\-/]{4,30}$/;

export class LookupTicketsByDocument {
	constructor(
		private readonly ticketRepository: ITicketRepository,
		private readonly raffleService: IRaffleService,
	) {}

	async execute(documentNumber: string): Promise<DocumentLookupResult> {
		const doc = (documentNumber ?? "").trim();
		if (!doc) {
			throw new ValidationError(
				"Ingresa tu número de documento para consultar tus boletos.",
			);
		}
		if (!DOCUMENT_PATTERN.test(doc)) {
			throw new ValidationError(
				"El número de documento no es válido (mínimo 4 caracteres).",
			);
		}

		const tickets = await this.ticketRepository.findByDocumentNumber(doc);

		if (tickets.length === 0) return { documentNumber: doc, purchases: [] };

		const groups = groupByPurchase(tickets);
		const raffleCache = new Map<string, RafflePayload | null>();

		const purchases: DocumentLookupPurchase[] = [];
		for (const group of groups) {
			const raffleId = group[0].raffleId;
			let raffleTitle: string | undefined;
			let maxTickets: number | undefined;
			if (raffleId) {
				if (!raffleCache.has(raffleId)) {
					raffleCache.set(
						raffleId,
						await this.raffleService.findById(raffleId),
					);
				}
				const raffle = raffleCache.get(raffleId);
				maxTickets = raffle?.maxTickets;
				raffleTitle = raffle?.title;
			}

			const paid = group.every(
				(t) => t.status === "purchased" || t.status === "winner",
			);

			purchases.push({
				purchaseId: group[0].purchaseId ?? group[0].id,
				raffleId,
				raffleTitle,
				maxTickets,
				status: paid ? "pagada" : "pendiente",
				createdAt: group[0].createdAt,
				ticketCount: group.length,
				ticketNumbers: group.map((t) => t.number).sort((a, b) => a - b),
			});
		}

		purchases.sort(
			(a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
		);

		return { documentNumber: doc, purchases };
	}
}

function groupByPurchase(tickets: Ticket[]): Ticket[][] {
	const byPurchase = new Map<string, Ticket[]>();
	for (const ticket of tickets) {
		const key = ticket.purchaseId ?? ticket.id;
		const list = byPurchase.get(key);
		if (list) list.push(ticket);
		else byPurchase.set(key, [ticket]);
	}
	return [...byPurchase.values()];
}
