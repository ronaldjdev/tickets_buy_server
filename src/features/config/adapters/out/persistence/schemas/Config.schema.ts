import { model, Schema } from "mongoose";

import type { Config } from "@/features/config/domain/entities/Config.entity.js";

const PaymentProviderSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		provider: { type: String },
		environment: { type: String },
		publicKey: { type: String },
		privateKey: { type: String },
		integrityKey: { type: String },
		eventsKey: { type: String },
	},
	{ _id: false },
);

const EmailIntegrationSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		provider: { type: String },
		host: { type: String },
		port: { type: Number },
		secure: { type: Boolean },
		user: { type: String },
		password: { type: String },
		apiKey: { type: String },
		fromEmail: { type: String },
		fromName: { type: String },
	},
	{ _id: false },
);

const SmsIntegrationSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		provider: { type: String },
		apiKey: { type: String },
		apiUrl: { type: String },
		fromNumber: { type: String },
		accountSid: { type: String },
		authToken: { type: String },
	},
	{ _id: false },
);

const ConfigSchema = new Schema<Config>(
	{
		isSingleton: { type: Boolean, default: true, unique: true },
		general: {
			nameBusiness: { type: String },
			email: { type: String },
			phone: { type: String },
		},
		wompi: {
			enabled: { type: Boolean, default: false },
			environment: {
				type: String,
				enum: ["test", "prod"],
				default: "test",
			},
			publicKey: { type: String },
			privateKey: { type: String },
			integrityKey: { type: String },
			eventsKey: { type: String },
		},
		integrations: {
			payments: {
				type: Map,
				of: PaymentProviderSchema,
			},
			email: EmailIntegrationSchema,
			sms: SmsIntegrationSchema,
		},
	},
	{ timestamps: true },
);

export default model<Config>("Config", ConfigSchema);
