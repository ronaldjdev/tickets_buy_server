import { Router } from "express";

import type { PurchaseController } from "../controllers/Purchase.controller.js";

export function createPurchaseRoutes(controller: PurchaseController): Router {
	const router = Router();

	router.post("/", controller.create);
	router.get("/:reference", controller.status);

	return router;
}
