import { model, Schema } from "mongoose";
import type { Raffle } from "../../../../domain/entities/Raffle.entity.js";

const PrizeScheduleSchema = new Schema(
	{
		mode: {
			type: String,
			enum: ["weekday", "date"],
			required: true,
		},
		weekday: {
			type: Number,
			min: 1,
			max: 7,
		},
		date: {
			type: String,
		},
	},
	{ _id: false },
);

const PrizeSchema = new Schema(
	{
		type: {
			type: String,
			enum: ["mayor", "seco1", "seco2", "seco3", "seco4"],
			required: true,
		},
		name: { type: String, required: true },
		description: { type: String },
		imageUrl: { type: String },
		schedule: { type: PrizeScheduleSchema },
		winningNumber: { type: Number },
		winningMinSoldTickets: { type: Number },
		winningExpeditedAt: { type: String },
		winningExpeditedBy: { type: String },
		/** Fecha ISO en que el premio fue entregado vía máquina de tiros. */
		machineClaimedAt: { type: String },
		/** Compra (purchaseId) que reclamó el premio en la máquina. */
		machineClaimedByPurchaseId: { type: String },
	},
	{ _id: false },
);

const MachinePrizeSchema = new Schema(
	{
		kind: { type: String, enum: ["seco", "instant"], required: true },
		prizeType: { type: String },
		id: { type: String },
		name: { type: String },
		description: { type: String },
		imageUrl: { type: String },
		stock: { type: Number },
		winRate: { type: Number, required: true, min: 0, max: 100 },
	},
	{ _id: false },
);

const MachineConfigSchema = new Schema(
	{
		prizes: { type: [MachinePrizeSchema], default: [] },
		enabled: { type: Boolean, default: true },
		playsRule: {
			type: {
				every: { type: Number, min: 1, required: true },
				plays: { type: Number, min: 0, required: true },
			},
			_id: false,
		},
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
		minTickets: { type: Number },
		ticketIssuance: {
			type: String,
			enum: ["random", "consecutive"],
			default: "random",
		},
		status: {
			type: String,
			enum: ["draft", "active", "drawn"],
			default: "draft",
			required: true,
		},
		winnerTicketId: { type: String },
		machine: { type: MachineConfigSchema },
	},
	{ timestamps: true, versionKey: false },
);

RaffleSchema.index({ status: 1 });
RaffleSchema.index({ slug: 1 }, { unique: true, sparse: true });

export default model<Raffle>("Raffle", RaffleSchema);
