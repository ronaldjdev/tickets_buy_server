import type {
	IListNotificationsResponse,
	INotificationRepository,
} from "@/features/notification/domain/repositories/INotification.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class ListNotifications {
	constructor(private readonly notificationRepo: INotificationRepository) {}

	async execute(
		userId: string,
		options?: { page?: number; limit?: number; unreadOnly?: boolean },
	): Promise<IListNotificationsResponse> {
		if (!userId) throw new UseCaseError("El userId es requerido");
		return this.notificationRepo.findByUserId(userId, options);
	}
}
