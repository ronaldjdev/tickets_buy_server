import { Router } from "express";
import type { RaffleController } from "../controllers/Raffle.controller.js";

export function createRaffleRoutes(controller: RaffleController): Router {
	const router = Router();

	router.post("/", controller.createRaffleHandler);
	router.get("/", controller.listRafflesHandler);
	router.post("/:id/draw", controller.drawWinnerHandler);

	return router;
}
