import type { WompiSettings } from "@/shared/contracts/IWompiConfigReader.contract.js";

interface General {
	nameBusiness?: string;
	email?: string;
	phone?: string;
}

interface WompiConfig {
	enabled?: boolean;
	environment?: WompiSettings["environment"];
	publicKey?: string;
	privateKey?: string;
	integrityKey?: string;
	eventsKey?: string;
}

export interface PaymentProviderSettings {
	enabled?: boolean;
	provider?: string;
	environment?: "sandbox" | "production";
	publicKey?: string;
	privateKey?: string;
	integrityKey?: string;
	eventsKey?: string;
}

export interface EmailIntegration {
	enabled?: boolean;
	provider?: "smtp" | "brevo" | "resend" | "sendgrid";
	host?: string;
	port?: number;
	secure?: boolean;
	user?: string;
	password?: string;
	apiKey?: string;
	fromEmail?: string;
	fromName?: string;
}

export interface SmsIntegration {
	enabled?: boolean;
	provider?: "brevo" | "twilio" | "http";
	apiKey?: string;
	apiUrl?: string;
	fromNumber?: string;
	accountSid?: string;
	authToken?: string;
}

export interface IntegrationsConfig {
	payments?: Record<string, PaymentProviderSettings>;
	email?: EmailIntegration;
	sms?: SmsIntegration;
}

export interface Config {
	isSingleton?: boolean;
	general?: General;
	wompi?: WompiConfig;
	integrations?: IntegrationsConfig;
	createdAt?: Date;
	updatedAt?: Date;
}
