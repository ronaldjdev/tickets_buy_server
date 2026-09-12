import { model, Schema } from "mongoose";
import type { Raffle, RafflePrizeType } from "../../../../domain/entities/Raffle.entity.js";

const PrizeSchema = new Schema(
	{
		type: {
			type: String,
			enum: ["mayor", "seco1", "seco2", "seco3", "seco4"],
			required: true,
		},
		name: { type: String, required: true },
		description: { type: String },
	},
	{ _id: false },
);

const RaffleSchema = new Schema(
	{
		_id: { type: String },
		slug: { type: String },
		title: { type: String, required: true },
		description: { type: String },
		prizes: { type: [PrizeSchema], default: undefined },
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
RaffleSchema.index({ slug: 1 }, { unique: true, sparse: true });

export default model<Raffle>("Raffle", RaffleSchema);
