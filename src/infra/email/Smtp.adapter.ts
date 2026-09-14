import { createTransport, type Transporter } from "nodemailer";

import type { IEmailPort } from "@/shared/port/IEmail.port.js";
import type { EmailSenderConfig } from "./Brevo.adapter.js";

export interface SmtpAdapterConfig extends EmailSenderConfig {
	host: string;
	port: number;
	secure: boolean;
	user?: string;
	pass?: string;
}

export class SmtpAdapter implements IEmailPort {
	private transporter: Transporter;
	private readonly fromEmail: string;
	private readonly fromName: string;

	constructor(config: SmtpAdapterConfig) {
		this.transporter = createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: config.user
				? { user: config.user, pass: config.pass ?? "" }
				: undefined,
		});
		this.fromEmail = config.fromEmail;
		this.fromName = config.fromName;
	}

	async send(to: string, subject: string, html: string) {
		return this.transporter.sendMail({
			from: { name: this.fromName, address: this.fromEmail },
			to,
			subject,
			html,
		});
	}

	async verify(): Promise<boolean> {
		return this.transporter.verify();
	}
}
