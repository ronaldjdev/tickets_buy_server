import { NotificationController } from "@/features/notification/adapters/in/http/controllers/Notification.controller";
import { NotificationRepository } from "@/features/notification/adapters/out/persistence/repositories/Notification.repository";
import {
	CreateNotification,
	ListNotifications,
	MarkAllAsRead,
	MarkAsRead,
	NotifyAllUsers,
} from "@/features/notification/application/use-cases";
import { UserRepository } from "@/features/user/adapters/out/persistence/repositories/User.repository";
import { sseServer } from "./SseServer.di";

const notificationRepo = new NotificationRepository();
const userRepo = new UserRepository();

export const createNotification = new CreateNotification(
	notificationRepo,
	sseServer,
);
export const notifyAllUsers = new NotifyAllUsers(userRepo, notificationRepo);
const listNotifications = new ListNotifications(notificationRepo);
const markAsRead = new MarkAsRead(notificationRepo);
const markAllAsRead = new MarkAllAsRead(notificationRepo);

export const notificationController = new NotificationController(
	createNotification,
	listNotifications,
	markAsRead,
	markAllAsRead,
	sseServer,
);
