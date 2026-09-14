import { Router } from "express";
import type { TicketController } from "@/features/ticket/adapters/in/http/controllers/Ticket.controller";

export function createTicketRoutes(controller: TicketController): Router {
	const router = Router();

	router.post("/buy", controller.buyTicketsHandler);
	router.get("/raffle/:raffleId", controller.listTicketsHandler);
	router.patch("/:id/availability", controller.manageAvailabilityHandler);
	router.get("/lookup", controller.lookupByDocumentHandler);

	return router;
}
