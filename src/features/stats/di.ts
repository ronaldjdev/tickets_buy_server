import { DashboardStatsController } from "./adapters/in/http/controllers/DashboardStats.controller.js";
import { StatsRepository } from "./adapters/out/persistence/repositories/Stats.repository.js";
import { GetDashboardStats } from "./application/use-cases/GetDashboardStats.uc.js";

const statsRepository = new StatsRepository();
const getDashboardStats = new GetDashboardStats(statsRepository);

export const dashboardStatsController = new DashboardStatsController(
	getDashboardStats,
);
