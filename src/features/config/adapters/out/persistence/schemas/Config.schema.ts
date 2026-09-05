import { model, Schema } from "mongoose";

import type { Config } from "@/features/config/domain/entities/Config.entity.js";

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
	},
	{ timestamps: true },
);

export default model<Config>("Config", ConfigSchema);
