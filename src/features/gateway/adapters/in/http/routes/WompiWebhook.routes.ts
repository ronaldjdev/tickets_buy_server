import { Router } from "express";

import type { GatewayController } from "@/features/gateway/adapters/in/http/controllers/Gateway.controller.js";

export function createWompiWebhookRoutes(
	controller: GatewayController,
): Router {
	const router = Router();

	router.post("/events", controller.wompiEvents);

	return router;
}
