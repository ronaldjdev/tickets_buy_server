import type { DashboardStats } from "../../domain/entities/DashboardStats.entity.js";
import type { IStatsRepository } from "../../domain/repositories/IStats.repository.js";

export class GetDashboardStats {
	constructor(private readonly statsRepository: IStatsRepository) {}

	async execute(): Promise<DashboardStats> {
		return this.statsRepository.getDashboardStats();
	}
}
