import { Router } from "express";
import type { DashboardStatsController } from "@/features/stats/adapters/in/http/controllers/DashboardStats.controller.js";

export function createStatsRoutes(
	controller: DashboardStatsController,
): Router {
	const router = Router();

	router.get("/dashboard", controller.dashboard);

	return router;
}
