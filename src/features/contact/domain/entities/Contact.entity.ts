import type {
	AccountStatus,
	DocumentType,
	UserStatus,
} from "@/shared/types/types.js";

export interface Contact {
	name: string;
	documentType: DocumentType;
	documentNumber: string;
	email?: string;
	phone: string;
	status: UserStatus;
	accountStatus: AccountStatus;
	totalDebt: number;
	welcomedAt?: Date | null;
}

export type Status = string | string[] | UserStatus | UserStatus[];
