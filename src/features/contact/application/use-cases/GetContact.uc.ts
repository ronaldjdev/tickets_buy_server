import type { Contact } from "@/features/contact/domain/entities/Contact.entity.js";
import type { IContactRepository } from "@/features/contact/domain/repositories/IContact.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";

export class GetContact {
	constructor(private contactRepo: IContactRepository) {}
	async execute(id: string): Promise<Contact | null> {
		if (!id) {
			throw new UseCaseError(
				"UID de contacto requerido para obtener el perfil.",
			);
		}
		const contact = await this.contactRepo.findById(id);
		if (!contact) {
			throw new UseCaseError("Contacto no encontrado.");
		}
		return contact;
	}
}
