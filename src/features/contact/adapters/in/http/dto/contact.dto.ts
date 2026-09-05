import type {
	AccountStatus,
	DocumentType,
	UserStatus,
} from "@/shared/types/types.js";

export interface CreateContactDTO {
	name: string;
	documentType: DocumentType;
	documentNumber: string;
	email?: string;
	phone: string;
	status?: UserStatus;
	accountStatus?: AccountStatus;
	totalDebt?: number;
}

export interface UpdateContactDTO {
	name?: string;
	documentType?: DocumentType;
	documentNumber?: string;
	email?: string;
	phone?: string;
	status?: UserStatus;
	accountStatus?: AccountStatus;
	totalDebt?: number;
}
