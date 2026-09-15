import type {
	DocumentType,
	UserStatus,
} from "../../../../shared/types/types.js";

export interface Contact {
	name: string;
	lastName?: string;
	email?: string;
	phone: string;
	documentType?: DocumentType;
	documentNumber?: string;
	country?: string;
	address?: string;
	status: UserStatus;
	welcomedAt?: Date | null;
}

export type Status = string | string[] | UserStatus | UserStatus[];
