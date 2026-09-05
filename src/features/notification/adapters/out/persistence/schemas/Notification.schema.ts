import { type Document, model, Schema } from "mongoose";

import type { AppNotification } from "@/features/notification/domain/entities/Notification.entity.js";

interface INotification extends Document, AppNotification {}

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
				"payment_reminder",
				"credit_approved",
				"credit_rejected",
				"payment_received",
				"system",
				"task",
				"message",
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
