import type { UserStatus } from "@/shared/types/types.js";

export interface Contact {
	name: string;
	email?: string;
	phone: string;
	status: UserStatus;
	welcomedAt?: Date | null;
}

export type Status = string | string[] | UserStatus | UserStatus[];
