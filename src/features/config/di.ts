import { appLogger } from "../../platform/di/Logger.di.js";
import { ConfigController } from "./adapters/in/http/controllers/Config.controller.js";
import { ConfigRepository } from "./adapters/out/persistence/repositories/Config.repository.js";
import {
	AddConfig,
	GetConfig,
	TestEmailIntegration,
	UpdateConfig,
} from "./application/use-cases/index.js";
import { SeedConfigFromEnv } from "./application/use-cases/SeedConfigFromEnv.uc.js";

export const configRepo = new ConfigRepository();

const addConfig = new AddConfig(configRepo, appLogger);
const getConfig = new GetConfig(configRepo);
const updateConfig = new UpdateConfig(configRepo, appLogger);
const testEmail = new TestEmailIntegration(appLogger);

export const configController = new ConfigController(
	addConfig,
	getConfig,
	updateConfig,
	testEmail,
);

export const seedConfigFromEnv = new SeedConfigFromEnv(configRepo, appLogger);
