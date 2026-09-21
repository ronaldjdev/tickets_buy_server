import { model, Schema } from "mongoose";
import type { MachinePlay } from "../../../../domain/entities/MachinePlay.entity.js";

type MachinePlayDocument = MachinePlay & {
	_id: string;
};

const MachinePlaySchema = new Schema<MachinePlayDocument>(
	{
		_id: { type: String },
		raffleId: { type: String, required: true, index: true },
		purchaseId: { type: String, required: true, index: true },
		reference: { type: String, required: true, index: true },
		documentNumber: { type: String, index: true },
		playedIndex: { type: Number, required: true, min: 1 },
		result: { type: Schema.Types.Mixed, required: true },
		delivered: { type: Boolean, default: false },
		deliveredAt: { type: Date },
	},
	{ timestamps: true, versionKey: false },
);

MachinePlaySchema.index(
	{ reference: 1, playedIndex: 1 },
	{ unique: true, name: "machine_play_unique" },
);

MachinePlaySchema.index(
	{ documentNumber: 1, raffleId: 1 },
	{ name: "machine_play_document_raffle" },
);

export default model<MachinePlayDocument>("MachinePlay", MachinePlaySchema);
