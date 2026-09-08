import { Types } from "mongoose";

import type { NotificationType } from "@/features/notification/domain/entities/Notification.entity.js";
import type { INotificationRepository } from "@/features/notification/domain/repositories/INotification.repository.js";
import db from "@/infra/mongodb/Mongo.config.js";
import logger from "@/platform/logger/index.js";
import type { IUserReader } from "@/shared/contracts/IUserReader.contract.js";
import type { IEmailPort } from "@/shared/port/IEmail.port.js";
import type { ISseServer } from "@/shared/port/ISseServer.port.js";
import { getHtmlTemplate } from "@/shared/utils/emailTemplate.js";

export interface NotifyUsersInput {
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
	metadata?: Record<string, unknown>;
}

export class NotificationService {
	constructor(
		private readonly userReader: IUserReader,
		private readonly notificationRepo: INotificationRepository,
		private readonly sseServer: ISseServer,
		private readonly resolveEmailClient: () => Promise<IEmailPort>,
	) {}

	async notifyUsers(input: NotifyUsersInput): Promise<void> {
		const users = await this.userReader.findActive();
		if (users.length === 0) return;

		for (const user of users) {
			try {
				const notification = await this.notificationRepo.create({
					userId: user.userId,
					type: input.type,
					title: input.title,
					message: input.message,
					read: false,
					link: input.link,
					metadata: input.metadata,
				});
				this.sseServer.sendToUser(user.userId, "notification", notification);
			} catch (error) {
				logger.warn("No se pudo crear la notificación", {
					userId: user.userId,
					error,
				});
			}
		}

		await this.sendEmails(users, input);
	}

	private async sendEmails(
		users: Array<{
			userId: string;
			notificationPreferences?: UserReaderDataPrefs;
		}>,
		input: NotifyUsersInput,
	): Promise<void> {
		const recipients = users.filter(
			(user) => user.notificationPreferences?.email === true,
		);
		if (recipients.length === 0) return;

		let emailClient: IEmailPort;
		try {
			emailClient = await this.resolveEmailClient();
		} catch (error) {
			logger.warn("No se pudo resolver el cliente de email", { error });
			return;
		}

		const ids: unknown[] = recipients
			.map((user) => this.toObjectId(user.userId))
			.filter((id): id is Types.ObjectId => id !== null);
		const emails = await this.fetchEmails(ids);
		if (emails.size === 0) return;

		const html = getHtmlTemplate({
			title: input.title,
			content: `<p>${input.message}</p>`,
		});

		for (const [userId, email] of emails) {
			try {
				await emailClient.send(email, input.title, html);
			} catch (error) {
				logger.warn("No se pudo enviar el email de notificación", {
					userId,
					error,
				});
			}
		}
	}

	private toObjectId(value: string): Types.ObjectId | null {
		try {
			return new Types.ObjectId(value);
		} catch {
			return null;
		}
	}

	private async fetchEmails(userIds: unknown[]): Promise<Map<string, string>> {
		const emails = new Map<string, string>();
		try {
			const authUsers = await db
				.collection("authuser")
				.find({ _id: { $in: userIds } } as any)
				.project({ email: 1 })
				.toArray();
			for (const authUser of authUsers) {
				if (authUser?.email) {
					emails.set(String(authUser._id), String(authUser.email));
				}
			}
		} catch (error) {
			logger.warn("No se pudieron resolver los emails de los usuarios", {
				error,
			});
		}
		return emails;
	}
}

type UserReaderDataPrefs = {
	toast?: boolean;
	push?: boolean;
	email?: boolean;
};
