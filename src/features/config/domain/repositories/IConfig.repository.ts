import type { Config } from "../entities/Config.entity.js";

export interface IConfigRepository {
	create(data: Partial<Config>): Promise<Config>;
	findSingleton(): Promise<Config | null>;
	update(data: Partial<Config>): Promise<Config | null>;
}
