import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { User } from "../../domain/entities/User.entity.js";
import type { IUserRepository } from "../../domain/repositories/IUser.repository.js";

export class UpdateUser {
	constructor(
		private userRepo: IUserRepository,
		private readonly logger: ILogger,
	) {}
	async execute(id: string, data: Partial<User>): Promise<User | null> {
		if (!id) {
			throw new UseCaseError(
				"ID de usuario requerido para actualizar el perfil.",
			);
		}
		if (!data) {
			throw new UseCaseError(
				"No se proporcionaron datos para actualizar el usuario.",
			);
		}
		const user = await this.userRepo.update(id, data);
		if (!user) {
			throw new UseCaseError("No se pudo actualizar el usuario.");
		}
		this.logger.info("Usuario actualizado", {
			operation: "user.update",
			userId: user.userId,
			email: user.email,
		});
		return user;
	}
}
