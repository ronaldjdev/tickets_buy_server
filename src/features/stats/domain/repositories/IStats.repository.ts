import type { DashboardStats } from "../entities/DashboardStats.entity.js";

export interface IStatsRepository {
	getDashboardStats(): Promise<DashboardStats>;
}
