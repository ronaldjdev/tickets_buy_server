import { Router } from "express";

import type { GatewayController } from "../controllers/Gateway.controller.js";

export function createWompiWebhookRoutes(
	controller: GatewayController,
): Router {
	const router = Router();

	router.post("/events", controller.wompiEvents);

	return router;
}
