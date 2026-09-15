import { NotificationController } from "../../features/notification/adapters/in/http/controllers/Notification.controller.js";
import { NotificationRepository } from "../../features/notification/adapters/out/persistence/repositories/Notification.repository.js";
import { NotificationService } from "../../features/notification/application/services/NotificationService.js";
import {
	ListNotifications,
	MarkAllAsRead,
	MarkAsRead,
} from "../../features/notification/application/use-cases/index.js";
import { UserRepository } from "../../features/user/adapters/out/persistence/repositories/User.repository.js";
import { resolveEmailClientFromConfig } from "../../infra/email/index.js";
import { appLogger } from "./Logger.di.js";
import { sseServer } from "./SseServer.di.js";

const notificationRepo = new NotificationRepository();
const userRepo = new UserRepository();

export const notificationService = new NotificationService(
	userRepo,
	notificationRepo,
	sseServer,
	resolveEmailClientFromConfig,
);

const listNotifications = new ListNotifications(notificationRepo);
const markAsRead = new MarkAsRead(notificationRepo, appLogger);
const markAllAsRead = new MarkAllAsRead(notificationRepo, appLogger);

export const notificationController = new NotificationController(
	listNotifications,
	markAsRead,
	markAllAsRead,
	sseServer,
	userRepo,
	notificationRepo,
);
