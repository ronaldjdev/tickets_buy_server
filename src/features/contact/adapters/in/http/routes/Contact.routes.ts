import { Router } from "express";

import type { ContactController } from "@/features/contact/adapters/in/http/controllers/Contact.controller.js";

export function createContactRoutes(controller: ContactController): Router {
	const router = Router();

	router.post("/", controller.create);
	router.get("/:id", controller.get);
	router.get("/", controller.list);
	router.patch("/:id", controller.update);
	router.delete("/:id", controller.delete);

	return router;
}
