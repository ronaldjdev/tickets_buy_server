import { ConfigController } from "@/features/config/adapters/in/http/controllers/Config.controller.js";
import { ConfigRepository } from "@/features/config/adapters/out/persistence/repositories/Config.repository.js";
import {
	AddConfig,
	GetConfig,
	UpdateConfig,
} from "@/features/config/application/use-cases/index.js";
import { SeedConfigFromEnv } from "@/features/config/application/use-cases/SeedConfigFromEnv.uc.js";
import { appLogger } from "@/platform/di/Logger.di.js";

export const configRepo = new ConfigRepository();

const addConfig = new AddConfig(configRepo, appLogger);
const getConfig = new GetConfig(configRepo);
const updateConfig = new UpdateConfig(configRepo, appLogger);

export const configController = new ConfigController(
	addConfig,
	getConfig,
	updateConfig,
);

export const seedConfigFromEnv = new SeedConfigFromEnv(configRepo, appLogger);
