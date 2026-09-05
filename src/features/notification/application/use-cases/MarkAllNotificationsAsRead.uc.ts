import type { INotificationRepository } from "@/features/notification/domain/repositories/INotification.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class MarkAllAsRead {
	constructor(private readonly notificationRepo: INotificationRepository) {}

	async execute(userId: string): Promise<void> {
		if (!userId) throw new UseCaseError("El userId es requerido");
		await this.notificationRepo.markAllAsRead(userId);
	}
}
