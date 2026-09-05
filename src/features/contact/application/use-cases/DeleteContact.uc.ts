import type { IContactRepository } from "@/features/contact/domain/repositories/IContact.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class DeleteContact {
	constructor(private contactRepo: IContactRepository) {}
	async execute(uid: string): Promise<boolean> {
		if (!uid) {
			throw new UseCaseError(
				"UID de contacto requerido para eliminar el perfil.",
			);
		}
		const result = await this.contactRepo.delete(uid);
		if (!result) {
			throw new UseCaseError("No se pudo eliminar el contacto.");
		}
		return result;
	}
}
