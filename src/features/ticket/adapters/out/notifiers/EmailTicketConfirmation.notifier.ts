import { getEmailClient } from "@/infra/email/index";
import logger from "@/platform/logger/index.js";
import type { ITicketConfirmationNotifier } from "@/shared/contracts/ITicketConfirmationNotifier.contract.js";
import { getHtmlTemplate } from "@/shared/utils/emailTemplate.js";

export class EmailTicketConfirmationNotifier
	implements ITicketConfirmationNotifier
{
	async notify(
		notification: Parameters<ITicketConfirmationNotifier["notify"]>[0],
	): Promise<void> {
		try {
			if (!notification.buyerEmail) return;

			const digits = notification.maxTickets
				? String(notification.maxTickets).length
				: 6;
			const numbers = notification.numbers
				.map(
					(n) =>
						`<li style="display:inline-block;margin:4px;padding:8px 14px;border:1px solid #e4e4e7;border-radius:8px;"><strong>${String(n).padStart(digits, "0")}</strong></li>`,
				)
				.join("");

			const html = getHtmlTemplate({
				title: `Tus boletos - ${notification.raffleTitle}`,
				content: `<p>¡Hola ${
					notification.buyerName ?? "comprador"
				}!</p><p>Tu pago fue recibido. Estos son los boletos de tu combo para <strong>${notification.raffleTitle}</strong>:</p><ul style="list-style:none;padding:0;max-width:420px">${numbers}</ul><p>Guarda tus números, el ganador se elige al azar entre todas las boletas vendidas.</p>`,
			});

			await getEmailClient().send(
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
				error,
			});
		}
	}
}
