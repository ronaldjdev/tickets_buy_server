import { model, Schema } from "mongoose";

import type {
	GatewayIntent,
	GatewayIntentStatus,
	GatewayMode,
	GatewayName,
} from "../../../../domain/entities/GatewayIntent.entity.js";

const GatewayIntentSchema = new Schema<GatewayIntent>(
	{
		reference: { type: String, required: true, unique: true },
		gateway: {
			type: String,
			required: true,
			enum: ["wompi", "epayco"] as GatewayName[],
		},
		mode: {
			type: String,
			required: true,
			enum: ["link", "widget"] as GatewayMode[],
		},
		purchaseId: { type: String, required: true, index: true },
		ticketIds: { type: [String], default: [] },
		contactId: { type: String },
		contactName: { type: String },
		contactPhone: { type: String },
		raffleId: { type: String, index: true },
		buyerDocumentNumber: { type: String, index: true },
		plays: { type: Number, default: 0, min: 0 },
		amountInCents: { type: Number, required: true },
		currency: { type: String, required: true, default: "COP" },
		status: {
			type: String,
			required: true,
			default: "creada",
			enum: [
				"creada",
				"pagada",
				"declinada",
				"anulada",
				"error",
			] as GatewayIntentStatus[],
		},
		linkId: { type: String, index: true },
		checkoutUrl: { type: String },
		transactionId: { type: String },
		paymentMethodType: { type: String },
		customerEmail: { type: String },
		expiresAt: { type: Date },
	},
	{ timestamps: true },
);

export default model<GatewayIntent>("GatewayIntent", GatewayIntentSchema);
