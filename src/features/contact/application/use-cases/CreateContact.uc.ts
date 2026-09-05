import type { Contact } from "@/features/contact/domain/entities/Contact.entity.js";
import type { IContactRepository } from "@/features/contact/domain/repositories/IContact.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import { normalizePhone } from "@/shared/utils/phone.js";

export class CreateContact {
	constructor(private contactRepo: IContactRepository) {}
	async execute(data: Contact): Promise<Contact | null> {
		if (!data) {
			throw new UseCaseError(
				"No se proporcionaron datos para crear el contacto.",
			);
		}
		if (data.phone) {
			data.phone = normalizePhone(data.phone);
		}
		const contact = await this.contactRepo.create(data);
		if (!contact) {
			throw new UseCaseError("No se pudo crear el contacto.");
		}
		return contact;
	}
}
