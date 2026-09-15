import { getSiteBranding } from "../../../../../infra/email/branding.js";
import { resolveEmailClientFromConfig } from "../../../../../infra/email/index.js";
import logger from "../../../../../platform/logger/index.js";
import type { ITicketConfirmationNotifier } from "../../../../../shared/contracts/ITicketConfirmationNotifier.contract.js";
import type { RafflePrizePayload } from "../../../../../shared/contracts/raffle/IRaffleService.contract.js";
import type { IEmailPort } from "../../../../../shared/port/IEmail.port.js";
import { getHtmlTemplate } from "../../../../../shared/utils/emailTemplate.js";

const PRIZE_LABELS: Record<string, string> = {
	mayor: "Premio mayor",
	seco1: "1 seco",
	seco2: "2 seco",
	seco3: "3 seco",
	seco4: "4 seco",
};

const copFormat = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	maximumFractionDigits: 0,
});

export class EmailTicketConfirmationNotifier
	implements ITicketConfirmationNotifier
{
	constructor(
		private readonly resolveClient: () => Promise<IEmailPort> = resolveEmailClientFromConfig,
	) {}

	async notify(
		notification: Parameters<ITicketConfirmationNotifier["notify"]>[0],
	): Promise<void> {
		try {
			if (!notification.buyerEmail) return;

			const content = this.buildContent(notification);

			const html = getHtmlTemplate({
				title: `Tus boletos - ${notification.raffleTitle}`,
				content,
				...(await getSiteBranding()),
			});

			const emailClient = await this.resolveClient();
			await emailClient.send(
				notification.buyerEmail,
				`Tus boletos - ${notification.raffleTitle}`,
				html,
			);
			logger.info("Correo de boletos enviado", {
				purchaseId: notification.purchaseId,
			});
		} catch (error) {
			logger.warn("No se pudo enviar el correo de boletos", {
				purchaseId: notification.purchaseId,
				message: (error as Error).message ?? String(error),
			});
		}
	}

	private buildContent(
		notification: Parameters<ITicketConfirmationNotifier["notify"]>[0],
	): string {
		const greeting = `¡Hola ${notification.buyerName ?? "comprador"}!`;
		const intro = `Tu pago fue recibido. Estos son los boletos de tu combo para <strong>${notification.raffleTitle}</strong>:`;

		const raffleInfo = this.buildRaffleInfo(notification);
		const numbers = this.buildNumbersList(notification);

		return `
			<p>${greeting}</p>
			<p>${intro}</p>
			${raffleInfo}
			${numbers}
			<p>Total pagado: <strong>${copFormat.format(notification.amount)}</strong></p>
			<p>¡Mucha suerte!</p>`;
	}

	private buildRaffleInfo(
		notification: Parameters<ITicketConfirmationNotifier["notify"]>[0],
	): string {
		if (notification.prizes && notification.prizes.length > 0) {
			const prizes = notification.prizes
				.map((p) => this.formatPrize(p))
				.join("");
			return `<p style="margin-top:24px;padding:16px;border:1px solid #e4e4e7;border-radius:8px;">
				<strong style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;">Datos del sorteo: ${notification.raffleTitle}</strong>
				<br>
				<strong>Premios:</strong>
				<ul style="list-style:none;padding:0;margin:8px 0 0;">${prizes}</ul>
				${this.buildRaffleMeta(notification)}
			</p>`;
		}

		return `<p style="margin-top:24px;padding:16px;border:1px solid #e4e4e7;border-radius:8px;">
			<strong style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;">Datos del sorteo: ${notification.raffleTitle}</strong>
			${this.buildRaffleMeta(notification)}
		</p>`;
	}

	private buildRaffleMeta(
		notification: Parameters<ITicketConfirmationNotifier["notify"]>[0],
	): string {
		const meta: string[] = [];

		if (notification.raffleEndDate) {
			const date = new Date(notification.raffleEndDate);
			const formatted =
				Number.isNaN(date.getTime()) || notification.raffleEndDate.length === 0
					? null
					: new Intl.DateTimeFormat("es-CO", {
							dateStyle: "long",
						}).format(date);
			if (formatted) {
				meta.push(`<li><strong>Fecha del sorteo:</strong> ${formatted}</li>`);
			}
		}

		if (typeof notification.raffleTicketPrice === "number") {
			meta.push(
				`<li><strong>Valor del boleto:</strong> ${copFormat.format(notification.raffleTicketPrice)}</li>`,
			);
		}

		if (notification.raffleDescription) {
			meta.push(
				`<li><strong>Detalles:</strong> ${notification.raffleDescription}</li>`,
			);
		}

		return meta.length > 0
			? `<ul style="list-style:none;padding:0;margin:8px 0 0;">${meta.join("")}</ul>`
			: "";
	}

	private formatPrize(prize: RafflePrizePayload): string {
		const label = PRIZE_LABELS[prize.type] ?? (prize.type || "Premio");
		return `<li style="padding:4px 0;"><strong>${label}:</strong> ${prize.name}</li>`;
	}

	private buildNumbersList(
		notification: Parameters<ITicketConfirmationNotifier["notify"]>[0],
	): string {
		const digits = notification.maxTickets
			? String(notification.maxTickets).length
			: 6;
		return `<ul style="list-style:none;padding:0;max-width:420px">${notification.numbers
			.map(
				(n) =>
					`<li style="display:inline-block;margin:4px;padding:8px 14px;border:1px solid #e4e4e7;border-radius:8px;"><strong>${String(n).padStart(digits, "0")}</strong></li>`,
			)
			.join("")}</ul>`;
	}
}
