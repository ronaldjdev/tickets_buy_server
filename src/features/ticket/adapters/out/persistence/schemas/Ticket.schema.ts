import { model, Schema } from "mongoose";
import type {
	Ticket,
	TicketStatus,
} from "@/features/ticket/domain/entities/Ticket.entity";

const TicketSchema = new Schema<Ticket>(
	{
		raffleId: { type: String, required: true, ref: "Raffle" },
		number: { type: Number, required: true },
		buyerName: { type: String },
		buyerEmail: { type: String },
		buyerPhone: { type: String },
		purchaseId: { type: String, index: true },
		reservedUntil: { type: Date },
		status: {
			type: String,
			enum: ["available", "reserved", "purchased", "winner"],
			default: "available",
			required: true,
		},
	},
	{ timestamps: true, versionKey: false },
);

TicketSchema.index({ raffleId: 1, number: 1 }, { unique: true });
TicketSchema.index({ purchaseId: 1, status: 1 });

export default model<Ticket>("Ticket", TicketSchema);
