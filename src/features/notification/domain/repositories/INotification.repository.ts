import type { AppNotification } from "../entities/Notification.entity.js";

export interface IListNotificationsResponse {
	notifications: AppNotification[];
	total: number;
	unreadCount: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface INotificationRepository {
	create(data: Partial<AppNotification>): Promise<AppNotification>;
	findById(id: string): Promise<AppNotification | null>;
	findByUserId(
		userId: string,
		options?: { page?: number; limit?: number; unreadOnly?: boolean },
	): Promise<IListNotificationsResponse>;
	markAsRead(id: string, userId: string): Promise<AppNotification | null>;
	markAllAsRead(userId: string): Promise<void>;
	getUnreadCount(userId: string): Promise<number>;
}
