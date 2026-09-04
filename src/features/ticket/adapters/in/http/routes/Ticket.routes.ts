import { Router } from "express";
import type { TicketController } from "../controllers/Ticket.controller.js";

export function createTicketRoutes(controller: TicketController): Router {
	const router = Router();

	router.post("/buy", controller.buyTicketsHandler);
	router.get("/raffle/:raffleId", controller.listTicketsHandler);
	router.patch("/:id/availability", controller.manageAvailabilityHandler);

	return router;
}
