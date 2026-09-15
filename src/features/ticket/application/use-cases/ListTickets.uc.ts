import type {
	Ticket,
	TicketStatus,
} from "../../domain/entities/Ticket.entity.js";
import type { ITicketRepository } from "../../domain/repositories/ITicket.repository.js";

export type TicketListFilter = "all" | "sold" | TicketStatus;

export interface ListTicketsCommand {
	raffleId: string;
	status?: TicketListFilter;
}

const SOLD_STATUSES: TicketStatus[] = ["purchased", "winner"];

function filterToStatuses(
	status?: TicketListFilter,
): TicketStatus[] | undefined {
	if (status === undefined || status === "sold") return SOLD_STATUSES;
	if (status === "all") return undefined;
	return [status];
}

export class ListTickets {
	constructor(private readonly ticketRepository: ITicketRepository) {}

	async execute(command: ListTicketsCommand): Promise<Ticket[]> {
		return this.ticketRepository.findByRaffle(
			command.raffleId,
			filterToStatuses(command.status),
		);
	}
}
