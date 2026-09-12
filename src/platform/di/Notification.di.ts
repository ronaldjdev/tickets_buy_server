import { configRepo } from "@/features/config/di";
import { NotificationController } from "@/features/notification/adapters/in/http/controllers/Notification.controller";
import { NotificationRepository } from "@/features/notification/adapters/out/persistence/repositories/Notification.repository";
import { NotificationService } from "@/features/notification/application/services/NotificationService";
import {
	ListNotifications,
	MarkAllAsRead,
	MarkAsRead,
} from "@/features/notification/application/use-cases";
import { UserRepository } from "@/features/user/adapters/out/persistence/repositories/User.repository";
import {
	createEmailClientFromConfig,
	getEmailClient,
} from "@/infra/email/index.js";
import { appLogger } from "./Logger.di";
import { sseServer } from "./SseServer.di";

const notificationRepo = new NotificationRepository();
const userRepo = new UserRepository();

async function resolveNotificationEmailClient() {
	const config = await configRepo.findSingleton();
	const fromConfig = createEmailClientFromConfig(config?.integrations?.email);
	return fromConfig ?? getEmailClient();
}

export const notificationService = new NotificationService(
	userRepo,
	notificationRepo,
	sseServer,
	resolveNotificationEmailClient,
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
