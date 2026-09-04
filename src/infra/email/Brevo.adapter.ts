import { BrevoClient } from "@getbrevo/brevo";

import type { IEmailPort } from "@/shared/port/IEmail.port.js";

export class BrevoAdapter implements IEmailPort {
	private client: BrevoClient;

	constructor(apiKey: string) {
		this.client = new BrevoClient({ apiKey });
	}

	async send(to: string, subject: string, html: string) {
		return this.client.transactionalEmails.sendTransacEmail({
			sender: { email: "no-reply@celux.com.co", name: "Celux" },
			to: [{ email: to }],
			subject,
			htmlContent: html,
		});
	}
}

let _instance: BrevoAdapter | null = null;

export function getBrevo(): BrevoAdapter {
	if (!_instance) {
		_instance = new BrevoAdapter(process.env.BREVO_API_KEY ?? "");
	}
	return _instance;
}
