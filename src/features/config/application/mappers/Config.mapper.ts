import type { Config } from "../../domain/entities/Config.entity.js";

export const ConfigMapper = {
	toDomain(doc: Config): Config {
		return { ...doc } as Config;
	},

	toPersistence(config: Config): Partial<Config> {
		return { ...config } as Partial<Config>;
	},
};
