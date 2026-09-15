import type { Config } from "../../domain/entities/Config.entity.js";
import type { IConfigRepository } from "../../domain/repositories/IConfig.repository.js";

export class GetConfig {
	constructor(private readonly configRepo: IConfigRepository) {}

	async execute(): Promise<Config | null> {
		return await this.configRepo.findSingleton();
	}
}
