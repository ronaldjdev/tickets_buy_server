import type {
	DocumentType,
	UserRole,
	UserStatus,
} from "../../../../../../shared/types/types.js";

export interface CreateUserDTO {
	name: string;
	documentType: DocumentType;
	documentNumber: string;
	email?: string;
	password?: string;
	phone: string;
	role?: UserRole;
	status?: UserStatus;
}

export interface UpdateUserDTO {
	name?: string;
	documentType?: DocumentType;
	documentNumber?: string;
	email?: string;
	password?: string;
	phone?: string;
	role?: UserRole;
	status?: UserStatus;
}

export interface UpdateRoleDTO {
	role: UserRole;
}

export interface PasswordResetDTO {
	email: string;
}
