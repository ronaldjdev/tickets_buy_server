import type {
	DocumentType,
	UserRole,
	UserStatus,
} from "../../../../shared/types/types.js";

export interface NotificationPreferences {
	toast?: boolean;
	push?: boolean;
	email?: boolean;
}

export interface User {
	userId: string;
	name: string;
	documentType: DocumentType;
	documentNumber: string;
	email?: string;
	password?: string;
	phone: string;
	role: UserRole;
	status: UserStatus;
	notificationPreferences?: NotificationPreferences;
}

export type Status = string | string[] | UserStatus | UserStatus[];
