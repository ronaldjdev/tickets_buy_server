import type {
	IContactRepository,
	IListContactsResponse,
} from "@/features/contact/domain/repositories/IContact.repository.js";
import { UseCaseError } from "@/shared/errors/UseCaseError.js";
import type { OptionsPag } from "@/shared/types/types.js";

export class ListContacts {
	constructor(private contactRepo: IContactRepository) {}
	async execute(options: OptionsPag): Promise<IListContactsResponse> {
		if (options.limit <= 0)
			throw new UseCaseError("El límite debe ser un número positivo.");
		if (options.page <= 0)
			throw new UseCaseError("La página debe ser un número positivo.");

		const contacts = await this.contactRepo.list(options);
		return contacts;
	}
}
