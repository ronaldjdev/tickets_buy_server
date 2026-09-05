export type RaffleStatus = "pending" | "active" | "closed";
export type TicketStatus = "available" | "purchased" | "reserved";

export type AccountStatus = "al_dia" | "en_mora" | "cancelado" | "pendiente";
export type PaymentStatus = "pendiente" | "confirmado" | "fallido";
export type CreditStatus = "al_dia" | "pagado" | "en_mora" | "cancelado";
export type UserStatus = "activo" | "pendiente" | "suspendido" | "bloqueado";
export type UserRole = "admin" | "vendedor";
export type PaymentMethod =
	| "pse"
	| "efecty"
	| "nequi"
	| "tarjeta"
	| "efectivo"
	| "bancolombia";
export type ProductCategory = "teléfono" | "electrodoméstico" | string;
export type DocumentType = "cc" | "ce" | "pasaporte";
export type PaymentFrequency = "diario" | "semanal" | "quincenal" | "mensual";
export type InstallmentStatus = "pendiente" | "pagada" | "vencida";

export interface OptionsPag {
	limit: number;
	status?: string;
	accountStatus?: string;
	page: number;
	filter?: Record<string, any>;
	date?: string;
}

export interface Paginate {
	page: number; // página actual
	limit: number; // tamaño de la página
	total: number; // total de documentos encontrados
	totalPages: number; // total de páginas
	hasNextPage: boolean;
	hasPrevPage: boolean;
}
