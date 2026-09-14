import assert from "node:assert";
import { describe, it } from "node:test";
import type { IEmailPort } from "../../../shared/port/IEmail.port.js";
import { EmailTicketConfirmationNotifier } from "../adapters/out/notifiers/EmailTicketConfirmation.notifier.js";

class FakeEmailClient implements IEmailPort {
	sent: { to: string; subject: string; html: string }[] = [];

	async send(to: string, subject: string, html: string) {
		this.sent.push({ to, subject, html });
	}
}

describe("EmailTicketConfirmationNotifier", () => {
	it("debería enviar el correo con el sorteo, los números y el comprador", async () => {
		const fake = new FakeEmailClient();
		const notifier = new EmailTicketConfirmationNotifier(() =>
			Promise.resolve(fake),
		);

		await notifier.notify({
			purchaseId: "purchase-1",
			buyerEmail: "ana@mail.com",
			buyerName: "Ana",
			raffleTitle: "Rifa Smoke QR2",
			raffleDescription: "Sorteo especial",
			raffleEndDate: "2026-10-15T12:00:00.000Z",
			raffleTicketPrice: 5000,
			prizes: [
				{ type: "mayor", name: "iPhone 15 Pro" },
				{ type: "seco1", name: "Bicicleta" },
			],
			numbers: [7, 42],
			amount: 10000,
			maxTickets: 999999,
		});

		assert.equal(fake.sent.length, 1);
		const email = fake.sent[0];
		assert.equal(email.to, "ana@mail.com");
		assert.match(email.subject, /Rifa Smoke QR2/);
		assert.match(email.html, /Premio mayor:.*iPhone 15 Pro/s);
		assert.match(email.html, /1 seco:.*Bicicleta/s);
		assert.match(email.html, /Fecha del sorteo:/);
		assert.match(email.html, /octubre de 2026/);
		assert.match(email.html, /Valor del boleto:/);
		assert.match(email.html, /000007/);
		assert.match(email.html, /000042/);
	});

	it("no debería enviar si falta el correo del comprador", async () => {
		const fake = new FakeEmailClient();
		const notifier = new EmailTicketConfirmationNotifier(() =>
			Promise.resolve(fake),
		);

		await notifier.notify({
			purchaseId: "purchase-1",
			raffleTitle: "Rifa Smoke QR2",
			numbers: [1],
			amount: 10000,
		});

		assert.equal(fake.sent.length, 0);
	});
});
