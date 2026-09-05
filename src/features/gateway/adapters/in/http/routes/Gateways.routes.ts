import { Router } from "express";

import type { GatewayController } from "@/features/gateway/adapters/in/http/controllers/Gateway.controller.js";

export function createGatewayRoutes(controller: GatewayController): Router {
	const router = Router();

	router.get("/status", controller.status);
	router.get("/intents/:reference", controller.getIntent);
	router.post("/intents/:reference/sync", controller.syncIntent);

	return router;
}
