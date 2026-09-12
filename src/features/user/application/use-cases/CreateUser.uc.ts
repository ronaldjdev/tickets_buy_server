import type { User } from "@/features/user/domain/entities/User.entity.js";
import type { IUserRepository } from "@/features/user/domain/repositories/IUser.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";

export class CreateUser {
	constructor(
		private userRepo: IUserRepository,
		private readonly logger: ILogger,
	) {}
	async execute(data: User): Promise<User | null> {
		if (!data) {
			throw new UseCaseError(
				"No se proporcionaron datos para crear el usuario.",
			);
		}
		const user = await this.userRepo.create(data);
		if (!user) {
			throw new UseCaseError("No se pudo crear el usuario.");
		}
		this.logger.info("Usuario creado", {
			operation: "user.create",
			userId: user.userId,
			email: user.email,
			role: user.role,
		});
		return user;
	}
}
