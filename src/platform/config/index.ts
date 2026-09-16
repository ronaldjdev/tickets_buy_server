import "dotenv/config";

import { env } from "./Env.config.js";

export type ConfigType = {
	server: {
		port: number;
		env: string;
		url: string;
	};
	frontend: {
		url: string;
	};
	redis: {
		host: string;
		port: number;
		password: string;
	};
	general?: {
		[key: string]: any;
	};
	notifications?: {
		[key: string]: any;
	};
	creditSettings?: {
		[key: string]: any;
	};
	paymentMethods?: {
		[key: string]: any;
	};
	messageTemplates?: {
		[key: string]: any;
	};
	mongo: {
		uri?: string;
	};
	webhook: {
		verifyToken: string;
	};
};

const nodeEnv = process.env.NODE_ENV || "development";

function loadConfig(): ConfigType {
	const serverUrl = process.env.SERVER_URL ?? `http://localhost:${env.port}`;
	const frontendUrl =
		(process.env.FRONTEND_URL ?? "http://localhost:3000")
			.split(",")[0]
			?.trim() ?? "http://localhost:3000";

	return {
		server: {
			port: env.port,
			env: nodeEnv,
			url: serverUrl,
		},
		frontend: {
			url: frontendUrl,
		},
		redis: {
			host: process.env.REDIS_HOST || "localhost",
			port: parseInt(process.env.REDIS_PORT || "6379", 10),
			password: process.env.REDIS_PASSWORD || "",
		},
		mongo: {
			uri: process.env.MONGODB_URI ?? env.mongodbUri,
		},
		webhook: {
			verifyToken: process.env.WEBHOOK_VERIFY_TOKEN ?? "tickets_webhook_verify",
		},
	};
}

export const configPromise = Promise.resolve(loadConfig());

export let config: ConfigType;

export async function initConfig(): Promise<void> {
	config = loadConfig();
}

export async function reloadConfig(): Promise<void> {
	config = loadConfig();
}
