import type { AppNotification } from "@/features/notification/domain/entities/Notification.entity.js";
import type { INotificationRepository } from "@/features/notification/domain/repositories/INotification.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ISseServer } from "@/shared/port/ISseServer.port.js";

export class CreateNotification {
	constructor(
		private readonly notificationRepo: INotificationRepository,
		private readonly sseServer: ISseServer,
	) {}

	async execute(data: Partial<AppNotification>): Promise<AppNotification> {
		if (!data.userId) throw new UseCaseError("El userId es requerido");
		if (!data.type)
			throw new UseCaseError("El tipo de notificación es requerido");
		if (!data.title) throw new UseCaseError("El título es requerido");
		if (!data.message) throw new UseCaseError("El mensaje es requerido");

		const notification = await this.notificationRepo.create({
			...data,
			read: false,
		});

		this.sseServer.sendToUser(
			data.userId.toString(),
			"notification",
			notification,
		);

		return notification;
	}
}
