import type { GatewayIntent } from "../../gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "../../gateway/domain/repositories/IGatewayIntent.repository.js";
import type { ITicketRepository } from "../../ticket/domain/repositories/ITicket.repository.js";

/**
 * Busca las compras pagadas de un documento. Primero usa el índice directo
 * `buyerDocumentNumber`; si no hay resultados (datos viejos sin el campo),
 * cae al lookup por boletos y resuelve los intents por `purchaseId`.
 */
export async function findPaidIntentsByDocument(
	intentRepo: IGatewayIntentRepository,
	ticketRepository: ITicketRepository,
	documentNumber: string,
	raffleId?: string,
): Promise<GatewayIntent[]> {
	const direct = await intentRepo.findPaidByDocumentNumber(
		documentNumber,
		raffleId,
	);
	if (direct.length > 0) return direct;

	const tickets = await ticketRepository.findByDocumentNumber(documentNumber, [
		"purchased",
		"winner",
	]);
	if (tickets.length === 0) return [];

	const purchaseIds = [
		...new Set(
			tickets
				.map((t) => t.purchaseId)
				.filter((id): id is string => Boolean(id?.trim())),
		),
	];
	const intents = await intentRepo.findPaidByPurchaseIds(purchaseIds);
	return raffleId ? intents.filter((i) => i.raffleId === raffleId) : intents;
}
