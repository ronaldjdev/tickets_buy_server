import type { NextFunction, Request, Response } from "express";
import type { BuyTickets } from "@/features/ticket/application/use-cases/BuyTickets.uc.js";
import type { ListTickets } from "@/features/ticket/application/use-cases/ListTickets.uc.js";
import type { ManageAvailability } from "@/features/ticket/application/use-cases/ManageAvailability.uc.js";

export class TicketController {
	constructor(
		private readonly buyTickets: BuyTickets,
		private readonly listTickets: ListTickets,
		private readonly manageAvailability: ManageAvailability,
	) {}

	buyTicketsHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const tickets = await this.buyTickets.execute(req.body);
			res.status(201).json({ data: tickets });
		} catch (error) {
			next(error);
		}
	};

	listTicketsHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const tickets = await this.listTickets.execute({
				raffleId: String(req.params.raffleId),
			});
			res.status(200).json({ data: tickets });
		} catch (error) {
			next(error);
		}
	};

	manageAvailabilityHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const ticket = await this.manageAvailability.execute({
				ticketId: String(req.params.id),
				action: req.body.action,
				buyerName: req.body.buyerName,
				buyerEmail: req.body.buyerEmail,
			});
			res.status(200).json({ data: ticket });
		} catch (error) {
			next(error);
		}
	};
}
