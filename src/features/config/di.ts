import { ConfigController } from "@/features/config/adapters/in/http/controllers/Config.controller.js";
import { ConfigRepository } from "@/features/config/adapters/out/persistence/repositories/Config.repository.js";
import {
	AddConfig,
	GetConfig,
	UpdateConfig,
} from "@/features/config/application/use-cases/index.js";
import { SeedConfigFromEnv } from "@/features/config/application/use-cases/SeedConfigFromEnv.uc.js";

export const configRepo = new ConfigRepository();

const addConfig = new AddConfig(configRepo);
const getConfig = new GetConfig(configRepo);
const updateConfig = new UpdateConfig(configRepo);

export const configController = new ConfigController(
	addConfig,
	getConfig,
	updateConfig,
);

export const seedConfigFromEnv = new SeedConfigFromEnv(configRepo);
