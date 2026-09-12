import type { INotificationRepository } from "@/features/notification/domain/repositories/INotification.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";

export class MarkAllAsRead {
	constructor(
		private readonly notificationRepo: INotificationRepository,
		private readonly logger: ILogger,
	) {}

	async execute(userId: string): Promise<void> {
		if (!userId) throw new UseCaseError("El userId es requerido");
		await this.notificationRepo.markAllAsRead(userId);
		this.logger.info("Notificaciones marcadas como leídas", {
			operation: "notification.mark_all_as_read",
			userId,
		});
	}
}
