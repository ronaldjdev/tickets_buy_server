import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import type { IContactRepository } from "../../domain/repositories/IContact.repository.js";

export class DeleteContact {
	constructor(
		private contactRepo: IContactRepository,
		private readonly logger: ILogger,
	) {}
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
		this.logger.info("Contacto eliminado", {
			operation: "contact.delete",
			contactId: uid,
		});
		return result;
	}
}
