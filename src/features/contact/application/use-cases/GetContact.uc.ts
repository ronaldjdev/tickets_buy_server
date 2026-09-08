import type { Contact } from "@/features/contact/domain/entities/Contact.entity.js";
import type { IContactRepository } from "@/features/contact/domain/repositories/IContact.repository.js";
import type { GatewayIntent } from "@/features/gateway/domain/entities/GatewayIntent.entity.js";
import type { IGatewayIntentRepository } from "@/features/gateway/domain/repositories/IGatewayIntent.repository.js";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository.js";
import type {
	IRaffleService,
	RafflePayload,
} from "@/shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export interface ContactPurchase {
	reference: string;
	amountInCents: number;
	status: GatewayIntent["status"];
	createdAt?: Date;
	ticketCount: number;
	ticketNumbers: number[];
	maxTickets?: number;
	raffleTitle?: string;
}

export interface ContactDetail extends Contact {
	purchases: ContactPurchase[];
}

export class GetContact {
	constructor(
		private contactRepo: IContactRepository,
		private intentRepository: IGatewayIntentRepository,
		private ticketRepository: ITicketRepository,
		private raffleService: IRaffleService,
	) {}

	async execute(id: string): Promise<ContactDetail> {
		if (!id) {
			throw new UseCaseError(
				"UID de contacto requerido para obtener el perfil.",
			);
		}
		const contact = await this.contactRepo.findById(id);
		if (!contact) {
			throw new UseCaseError("Contacto no encontrado.");
		}

		const intents = await this.intentRepository.findPaidByContactId(id);
		const raffleCache = new Map<string, RafflePayload | null>();

		const purchases: ContactPurchase[] = [];
		for (const intent of intents) {
			const tickets = await this.ticketRepository.findByIds(intent.ticketIds);
			const raffleId = tickets[0]?.raffleId;
			let maxTickets: number | undefined;
			let raffleTitle: string | undefined;
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

			purchases.push({
				reference: intent.reference,
				amountInCents: intent.amountInCents,
				status: intent.status,
				createdAt: intent.createdAt,
				ticketCount: tickets.length,
				ticketNumbers: tickets.map((t) => t.number).sort((a, b) => a - b),
				maxTickets,
				raffleTitle,
			});
		}

		purchases.sort(
			(a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
		);

		return { ...contact, purchases };
	}
}
