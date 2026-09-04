import type { Ticket } from "../../domain/entities/Ticket.entity.js";
import type { ITicketRepository } from "../../domain/repositories/ITicket.repository.js";

export interface ListTicketsCommand {
	raffleId: string;
}

export class ListTickets {
	constructor(private readonly ticketRepository: ITicketRepository) {}

	async execute(command: ListTicketsCommand): Promise<Ticket[]> {
		return this.ticketRepository.findByRaffle(command.raffleId);
	}
}
