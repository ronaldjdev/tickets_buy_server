import { BrevoClient } from "@getbrevo/brevo";

import type { IEmailPort } from "@/shared/port/IEmail.port.js";

export interface EmailSenderConfig {
	fromEmail: string;
	fromName: string;
}

export class BrevoAdapter implements IEmailPort {
	private client: BrevoClient;
	private readonly fromEmail: string;
	private readonly fromName: string;

	constructor(apiKey: string, config: EmailSenderConfig) {
		this.client = new BrevoClient({ apiKey });
		this.fromEmail = config.fromEmail;
		this.fromName = config.fromName;
	}

	async send(to: string, subject: string, html: string) {
		return this.client.transactionalEmails.sendTransacEmail({
			sender: { email: this.fromEmail, name: this.fromName },
			to: [{ email: to }],
			subject,
			htmlContent: html,
		});
	}

	async verify(): Promise<boolean> {
		return true;
	}
}
