import type { User } from "@/features/user/domain/entities/User.entity.js";
import type { IUserRepository } from "@/features/user/domain/repositories/IUser.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class GetUser {
	constructor(private userRepo: IUserRepository) {}
	async execute(id: string): Promise<User | null> {
		if (!id) {
			throw new UseCaseError(
				"UID de usuario requerido para obtener el perfil.",
			);
		}
		let user: User | null;

		try {
			user = await this.userRepo.findById(id);
		} catch {
			try {
				user = await this.userRepo.findByUserId(id);
			} catch {
				throw new UseCaseError("Usuario no encontrado.");
			}
		}
		return user;
	}
}
