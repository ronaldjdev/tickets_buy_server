import type { IEmailPort } from "@/shared/port/IEmail.port.js";
import { BrevoAdapter, type EmailSenderConfig } from "./Brevo.adapter.js";
import { SmtpAdapter } from "./Smtp.adapter.js";

export type EmailProvider = "brevo" | "smtp";

function resolveSenderConfig(): EmailSenderConfig {
	return {
		fromEmail: process.env.EMAIL_FROM_EMAIL ?? "no-reply@celux.com.co",
		fromName: process.env.EMAIL_FROM_NAME ?? "Celux",
	};
}

function resolveProvider(): EmailProvider {
	const provider = (process.env.EMAIL_PROVIDER ?? "brevo").toLowerCase();
	return provider === "smtp" ? "smtp" : "brevo";
}

function createEmailClient(provider: EmailProvider): IEmailPort {
	const sender = resolveSenderConfig();

	if (provider === "smtp") {
		return new SmtpAdapter({
			...sender,
			host: process.env.SMTP_HOST ?? "localhost",
			port: parseInt(process.env.SMTP_PORT ?? "587", 10),
			secure: process.env.SMTP_SECURE === "true",
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		});
	}

	return new BrevoAdapter(process.env.BREVO_API_KEY ?? "", sender);
}

let _instance: IEmailPort | null = null;

export function getEmailClient(): IEmailPort {
	if (!_instance) {
		_instance = createEmailClient(resolveProvider());
	}
	return _instance;
}

export { createEmailClient, resolveProvider };
