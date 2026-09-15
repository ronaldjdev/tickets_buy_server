import {
	createEmailClientFromConfig,
	type EmailIntegrationSettings,
} from "../../../../infra/email/index.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";

export type EmailTestResult = { ok: boolean; message: string };

export class TestEmailIntegration {
	constructor(private readonly logger: ILogger) {}

	async execute(settings: EmailIntegrationSettings): Promise<EmailTestResult> {
		const applied: EmailIntegrationSettings = { ...settings, enabled: true };

		const client = createEmailClientFromConfig(applied);
		if (!client) {
			const message =
				"El proveedor de correo no está soportado por el backend (usa SMTP o Brevo) o falta la API key.";
			this.logger.warn("Prueba de email: proveedor no soportado", {
				operation: "config.email_test",
			});
			return { ok: false, message };
		}

		try {
			await (client.verify?.() ?? Promise.resolve(true));
			this.logger.info("Prueba de email exitosa", {
				operation: "config.email_test",
				provider: applied.provider,
				host: applied.host,
				port: applied.port,
			});
			return {
				ok: true,
				message: "Conexión exitosa. El proveedor aceptó las credenciales.",
			};
		} catch (error) {
			const raw = (error as Error).message ?? String(error);
			const message = this.friendlyError(raw);
			this.logger.warn("Prueba de email falló", {
				operation: "config.email_test",
				provider: applied.provider,
				host: applied.host,
				port: applied.port,
				error: raw,
			});
			return { ok: false, message };
		}
	}

	private friendlyError(raw: string): string {
		if (
			raw.includes("Username and Password") ||
			raw.includes("Invalid login") ||
			raw.includes("535")
		) {
			return "Error de autenticación: revisa las credenciales. En Gmail usa una Contraseña de aplicación (2FA activa), no tu contraseña normal.";
		}
		if (
			raw.includes("wrong version number") ||
			raw.includes("SSL") ||
			raw.includes("tls") ||
			raw.includes("handshake") ||
			raw.includes("socket hang up") ||
			raw.includes("ECONN")
		) {
			return `No se pudo conectar con el modo TLS correcto (puerto 465 usa SSL, 587 usa STARTTLS). Detalle: ${raw}`;
		}
		if (raw.includes("ETIMEDOUT") || raw.includes("ENOTFOUND")) {
			return `No se pudo alcanzar el servidor SMTP. Revisa el host y el puerto. Detalle: ${raw}`;
		}
		return `No se pudo enviar el correo de prueba: ${raw}`;
	}
}
