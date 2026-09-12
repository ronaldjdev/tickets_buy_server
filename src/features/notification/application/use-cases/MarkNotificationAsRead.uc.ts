import type { AppNotification } from "@/features/notification/domain/entities/Notification.entity.js";
import type { INotificationRepository } from "@/features/notification/domain/repositories/INotification.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";

export class MarkAsRead {
	constructor(
		private readonly notificationRepo: INotificationRepository,
		private readonly logger: ILogger,
	) {}

	async execute(id: string, userId: string): Promise<AppNotification> {
		if (!id) throw new UseCaseError("El ID de notificación es requerido");
		if (!userId) throw new UseCaseError("El userId es requerido");

		const notification = await this.notificationRepo.markAsRead(id, userId);
		if (!notification) throw new UseCaseError("Notificación no encontrada");
		this.logger.info("Notificación marcada como leída", {
			operation: "notification.mark_as_read",
			notificationId: id,
			userId,
		});
		return notification;
	}
}
