import type { Ticket } from "@/features/ticket/domain/entities/Ticket.entity";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository";

export interface ListTicketsCommand {
	raffleId: string;
}

export class ListTickets {
	constructor(private readonly ticketRepository: ITicketRepository) {}

	async execute(command: ListTicketsCommand): Promise<Ticket[]> {
		return this.ticketRepository.findByRaffle(command.raffleId);
	}
}
