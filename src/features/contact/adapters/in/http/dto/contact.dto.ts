import type { UserStatus } from "@/shared/types/types.js";

export interface CreateContactDTO {
	name: string;
	email?: string;
	phone: string;
	status?: UserStatus;
}

export interface UpdateContactDTO {
	name?: string;
	email?: string;
	phone?: string;
	status?: UserStatus;
}
