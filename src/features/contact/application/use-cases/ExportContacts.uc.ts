import type {
	ExportContact,
	IContactRepository,
} from "../../domain/repositories/IContact.repository.js";

export class ExportContacts {
	constructor(private contactRepo: IContactRepository) {}
	async execute(): Promise<ExportContact[]> {
		return this.contactRepo.listAll();
	}
}
