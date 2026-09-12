import type { Contact } from "@/features/contact/domain/entities/Contact.entity.js";
import type { IContactRepository } from "@/features/contact/domain/repositories/IContact.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { ILogger } from "@/shared/port/ILogger.port.js";
import { normalizePhone } from "@/shared/utils/phone.js";

export class UpdateContact {
	constructor(
		private contactRepo: IContactRepository,
		private readonly logger: ILogger,
	) {}
	async execute(id: string, data: Partial<Contact>): Promise<Contact | null> {
		if (!id) {
			throw new UseCaseError(
				"UID de contacto requerido para actualizar el perfil.",
			);
		}
		if (!data) {
			throw new UseCaseError(
				"No se proporcionaron datos para actualizar el contacto.",
			);
		}
		if (data.phone) {
			data.phone = normalizePhone(data.phone);
		}
		const contact = await this.contactRepo.update(id, data);
		if (!contact) {
			throw new UseCaseError("No se pudo actualizar el contacto.");
		}
		this.logger.info("Contacto actualizado", {
			operation: "contact.update",
			contactId: id,
			email: contact.email,
		});
		return contact;
	}
}
