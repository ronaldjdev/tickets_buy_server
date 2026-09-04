import type { Ticket } from "../entities/Ticket.entity.js";

export interface ITicketRepository {
	findById(id: string): Promise<Ticket | null>;
	findByRaffle(raffleId: string): Promise<Ticket[]>;
	findWinningTicket(raffleId: string): Promise<Ticket | null>;
	save(ticket: Ticket): Promise<Ticket>;
	saveMany(tickets: Ticket[]): Promise<Ticket[]>;
}
