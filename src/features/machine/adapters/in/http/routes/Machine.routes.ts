import { Router } from "express";
import type { MachineController } from "../controllers/Machine.controller.js";

export function createMachineRoutes(controller: MachineController): Router {
	const router = Router();

	router.get("/lookup", controller.lookup);
	router.post("/document/play", controller.documentPlay);
	router.get("/document/:documentNumber/session", controller.documentSession);
	router.get("/:reference", controller.session);
	router.post("/:reference/play", controller.play);

	return router;
}

export function createMachineAdminRoutes(
	controller: MachineController,
): Router {
	const router = Router();

	router.get("/plays", controller.listPlays);
	router.patch("/plays/:id/delivered", controller.markDelivered);
	router.post("/prizes/release", controller.releaseSeco);
	router.post("/prizes/restock", controller.restock);
	router.get("/grants", controller.listGrants);
	router.post("/grants", controller.createGrant);
	router.get("/settings", controller.getSettings);
	router.put("/settings", controller.updateSettings);

	return router;
}
