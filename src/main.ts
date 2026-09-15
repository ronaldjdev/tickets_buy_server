import { toNodeHandler } from "better-auth/node";
import { createComboRoutes } from "./features/combo/adapters/in/http/routes/Combo.routes.js";
import { ComboRepository } from "./features/combo/adapters/out/persistence/repositories/Combo.repository.js";
import { createComboModule } from "./features/combo/di.js";
import configRoutes from "./features/config/adapters/in/http/routes/Config.routes.js";
import publicConfigRoutes from "./features/config/adapters/in/http/routes/PublicConfig.routes.js";
import { configRepo, seedConfigFromEnv } from "./features/config/di.js";
import { createContactRoutes } from "./features/contact/adapters/in/http/routes/Contact.routes.js";
import { createContactModule } from "./features/contact/di.js";
import { createGatewayRoutes } from "./features/gateway/adapters/in/http/routes/Gateways.routes.js";
import { createWompiWebhookRoutes } from "./features/gateway/adapters/in/http/routes/WompiWebhook.routes.js";
import notificationRoutes from "./features/notification/adapters/in/http/routes/Notification.routes.js";
import { createRaffleRoutes } from "./features/raffle/adapters/in/http/routes/Raffle.routes.js";
import { createRaffleModule } from "./features/raffle/di.js";
import { createStatsRoutes } from "./features/stats/adapters/in/http/routes/Stats.routes.js";
import { dashboardStatsController } from "./features/stats/di.js";
import { createPurchaseRoutes } from "./features/ticket/adapters/in/http/routes/Purchase.routes.js";
import { createTicketRoutes } from "./features/ticket/adapters/in/http/routes/Ticket.routes.js";
import {
	createTicketModule,
	createTicketPurchaseModule,
} from "./features/ticket/di.js";
import meRoutes from "./features/user/adapters/in/http/routes/Me.routes.js";
import userRoutes from "./features/user/adapters/in/http/routes/User.routes.js";
import { userController } from "./features/user/di.js";
import { initAuth } from "./platform/auth/auth.config.js";
import { env } from "./platform/config/Env.config.js";
import { connectDB } from "./platform/database/Db.config.js";
import { createGatewayModule } from "./platform/di/Gateway.di.js";
import { appLogger } from "./platform/di/Logger.di.js";
import { notificationService } from "./platform/di/Notification.di.js";
import { createApp } from "./platform/http/App.js";
import { errorHandler } from "./platform/http/Error.middleware.js";
import {
	requireAuth,
	requireRole,
} from "./platform/http/middleware/Auth.middleware.js";
import type { IConfirmTicketPayment } from "./shared/contracts/IConfirmTicketPayment.contract.js";
import type { IGatewayLinkCreator } from "./shared/contracts/IGatewayLinkCreator.contract.js";
import type { IRaffleService } from "./shared/contracts/raffle/IRaffleService.contract.js";

async function main() {
	await connectDB(env.mongodbUri);
	await seedConfigFromEnv.execute();

	const app = createApp();

	let raffleShared: IRaffleService;
	const raffleServiceProxy: IRaffleService = {
		findById: (id) => raffleShared.findById(id),
	};

	let linkCreatorRef: IGatewayLinkCreator;
	const linkCreatorProxy: IGatewayLinkCreator = {
		execute: (input) => linkCreatorRef.execute(input),
	};

	let confirmRef: IConfirmTicketPayment;
	const confirmProxy: IConfirmTicketPayment = {
		execute: (input) => confirmRef.execute(input),
	};

	const gatewayModule = await createGatewayModule({
		configRepo,
		confirmTicketPayment: confirmProxy,
		raffleService: raffleServiceProxy,
	});

	const ticketModule = createTicketModule(raffleServiceProxy, appLogger);
	const comboRepository = new ComboRepository();
	const raffleModule = createRaffleModule(
		ticketModule.sharedService,
		appLogger,
		notificationService,
		comboRepository,
	);
	raffleShared = raffleModule.sharedService;

	const comboModule = createComboModule(raffleServiceProxy, appLogger);

	const purchaseModule = createTicketPurchaseModule({
		raffleService: raffleServiceProxy,
		linkCreator: linkCreatorProxy,
		getIntent: gatewayModule.getPublicIntent,
		notificationService,
	});
	const contactModule = createContactModule({
		raffleService: raffleServiceProxy,
		appLogger,
	});
	linkCreatorRef = gatewayModule.linkCreator;
	confirmRef = purchaseModule.confirmTicketPayment;

	app.use("/api/raffles", createRaffleRoutes(raffleModule.controller));
	app.use("/api/combos", createComboRoutes(comboModule.controller, raffleServiceProxy));
	app.use("/api/tickets", createTicketRoutes(ticketModule.controller));
	app.use("/api/purchases", createPurchaseRoutes(purchaseModule.controller));
	app.use("/api/gateway", createGatewayRoutes(gatewayModule.controller));
	app.use(
		"/api/webhook/wompi",
		createWompiWebhookRoutes(gatewayModule.controller),
	);
	app.use("/api/config", requireAuth, requireRole("admin"), configRoutes);
	app.use("/api/public/config", publicConfigRoutes);
	app.use(
		"/api/stats",
		requireAuth,
		requireRole("admin"),
		createStatsRoutes(dashboardStatsController),
	);
	app.use("/api/notifications", requireAuth, notificationRoutes);

	app.use("/api/auth", toNodeHandler(await initAuth()));
	app.post("/api/users/register", userController.register);
	app.use("/api/users/me", requireAuth, meRoutes);
	app.use("/api/users", requireAuth, requireRole("admin"), userRoutes);
	app.use(
		"/api/contacts",
		requireAuth,
		requireRole("admin", "vendedor"),
		createContactRoutes(contactModule.controller),
	);

	app.use(errorHandler);

	app.listen(env.port, () => {
		console.log(`Servidor escuchando en http://localhost:${env.port}`);
	});
}

main();
