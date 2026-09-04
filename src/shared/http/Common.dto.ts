import type { OptionsPag, Paginate } from "@/shared/types/types";

export type ListQueryDTO = OptionsPag;

export interface PaginatedResponse<T> {
	data: T[];
	paginate: Paginate;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	paginate?: Paginate;
}
