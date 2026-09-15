import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "../../../../../../shared/errors/ValidationError.js";
import response from "../../../../../../shared/http/Response.utils.js";
import type { ISseServer } from "../../../../../../shared/port/ISseServer.port.js";
import type { Paginate } from "../../../../../../shared/types/types.js";
import type { IUserRepository } from "../../../../../user/domain/repositories/IUser.repository.js";
import type {
	ListNotifications,
	MarkAllAsRead,
	MarkAsRead,
} from "../../../../application/use-cases/index.js";
import type { INotificationRepository } from "../../../../domain/repositories/INotification.repository.js";
import type { ListNotificationsQueryDTO } from "../dto/notification.dto.js";

type NotificationPreferencesInput = {
	toast?: boolean;
	push?: boolean;
	email?: boolean;
};

export class NotificationController {
	constructor(
		private readonly listNotificationsUseCase: ListNotifications,
		private readonly markAsReadUseCase: MarkAsRead,
		private readonly markAllAsReadUseCase: MarkAllAsRead,
		private readonly sseServer: ISseServer,
		private readonly userRepo: IUserRepository,
		private readonly notificationRepo: INotificationRepository,
	) {}

	stream = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.user?.id) return response(res, 401, "No autenticado");

			this.sseServer.addClient(req.user.id, req, res);
		} catch (error: any) {
			next(error);
		}
	};

	list = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.user) return response(res, 401, "No autenticado");

			const {
				page: pageStr,
				limit: limitStr,
				unreadOnly: unreadStr,
			} = req.query as unknown as ListNotificationsQueryDTO;
			const page = parseInt(String(pageStr ?? "1"), 10);
			const limit = parseInt(String(limitStr ?? "20"), 10);
			const unreadOnly = ["true", "1", "yes"].includes(
				String(unreadStr ?? "").toLowerCase(),
			);

			const result = await this.listNotificationsUseCase.execute(req.user.id, {
				page,
				limit,
				unreadOnly,
			});

			const paginate: Paginate = {
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages: result.totalPages,
				hasNextPage: result.page < result.totalPages,
				hasPrevPage: result.page > 1,
			};

			response(
				res,
				200,
				"Notificaciones obtenidas",
				result.notifications,
				result.total,
				paginate,
			);
		} catch (error: any) {
			next(error);
		}
	};

	unreadCount = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.user) return response(res, 401, "No autenticado");

			const count = await this.notificationRepo.getUnreadCount(req.user.id);
			response(res, 200, "Notificaciones no leídas", { unreadCount: count });
		} catch (error: any) {
			next(error);
		}
	};

	getPreferences = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.user) return response(res, 401, "No autenticado");

			const user = await this.userRepo.findByUserId(req.user.id);
			response(res, 200, "Preferencias obtenidas", {
				preferences: user?.notificationPreferences ?? {},
			});
		} catch (error: any) {
			next(error);
		}
	};

	updatePreferences = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			if (!req.user) return response(res, 401, "No autenticado");

			const user = await this.userRepo.findByUserId(req.user.id);
			if (!user) return response(res, 404, "Usuario no encontrado", null);

			const body =
				(req.body as { notifications?: NotificationPreferencesInput })
					.notifications ?? (req.body as NotificationPreferencesInput);

			const preferences: NotificationPreferencesInput = {
				toast: body.toast !== undefined ? Boolean(body.toast) : undefined,
				push: body.push !== undefined ? Boolean(body.push) : undefined,
				email: body.email !== undefined ? Boolean(body.email) : undefined,
			};

			const updated = await this.userRepo.update(
				(user as unknown as { _id: string })._id,
				{ notificationPreferences: preferences },
			);

			response(res, 200, "Preferencias actualizadas", {
				preferences: updated?.notificationPreferences ?? preferences,
			});
		} catch (error: any) {
			next(error);
		}
	};

	read = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.user) return response(res, 401, "No autenticado");
			const { id } = req.params;
			if (!id) throw new ValidationError("ID de notificación requerido");

			const notification = await this.markAsReadUseCase.execute(
				id,
				req.user.id,
			);
			response(res, 200, "Notificación marcada como leída", notification);
		} catch (error: any) {
			next(error);
		}
	};

	readAll = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.user) return response(res, 401, "No autenticado");

			await this.markAllAsReadUseCase.execute(req.user.id);
			response(res, 200, "Todas las notificaciones marcadas como leídas", {
				unreadCount: 0,
			});
		} catch (error: any) {
			next(error);
		}
	};
}
