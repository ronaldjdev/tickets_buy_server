import { type Document, model, Schema } from "mongoose";

import type { AppNotification } from "@/features/notification/domain/entities/Notification.entity.js";

interface INotification extends Document, Omit<AppNotification, "id"> {}

const NotificationSchema = new Schema<INotification>(
	{
		userId: {
			type: Schema.Types.ObjectId as unknown as typeof String,
			ref: "User",
			required: true,
			index: true,
		},
		type: {
			type: String,
			required: true,
			enum: [
				"payment_received",
				"sale_active",
				"sale_drawn",
				"stock_low",
				"sold_out",
				"system",
			],
		},
		title: { type: String, required: true },
		message: { type: String, required: true },
		read: { type: Boolean, default: false },
		link: { type: String },
		metadata: { type: Object },
	},
	{ timestamps: true },
);

NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });
NotificationSchema.index({ userId: 1, read: 1 });

export default model<INotification>("Notification", NotificationSchema);
