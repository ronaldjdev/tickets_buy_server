export interface ContactData {
	_id?: { toString(): string };
	id?: string;
	documentNumber: string;
	documentType: string;
	name: string;
	phone: string;
	email?: string;
	totalDebt?: number;
}

export interface IContactReader {
	findById(id: string): Promise<ContactData | null>;
	findByPhone(phone: string): Promise<ContactData | null>;
}
