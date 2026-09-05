import type { User } from "@/features/user/domain/entities/User.entity.js";
import type { IUserRepository } from "@/features/user/domain/repositories/IUser.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class CreateUser {
	constructor(private userRepo: IUserRepository) {}
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
		return user;
	}
}
