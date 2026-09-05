import type { ConfigRepository } from "@/features/config/adapters/out/persistence/repositories/Config.repository.js";
import { GatewayController } from "@/features/gateway/adapters/in/http/controllers/Gateway.controller.js";
import {
	PublicIntentConfig,
	WompiConfigReader,
} from "@/features/gateway/adapters/out/config/WompiConfig.reader.js";
import { GatewayIntentRepository } from "@/features/gateway/adapters/out/persistence/repositories/GatewayIntent.repository.js";
import { WompiAdapter } from "@/features/gateway/adapters/out/wompi/Wompi.adapter.js";
import { CreateTicketPayment } from "@/features/gateway/application/use-cases/CreateTicketPayment.uc.js";
import { GetGatewayStatus } from "@/features/gateway/application/use-cases/GetGatewayStatus.uc.js";
import { GetPublicIntent } from "@/features/gateway/application/use-cases/GetPublicIntent.uc.js";
import { HandleWompiEvent } from "@/features/gateway/application/use-cases/HandleWompiEvent.uc.js";
import { WompiIntentProcessor } from "@/features/gateway/application/use-cases/shared/WompiIntentProcessor.js";
import { VerifyGatewayTransaction } from "@/features/gateway/application/use-cases/VerifyGatewayTransaction.uc.js";
import type { IConfirmTicketPayment } from "@/shared/contracts/IConfirmTicketPayment.contract.js";
import type { IGatewayLinkCreator } from "@/shared/contracts/IGatewayLinkCreator.contract.js";
import { configPromise } from "../config/index.js";
import { httpClient } from "./HttpClient.di.js";
import { appLogger } from "./Logger.di.js";

export interface GatewayModuleDeps {
	configRepo: ConfigRepository;
	confirmTicketPayment: IConfirmTicketPayment;
}

export interface GatewayModule {
	linkCreator: IGatewayLinkCreator;
	controller: GatewayController;
	getPublicIntent: GetPublicIntent;
	handleWompiEvent: HandleWompiEvent;
	verifyTransaction: VerifyGatewayTransaction;
	getStatus: GetGatewayStatus;
}

export async function createGatewayModule(
	deps: GatewayModuleDeps,
): Promise<GatewayModule> {
	const config = await configPromise;

	const wompiConfigReader = new WompiConfigReader(deps.configRepo);
	const intentRepo = new GatewayIntentRepository();

	const wompiPort = new WompiAdapter(
		httpClient,
		async () =>
			(await wompiConfigReader.getWompiSettings())?.environment ?? "test",
	);

	const linkCreator = new CreateTicketPayment(
		wompiConfigReader,
		wompiPort,
		intentRepo,
		config.frontend.url,
	);

	const getPublicIntent = new GetPublicIntent(
		intentRepo,
		new PublicIntentConfig(deps.configRepo),
		wompiConfigReader,
	);

	const getStatus = new GetGatewayStatus(wompiConfigReader, config.server.url);

	const wompiIntentProcessor = new WompiIntentProcessor(
		intentRepo,
		deps.confirmTicketPayment,
	);

	const handleWompiEvent = new HandleWompiEvent(
		wompiConfigReader,
		wompiPort,
		intentRepo,
		wompiIntentProcessor,
		appLogger,
	);

	const verifyTransaction = new VerifyGatewayTransaction(
		wompiConfigReader,
		wompiPort,
		intentRepo,
		wompiIntentProcessor,
	);

	const controller = new GatewayController(
		getPublicIntent,
		getStatus,
		handleWompiEvent,
		verifyTransaction,
	);

	return {
		linkCreator,
		controller,
		getPublicIntent,
		handleWompiEvent,
		verifyTransaction,
		getStatus,
	};
}
