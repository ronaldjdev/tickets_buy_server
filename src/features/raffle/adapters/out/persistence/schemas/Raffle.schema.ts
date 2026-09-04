import { model, Schema } from "mongoose";
import type {
	Raffle,
	RafflePrize,
} from "../../../../domain/entities/Raffle.entity.js";

const RaffleSchema = new Schema<Raffle>(
	{
		title: { type: String, required: true },
		description: { type: String },
		prize: {
			name: { type: String, required: true },
			description: { type: String },
		} as unknown as RafflePrize,
		startDate: { type: Date, required: true },
		endDate: { type: Date, required: true },
		ticketPrice: { type: Number, required: true },
		maxTickets: { type: Number, required: true },
		status: {
			type: String,
			enum: ["draft", "active", "drawn"],
			default: "draft",
			required: true,
		},
		winnerTicketId: { type: String },
	},
	{ timestamps: true, versionKey: false },
);

RaffleSchema.index({ status: 1 });

export default model<Raffle>("Raffle", RaffleSchema);
