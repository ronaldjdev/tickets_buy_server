import type { NextFunction, Request, Response } from "express";
import type { GetDashboardStats } from "@/features/stats/application/use-cases/GetDashboardStats.uc.js";
import response from "@/shared/http/Response.utils.js";

export class DashboardStatsController {
	constructor(private readonly getDashboardStats: GetDashboardStats) {}

	dashboard = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const stats = await this.getDashboardStats.execute();
			response(res, 200, "Estadísticas del dashboard", stats);
		} catch (error) {
			next(error);
		}
	};
}
