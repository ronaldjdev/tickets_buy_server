import type { NotificationType } from "@/features/notification/domain/entities/Notification.entity.js";
import type { INotificationRepository } from "@/features/notification/domain/repositories/INotification.repository.js";
import type { IUserReader } from "@/shared/contracts/IUserReader.contract.js";

export class NotifyAllUsers {
	constructor(
		private readonly userRepository: IUserReader,
		private readonly notificationRepository: INotificationRepository,
	) {}

	async execute(data: {
		type: NotificationType;
		title: string;
		message: string;
		metadata?: Record<string, unknown>;
	}): Promise<void> {
		const users = await this.userRepository.findActive();
		for (const user of users) {
			await this.notificationRepository.create({
				userId: user.userId,
				type: data.type,
				title: data.title,
				message: data.message,
				read: false,
				metadata: data.metadata,
			});
		}
	}
}
