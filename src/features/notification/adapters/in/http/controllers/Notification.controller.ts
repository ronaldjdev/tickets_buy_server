import type { NextFunction, Request, Response } from "express";
import type { ListNotificationsQueryDTO } from "@/features/notification/adapters/in/http/dto/notification.dto.js";
import type {
	CreateNotification,
	ListNotifications,
	MarkAllAsRead,
	MarkAsRead,
} from "@/features/notification/application/use-cases/index.js";
import { ValidationError } from "@/shared/errors/ValidationError.js";
import response from "@/shared/http/Response.utils.js";
import type { ISseServer } from "@/shared/port/ISseServer.port.js";
import type { Paginate } from "@/shared/types/types.js";

export class NotificationController {
	constructor(
		readonly _createNotificationUseCase: CreateNotification,
		private readonly listNotificationsUseCase: ListNotifications,
		private readonly markAsReadUseCase: MarkAsRead,
		private readonly markAllAsReadUseCase: MarkAllAsRead,
		private readonly sseServer: ISseServer,
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
			const unreadOnly = unreadStr === true;

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
