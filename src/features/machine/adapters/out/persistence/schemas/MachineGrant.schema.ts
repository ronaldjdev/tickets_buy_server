import { model, Schema } from "mongoose";
import type { MachineGrant } from "../../../../domain/entities/MachineGrant.entity.js";

type MachineGrantDocument = MachineGrant & {
	_id: string;
};

const MachineGrantSchema = new Schema<MachineGrantDocument>(
	{
		_id: { type: String },
		documentNumber: { type: String, required: true, index: true },
		raffleId: { type: String, required: true, index: true },
		delta: { type: Number, required: true },
		note: { type: String },
		createdBy: { type: String },
	},
	{ timestamps: true, versionKey: false },
);

MachineGrantSchema.index(
	{ documentNumber: 1, raffleId: 1 },
	{ name: "machine_grant_document_raffle" },
);

export default model<MachineGrantDocument>("MachineGrant", MachineGrantSchema);
