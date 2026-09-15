import { Router } from "express";
import {
	requireAuth,
	requireRole,
} from "../../../../../../platform/http/middleware/Auth.middleware.js";
import type { RaffleController } from "../controllers/Raffle.controller.js";

export function createRaffleRoutes(controller: RaffleController): Router {
	const router = Router();
	const admin = [requireAuth, requireRole("admin")];

	router.post("/", admin, controller.createRaffleHandler);
	router.get("/", controller.listRafflesHandler);
	router.get("/slug/:slug", controller.getRaffleBySlugHandler);
	router.get("/:id", controller.getRaffleHandler);
	router.patch("/:id", admin, controller.updateRaffleHandler);
	router.patch("/:id/status", admin, controller.changeRaffleStatusHandler);
	router.post("/:id/draw", admin, controller.drawWinnerHandler);
	router.delete("/:id", admin, controller.deleteRaffleHandler);

	return router;
}
