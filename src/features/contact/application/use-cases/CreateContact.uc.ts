import { UseCaseError } from "../../../../shared/errors/UseCaseError.js";
import type { ILogger } from "../../../../shared/port/ILogger.port.js";
import { normalizePhone } from "../../../../shared/utils/phone.js";
import type { Contact } from "../../domain/entities/Contact.entity.js";
import type { IContactRepository } from "../../domain/repositories/IContact.repository.js";

export class CreateContact {
	constructor(
		private contactRepo: IContactRepository,
		private readonly logger: ILogger,
	) {}
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
		const contactId = this.contactId(contact);
		this.logger.info("Contacto creado", {
			operation: "contact.create",
			contactId,
			email: contact.email,
		});
		return contact;
	}

	private contactId(contact: Contact): string | undefined {
		const withId = contact as unknown as { _id?: { toString(): string } };
		return withId._id?.toString();
	}
}
