import type { Ticket, TicketStatus } from "@/features/ticket/domain/entities/Ticket.entity";
import { TicketNotFoundError } from "@/features/ticket/domain/errors/Ticket.error";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository";

export type AvailabilityAction = "release" | "purchase";

export interface ManageAvailabilityCommand {
	ticketId: string;
	action: AvailabilityAction;
	buyerName?: string;
	buyerEmail?: string;
}

export class ManageAvailability {
	constructor(private readonly ticketRepository: ITicketRepository) {}

	async execute(command: ManageAvailabilityCommand): Promise<Ticket> {
		const ticket = await this.ticketRepository.findById(command.ticketId);
		if (!ticket) throw new TicketNotFoundError(command.ticketId);

		let status: TicketStatus;
		switch (command.action) {
			case "release":
				status = "available";
				break;
			case "purchase":
				status = "purchased";
				break;
			default:
				throw new Error("Acción de disponibilidad no válida");
		}

		const updated = await this.ticketRepository.save({
			...ticket,
			buyerName: command.buyerName ?? ticket.buyerName,
			buyerEmail: command.buyerEmail ?? ticket.buyerEmail,
			status,
		});

		return updated;
	}
}
