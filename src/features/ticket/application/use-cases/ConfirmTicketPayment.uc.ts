import type { NotificationService } from "@/features/notification/application/services/NotificationService.js";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository.js";
import type {
	ConfirmedTicketPayment,
	ConfirmTicketPaymentInput,
	IConfirmTicketPayment,
} from "@/shared/contracts/IConfirmTicketPayment.contract.js";
import type { ITicketConfirmationNotifier } from "@/shared/contracts/ITicketConfirmationNotifier.contract.js";
import type {
	IRaffleService,
	RafflePayload,
} from "@/shared/contracts/raffle/IRaffleService.contract.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";

export class ConfirmTicketPayment implements IConfirmTicketPayment {
	constructor(
		private readonly raffleService: IRaffleService,
		private readonly ticketRepository: ITicketRepository,
		private readonly notifier: ITicketConfirmationNotifier,
		private readonly notificationService?: NotificationService,
		private readonly logger?: ILogger,
	) {}

	async execute(
		input: ConfirmTicketPaymentInput,
	): Promise<ConfirmedTicketPayment> {
		if (!input.purchaseId) throw new UseCaseError("La compra es obligatoria.");

		const ticketCount = await this.ticketRepository.markPurchasedByPurchaseId(
			input.purchaseId,
		);

		const numbers = await this.resolveNumbers(input.purchaseId);

		let raffle: RafflePayload | null = null;
		let maxTickets: number | undefined;

		if (ticketCount > 0 && numbers.length > 0) {
			try {
				const tickets = await this.ticketRepository.findByPurchaseId(
					input.purchaseId,
				);
				raffle = tickets[0]?.raffleId
					? await this.raffleService.findById(tickets[0].raffleId)
					: null;
				maxTickets = raffle?.maxTickets;
				await this.notifier.notify({
					purchaseId: input.purchaseId,
					buyerEmail: tickets[0]?.buyerEmail,
					buyerName: tickets[0]?.buyerName ?? input.payerName,
					raffleTitle: raffle?.title ?? "sorteo",
					numbers,
					amount: input.amount,
					maxTickets,
				});
			} catch (error) {
				throw new UseCaseError(
					`No se pudo notificar la confirmación: ${(error as Error).message}`,
				);
			}

			await this.emitPurchaseNotifications(raffle, input, numbers);
		}

		this.logger?.info("Pago confirmado", {
			operation: "ticket.confirm_payment",
			purchaseId: input.purchaseId,
			amount: input.amount,
			ticketCount,
			ticketNumbers: numbers,
			maxTickets,
		});

		return {
			purchaseId: input.purchaseId,
			amount: input.amount,
			ticketCount,
			ticketNumbers: numbers,
			maxTickets,
		};
	}

	private async emitPurchaseNotifications(
		raffle: RafflePayload | null,
		input: ConfirmTicketPaymentInput,
		numbers: number[],
	): Promise<void> {
		if (!this.notificationService) return;

		try {
			const raffleId = raffle?.id;
			await this.notificationService.notifyUsers({
				type: "payment_received",
				title: "Pago recibido",
				message: `Se recibió un pago de ${formatAmount(input.amount)} en "${raffle?.title ?? "sorteo"}"${input.payerName ? ` por ${input.payerName}` : ""}.`,
				metadata: {
					purchaseId: input.purchaseId,
					raffleId,
					ticketNumbers: numbers,
					amount: input.amount,
				},
			});

			if (raffle && raffle.maxTickets > 0) {
				const sold = await this.countSold(raffleId);
				if (sold >= raffle.maxTickets) {
					await this.notificationService.notifyUsers({
						type: "sold_out",
						title: "Sorteo agotado",
						message: `El sorteo "${raffle.title}" está agotado, ya no recibe ventas.`,
						metadata: { raffleId, sold },
					});
				} else if (sold / raffle.maxTickets >= 0.9) {
					await this.notificationService.notifyUsers({
						type: "stock_low",
						title: "Stock bajo",
						message: `El sorteo "${raffle.title}" está por agotarse (${raffle.maxTickets - sold} boletas disponibles).`,
						metadata: { raffleId, sold },
					});
				}
			}
		} catch (error) {
			this.logger?.warn("No se pudo emitir notificación del pago confirmado", {
				error,
			});
		}
	}

	private async countSold(raffleId: string | undefined): Promise<number> {
		if (!raffleId) return 0;
		const tickets = await this.ticketRepository.findByRaffle(raffleId);
		return tickets.filter(
			(t) => t.status === "purchased" || t.status === "winner",
		).length;
	}

	private async resolveNumbers(purchaseId: string): Promise<number[]> {
		const tickets = await this.ticketRepository.findByPurchaseId(purchaseId);
		return tickets.map((t) => t.number).sort((a, b) => a - b);
	}
}

function formatAmount(amount: number): string {
	return new Intl.NumberFormat("es-CO").format(amount);
}
