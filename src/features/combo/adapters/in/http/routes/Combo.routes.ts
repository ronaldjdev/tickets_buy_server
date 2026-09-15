import { Router } from "express";

import {
	requireAuth,
	requireRole,
} from "../../../../../../platform/http/middleware/Auth.middleware.js";

import type { ComboController } from "../controllers/Combo.controller.js";

export function createComboRoutes(controller: ComboController): Router {
	const router = Router();
	const admin = [requireAuth, requireRole("admin")];

	router.get("/", controller.list);
	router.post("/", admin, controller.create);
	router.patch("/:id", admin, controller.update);
	router.delete("/:id", admin, controller.remove);

	return router;
}
