import type {
	Ticket,
	TicketStatus,
} from "@/features/ticket/domain/entities/Ticket.entity";
import { TicketNotFoundError } from "@/features/ticket/domain/errors/Ticket.error";
import type { ITicketRepository } from "@/features/ticket/domain/repositories/ITicket.repository";
import type { ILogger } from "@/shared/port/ILogger.port.js";

export type AvailabilityAction = "release" | "purchase";

export interface ManageAvailabilityCommand {
	ticketId: string;
	action: AvailabilityAction;
	buyerName?: string;
	buyerEmail?: string;
}

export class ManageAvailability {
	constructor(
		private readonly ticketRepository: ITicketRepository,
		private readonly logger: ILogger,
	) {}

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

		this.logger.info("Disponibilidad de boleto actualizada", {
			operation: "ticket.manage_availability",
			ticketId: updated.id,
			raffleId: updated.raffleId,
			number: updated.number,
			action: command.action,
			status,
		});

		return updated;
	}
}
