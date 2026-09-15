import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "../../../../../../shared/errors/ValidationError.js";
import response from "../../../../../../shared/http/Response.utils.js";
import type { BuyTickets } from "../../../../application/use-cases/BuyTickets.uc.js";
import type {
	ListTickets,
	TicketListFilter,
} from "../../../../application/use-cases/ListTickets.uc.js";
import type { LookupTicketsByDocument } from "../../../../application/use-cases/LookupTicketsByDocument.uc.js";
import type { ManageAvailability } from "../../../../application/use-cases/ManageAvailability.uc.js";

const TICKET_LIST_FILTERS = new Set<string>([
	"all",
	"sold",
	"available",
	"reserved",
	"purchased",
	"winner",
]);

export class TicketController {
	constructor(
		private readonly buyTickets: BuyTickets,
		private readonly listTickets: ListTickets,
		private readonly manageAvailability: ManageAvailability,
		private readonly lookupTicketsByDocument: LookupTicketsByDocument,
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
			const raw = req.query.status;
			const status = Array.isArray(raw)
				? undefined
				: (raw as string | undefined);
			if (status !== undefined && !TICKET_LIST_FILTERS.has(status)) {
				throw new ValidationError(
					`status inválido: debe ser all, sold, available, reserved, purchased o winner`,
				);
			}
			const tickets = await this.listTickets.execute({
				raffleId: String(req.params.raffleId),
				status: status as TicketListFilter | undefined,
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

	lookupByDocumentHandler = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const raw = req.query.documentNumber;
			const documentNumber = Array.isArray(raw)
				? undefined
				: (raw as string | undefined);
			if (!documentNumber?.trim()) {
				throw new ValidationError(
					"Ingresa tu número de documento para consultar tus boletos.",
				);
			}
			const result = await this.lookupTicketsByDocument.execute(documentNumber);
			response(
				res,
				200,
				result.purchases.length > 0
					? "Tus boletos"
					: "No se encontraron boletos para este documento.",
				result,
			);
		} catch (error) {
			next(error);
		}
	};
}
