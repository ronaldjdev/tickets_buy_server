import { model, Schema } from "mongoose";

import type { Combo } from "../../../../domain/entities/Combo.entity.js";

const ComboSchema = new Schema(
	{
		_id: { type: String },
		raffleId: { type: String, required: true, ref: "Raffle", index: true },
		name: { type: String, required: true },
		ticketCount: { type: Number, required: true, min: 1 },
		price: { type: Number, required: true, min: 0 },
		plays: { type: Number, required: true, default: 0, min: 0 },
		recommended: { type: Boolean, default: false },
	},
	{ timestamps: true, versionKey: false },
);

ComboSchema.index({ raffleId: 1, name: 1 }, { unique: true });

export default model<Combo>("Combo", ComboSchema);
