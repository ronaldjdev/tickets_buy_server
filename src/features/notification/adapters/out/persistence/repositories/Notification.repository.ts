import { RepositoryError } from "../../../../../../shared/errors/RepositoryError.js";
import { NotificationMapper } from "../../../../application/mappers/Notification.mapper.js";
import type { AppNotification } from "../../../../domain/entities/Notification.entity.js";
import type {
	IListNotificationsResponse,
	INotificationRepository,
} from "../../../../domain/repositories/INotification.repository.js";
import NotificationModel from "../schemas/Notification.schema.js";

export class NotificationRepository implements INotificationRepository {
	async create(data: Partial<AppNotification>): Promise<AppNotification> {
		try {
			const doc = await NotificationModel.create(
				NotificationMapper.toPersistence(data),
			);
			return NotificationMapper.toDomain(doc.toObject());
		} catch (error: any) {
			throw new RepositoryError("Error al crear la notificación", error);
		}
	}

	async findById(id: string): Promise<AppNotification | null> {
		try {
			const doc = await NotificationModel.findById(id).lean();
			return doc ? NotificationMapper.toDomain(doc) : null;
		} catch (error: any) {
			throw new RepositoryError("Error al buscar la notificación", error);
		}
	}

	async findByUserId(
		userId: string,
		options?: { page?: number; limit?: number; unreadOnly?: boolean },
	): Promise<IListNotificationsResponse> {
		try {
			const page = options?.page ?? 1;
			const limit = options?.limit ?? 20;
			const query: any = { userId };
			if (options?.unreadOnly) query.read = false;

			const [docs, total, unreadCount] = await Promise.all([
				NotificationModel.find(query)
					.sort({ createdAt: -1 })
					.skip((page - 1) * limit)
					.limit(limit)
					.lean(),
				NotificationModel.countDocuments({ userId }),
				NotificationModel.countDocuments({ userId, read: false }),
			]);

			return {
				notifications: docs.map((d) => NotificationMapper.toDomain(d)),
				total,
				unreadCount,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			};
		} catch (error: any) {
			throw new RepositoryError("Error al listar notificaciones", error);
		}
	}

	async markAsRead(
		id: string,
		userId: string,
	): Promise<AppNotification | null> {
		try {
			const doc = await NotificationModel.findOneAndUpdate(
				{ _id: id, userId },
				{ read: true },
				{ new: true },
			).lean();
			return doc ? NotificationMapper.toDomain(doc) : null;
		} catch (error: any) {
			throw new RepositoryError(
				"Error al marcar notificación como leída",
				error,
			);
		}
	}

	async markAllAsRead(userId: string): Promise<void> {
		try {
			await NotificationModel.updateMany(
				{ userId, read: false },
				{ read: true },
			);
		} catch (error: any) {
			throw new RepositoryError(
				"Error al marcar notificaciones como leídas",
				error,
			);
		}
	}

	async getUnreadCount(userId: string): Promise<number> {
		try {
			return await NotificationModel.countDocuments({ userId, read: false });
		} catch (error: any) {
			throw new RepositoryError(
				"Error al contar notificaciones no leídas",
				error,
			);
		}
	}
}
