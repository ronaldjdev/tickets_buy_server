export type RaffleStatus = "pending" | "active" | "closed";
export type TicketStatus = "available" | "purchased" | "reserved";

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
