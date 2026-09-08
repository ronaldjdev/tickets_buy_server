import type { IEmailPort } from "@/shared/port/IEmail.port.js";
import { BrevoAdapter, type EmailSenderConfig } from "./Brevo.adapter.js";
import { SmtpAdapter } from "./Smtp.adapter.js";

export type EmailProvider = "brevo" | "smtp";

export interface EmailIntegrationSettings {
	enabled?: boolean;
	provider?: string;
	host?: string;
	port?: number;
	secure?: boolean;
	user?: string;
	password?: string;
	apiKey?: string;
	fromEmail?: string;
	fromName?: string;
}

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

/** Construye un cliente de email desde la config de Integraciones. Devuelve null si no está habilitada o el proveedor no está soportado. */
export function createEmailClientFromConfig(
	settings?: EmailIntegrationSettings,
): IEmailPort | null {
	if (!settings?.enabled) return null;

	const sender: EmailSenderConfig = {
		fromEmail: settings.fromEmail ?? "no-reply@celux.com.co",
		fromName: settings.fromName ?? "Celux",
	};

	if (settings.provider === "smtp") {
		return new SmtpAdapter({
			...sender,
			host: settings.host ?? "localhost",
			port: settings.port ?? 587,
			secure: settings.secure ?? false,
			user: settings.user,
			pass: settings.password,
		});
	}

	if (settings.provider === "brevo" && settings.apiKey) {
		return new BrevoAdapter(settings.apiKey, sender);
	}

	return null;
}

let _instance: IEmailPort | null = null;

export function getEmailClient(): IEmailPort {
	if (!_instance) {
		_instance = createEmailClient(resolveProvider());
	}
	return _instance;
}

export { createEmailClient, resolveProvider };
