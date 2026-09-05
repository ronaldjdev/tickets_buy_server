import type { Auth } from "better-auth";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, openAPI } from "better-auth/plugins";
import { getEmailClient } from "@/infra/email/index";
import db from "@/infra/mongodb/Mongo.config.js";
import { configPromise } from "@/platform/config/index";
import logger from "@/platform/logger/index.js";
import { getHtmlTemplate } from "@/shared/utils/emailTemplate.js";

let authInstance: Auth | null = null;

export async function initAuth(): Promise<Auth> {
	if (authInstance) return authInstance;

	const config = await configPromise;

	authInstance = betterAuth({
		database: mongodbAdapter(db as any),
		baseURL: config.server.url,
		basePath: "/api/auth",

		emailAndPassword: {
			enabled: true,
			disableSignUp: false,
			minPasswordLength: 8,
			maxPasswordLength: 128,
			autoSignIn: true,
			requireEmailVerification: false,
			resetPassword: {
				callbackURL: `${config.frontend.url}/reset-password`,
			},
			sendResetPassword: async ({
				user,
				token,
			}: {
				user: any;
				token: string;
			}) => {
				const resetUrl = `${config.frontend.url}/auth/reset-password?token=${token}`;
				const html = getHtmlTemplate({
					title: "Restablecer contraseña",
					content: `<p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar.</p>`,
					actionUrl: resetUrl,
					actionText: "Restablecer contraseña",
				});

				await getEmailClient()
					.send(user.email, "Restablecer contraseña", html)
					.then(() =>
						logger.info("Correo de recuperación enviado satisfactoriamente"),
					);
			},
			onPasswordReset: async (data: any) => {
				logger.info("✅ Contraseña restablecida con exito", {
					email: data.user.email,
				});
			},
			sendEmailVerification: async ({ user, url }: any) => {
				const html = getHtmlTemplate({
					title: "Verifica tu correo",
					content: `<p>Gracias por registrarte. Por favor, verifica tu dirección de correo electrónico haciendo clic en el botón de abajo.</p>`,
					actionUrl: url,
					actionText: "Verificar correo",
				});

				await getEmailClient().send(user.email, "Verifica tu correo", html);
			},
		},

		user: {
			modelName: "authuser",
			fields: {
				id: "_id",
				email: "email",
				password: "password",
				emailVerified: "emailVerified",
				displayName: "displayName",
				role: "role",
				createdAt: "createdAt",
				updatedAt: "updatedAt",
			},
		},

		session: {
			modelName: "session",
			fields: {
				id: "_id",
				userId: "userId",
				expiresAt: "expiresAt",
				ipAddress: "ipAddress",
				userAgent: "userAgent",
				activePeriodExpiresAt: "activePeriodExpiresAt",
				createdAt: "createdAt",
				updatedAt: "updatedAt",
			},
		},

		account: {
			modelName: "account",
			fields: {
				id: "_id",
				userId: "userId",
				providerId: "providerId",
				accountId: "accountId",
				accessToken: "accessToken",
				refreshToken: "refreshToken",
				expiresAt: "expiresAt",
				createdAt: "createdAt",
				updatedAt: "updatedAt",
			},
		},

		verification: {
			modelName: "verification",
			fields: {
				id: "_id",
				identifier: "identifier",
				value: "value",
				expiresAt: "expiresAt",
				createdAt: "createdAt",
				updatedAt: "updatedAt",
			},
		},

		plugins: [
			admin({
				defaultRole: "vendedor",
				adminRoles: ["admin"],
			}),
			openAPI(),
		],

		telemetry: {
			enabled: false,
		},
		advanced: {
			disableOriginCheck: true,
			disableCSRFCheck: true,
			cookies: {
				session_token: {
					attributes: {
						httpOnly: false,
					},
				},
			},
		},

		secret: process.env.BETTER_AUTH_SECRET ?? "",
	} as any) as unknown as Auth;

	return authInstance;
}

// Helpers que requieren instancia inicializada
export async function getAuthApi() {
	const auth = await initAuth();
	return auth.api;
}

export async function getAuthHandlers() {
	const auth = await initAuth();
	return auth.handler;
}
