import type { NextFunction, Request, Response } from "express";
import { getAuthApi } from "../../../../../../platform/auth/auth.config.js";
import logger from "../../../../../../platform/logger/index.js";
import { AppError } from "../../../../../../shared/errors/AppError.js";
import { ValidationError } from "../../../../../../shared/errors/ValidationError.js";
import type { ListQueryDTO } from "../../../../../../shared/http/Common.dto.js";
import response from "../../../../../../shared/http/Response.utils.js";
import type {
	UserRole,
	UserStatus,
} from "../../../../../../shared/types/types.js";
import type {
	CreateUser,
	DeleteUser,
	GetUser,
	ListUsers,
	UpdateUser,
} from "../../../../application/use-cases/index.js";
import type { IUserRepository } from "../../../../domain/repositories/IUser.repository.js";
import type {
	CreateUserDTO,
	PasswordResetDTO,
	UpdateRoleDTO,
	UpdateUserDTO,
} from "../dto/user.dto.js";

export class UserController {
	constructor(
		private readonly createUser: CreateUser,
		private readonly getUser: GetUser,
		private readonly listUsers: ListUsers,
		private readonly updateUser: UpdateUser,
		private readonly deleteUser: DeleteUser,
		private readonly userRepo: IUserRepository,
	) {}

	create = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = req.body as CreateUserDTO;
			if (!body) throw new ValidationError("Cuerpo de la solicitud vacío");

			const userCount = await this.userRepo.count();
			const isFirstUser = userCount === 0;
			const role: UserRole = isFirstUser ? "admin" : "vendedor";
			const input = {
				...body,
				role,
				status: isFirstUser ? "activo" : body.status,
			};

			const user = await this.createUser.execute(input as any);

			if (role === "admin") {
				try {
					const auth = await getAuthApi();
					await (auth as any).setRole({
						body: { userId: (req.body as any).userId, role: "admin" },
						headers: req.headers,
					});
				} catch (err) {
					logger.warn("No se pudo sincronizar rol admin con Better Auth", {
						error: err,
					});
				}
			}

			logger.info("Usuario creado con éxito:", { userId: user?.userId, role });
			response(res, 201, "Usuario creado", user);
		} catch (error: any) {
			logger.error("Error al crear el usuario:", error);
			next(error);
		}
	};

	register = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = req.body as CreateUserDTO;
			if (!body) throw new ValidationError("Cuerpo de la solicitud vacío");

			const userCount = await this.userRepo.count();
			const isFirstUser = userCount === 0;

			const input = {
				...body,
				role: (isFirstUser ? "admin" : "vendedor") as UserRole,
				status: (isFirstUser ? "activo" : "pendiente") as UserStatus,
			};

			const user = await this.createUser.execute(input as any);

			if (isFirstUser) {
				try {
					const auth = await getAuthApi();
					await (auth as any).setRole({
						body: { userId: (req.body as any).userId, role: "admin" },
						headers: req.headers,
					});
				} catch (err) {
					logger.warn("No se pudo sincronizar rol admin con Better Auth", {
						error: err,
					});
				}
			}

			logger.info("Usuario registrado con éxito:", { userId: user?.userId });
			response(res, 201, "Usuario registrado", user);
		} catch (error: any) {
			logger.error("Error al registrar el usuario:", error);
			next(error);
		}
	};

	get = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			if (!id) throw new ValidationError("Cuerpo de la solicitud vacío");
			const user = await this.getUser.execute(id);
			logger.info("Usuario obtenido con éxito:", { userId: user?.userId });
			response(res, 200, "Usuario encontrado", user);
		} catch (error: any) {
			logger.error("Error al obtener el usuario:", error);
			next(error);
		}
	};

	list = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { status, date } = req.query as unknown as ListQueryDTO;
			const pageNum = parseInt(String(req.query.page ?? "1"), 10);
			const limitNum = parseInt(String(req.query.limit ?? "10"), 10);
			if (Number.isNaN(pageNum) || pageNum < 1)
				throw new ValidationError("La pagina debe ser un numero mayor a 0");
			if (Number.isNaN(limitNum) || limitNum < 1)
				throw new ValidationError("El limite debe ser un numero mayor a 0");
			const options = {
				limit: limitNum,
				page: pageNum,
				date: date as string | undefined,
				status: status as string | undefined,
				q: String(req.query.q ?? "").trim() || undefined,
				role: String(req.query.role ?? "").trim() || undefined,
			};

			const { users, paginate } = await this.listUsers.execute(options);
			logger.info(`Usuarios listados con éxito: ${paginate.total}`, {
				operation: "listar_usuarios",
			});
			response(res, 200, "Usuarios listados", { users, paginate });
		} catch (error: any) {
			logger.error("Error al listar los usuarios:", error);
			next(error);
		}
	};

	update = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = req.body as UpdateUserDTO;
			const { id } = req.params;
			if (!id) throw new ValidationError("Faltan parámetros requeridos");
			if (!body) throw new ValidationError("Cuerpo de la solicitud vacío");
			const user = await this.updateUser.execute(id, body);

			if (body?.name && user?.userId) {
				try {
					const auth = await getAuthApi();
					await (auth as any).adminUpdateUser({
						body: { userId: user.userId, data: { name: body.name } },
						headers: req.headers,
					});
				} catch (err) {
					logger.warn("No se pudo sincronizar nombre con Better Auth", {
						userId: user.userId,
						error: (err as Error)?.message,
					});
				}
			}

			logger.info("Usuario actualizado con éxito:", { userId: user?.userId });
			response(res, 200, "Usuario actualizado", user);
		} catch (error: any) {
			logger.error("Error al actualizar el usuario:", error);
			next(error);
		}
	};

	updateRole = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const { role } = req.body as UpdateRoleDTO;
			if (!id) throw new ValidationError("ID de usuario requerido");
			if (!role || !["admin", "vendedor"].includes(role)) {
				throw new ValidationError(
					"Rol inválido. Debe ser 'admin' o 'vendedor'",
				);
			}

			const auth = await getAuthApi();
			await (auth as any).setRole({
				body: { userId: id, role },
				headers: req.headers,
			});

			await this.updateUser.execute(id, { role });

			logger.info("Rol actualizado:", { userId: id, role });
			response(res, 200, "Rol actualizado");
		} catch (error: any) {
			if (error instanceof AppError || error instanceof ValidationError) {
				next(error);
			} else {
				logger.error("Error al actualizar rol:", error);
				next(new AppError("Error al actualizar el rol", 500));
			}
		}
	};

	delete = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { uid } = req.params;
			if (!uid) throw new ValidationError("Faltan parámetros requeridos");
			await this.deleteUser.execute(uid);
			logger.info("Usuario eliminado con éxito:", { userId: uid });
			response(res, 200, "Usuario eliminado");
		} catch (error: any) {
			logger.error("Error al eliminar el usuario:", error);
			next(error);
		}
	};

	requestPasswordReset = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { email } = req.body as PasswordResetDTO;
			if (!email) throw new ValidationError("El email es requerido");
			const auth = await getAuthApi();
			await (auth as any).forgetPassword({ body: { email } });
			logger.info("Correo de restablecimiento enviado:", { email });
			response(res, 200, "Correo de restablecimiento enviado");
		} catch (error: any) {
			logger.error("Error al enviar restablecimiento:", error);
			next(error);
		}
	};
}
