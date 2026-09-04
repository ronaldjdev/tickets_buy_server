import { model, Schema } from "mongoose";
import type { Ticket } from "@/features/ticket/domain/entities/Ticket.entity";

const TicketSchema = new Schema<Ticket>(
	{
		raffleId: { type: String, required: true, ref: "Raffle" },
		number: { type: Number, required: true },
		buyerName: { type: String },
		buyerEmail: { type: String },
		status: {
			type: String,
			enum: ["available", "purchased", "winner"],
			default: "available",
			required: true,
		},
	},
	{ timestamps: true, versionKey: false },
);

TicketSchema.index({ raffleId: 1, number: 1 }, { unique: true });

export default model<Ticket>("Ticket", TicketSchema);
