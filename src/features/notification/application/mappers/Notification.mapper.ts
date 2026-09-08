import type { AppNotification } from "@/features/notification/domain/entities/Notification.entity.js";

export const NotificationMapper = {
	toDomain(doc: any): AppNotification {
		return {
			id: doc._id?.toString() ?? doc.id,
			userId: doc.userId,
			type: doc.type,
			title: doc.title,
			message: doc.message,
			read: doc.read,
			link: doc.link,
			metadata: doc.metadata,
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt,
		};
	},

	toPersistence(data: Partial<AppNotification>): Partial<AppNotification> {
		const notification: Partial<AppNotification> = {};
		if (data.userId !== undefined) notification.userId = data.userId;
		if (data.type !== undefined) notification.type = data.type;
		if (data.title !== undefined) notification.title = data.title;
		if (data.message !== undefined) notification.message = data.message;
		if (data.read !== undefined) notification.read = data.read;
		if (data.link !== undefined) notification.link = data.link;
		if (data.metadata !== undefined) notification.metadata = data.metadata;
		return notification;
	},
};
