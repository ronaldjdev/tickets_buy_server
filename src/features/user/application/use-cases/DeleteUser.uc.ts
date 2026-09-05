import type { IUserRepository } from "@/features/user/domain/repositories/IUser.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class DeleteUser {
	constructor(private userRepo: IUserRepository) {}
	async execute(uid: string): Promise<boolean> {
		if (!uid) {
			throw new UseCaseError(
				"UID de usuario requerido para eliminar el perfil.",
			);
		}
		const result = await this.userRepo.delete(uid);
		if (!result) {
			throw new UseCaseError("No se pudo eliminar el usuario.");
		}
		return result;
	}
}
