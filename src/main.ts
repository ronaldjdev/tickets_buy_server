import { toNodeHandler } from "better-auth/node";
import { createComboRoutes } from "./features/combo/adapters/in/http/routes/Combo.routes";
import { createComboModule } from "./features/combo/di";
import configRoutes from "./features/config/adapters/in/http/routes/Config.routes";
import publicConfigRoutes from "./features/config/adapters/in/http/routes/PublicConfig.routes";
import { configRepo, seedConfigFromEnv } from "./features/config/di";
import { createContactRoutes } from "./features/contact/adapters/in/http/routes/Contact.routes";
import { createContactModule } from "./features/contact/di";
import { createGatewayRoutes } from "./features/gateway/adapters/in/http/routes/Gateways.routes";
import { createWompiWebhookRoutes } from "./features/gateway/adapters/in/http/routes/WompiWebhook.routes";
import notificationRoutes from "./features/notification/adapters/in/http/routes/Notification.routes";
import { createRaffleRoutes } from "./features/raffle/adapters/in/http/routes/Raffle.routes";
import { createRaffleModule } from "./features/raffle/di";
import { createStatsRoutes } from "./features/stats/adapters/in/http/routes/Stats.routes";
import { dashboardStatsController } from "./features/stats/di";
import { createPurchaseRoutes } from "./features/ticket/adapters/in/http/routes/Purchase.routes";
import { createTicketRoutes } from "./features/ticket/adapters/in/http/routes/Ticket.routes";
import {
	createTicketModule,
	createTicketPurchaseModule,
} from "./features/ticket/di";
import meRoutes from "./features/user/adapters/in/http/routes/Me.routes";
import userRoutes from "./features/user/adapters/in/http/routes/User.routes";
import { userController } from "./features/user/di";
import { initAuth } from "./platform/auth/auth.config";
import { env } from "./platform/config/Env.config";
import { connectDB } from "./platform/database/Db.config";
import { createGatewayModule } from "./platform/di/Gateway.di";
import { notificationService } from "./platform/di/Notification.di";
import { createApp } from "./platform/http/App";
import { errorHandler } from "./platform/http/Error.middleware";
import {
	requireAuth,
	requireRole,
} from "./platform/http/middleware/Auth.middleware";
import type { IConfirmTicketPayment } from "./shared/contracts/IConfirmTicketPayment.contract";
import type { IGatewayLinkCreator } from "./shared/contracts/IGatewayLinkCreator.contract";
import type { IRaffleService } from "./shared/contracts/raffle/IRaffleService.contract";

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

	const ticketModule = createTicketModule(raffleServiceProxy);
	const raffleModule = createRaffleModule(
		ticketModule.sharedService,
		notificationService,
	);
	raffleShared = raffleModule.sharedService;

	const comboModule = createComboModule(raffleServiceProxy);

	const purchaseModule = createTicketPurchaseModule({
		raffleService: raffleServiceProxy,
		linkCreator: linkCreatorProxy,
		getIntent: gatewayModule.getPublicIntent,
		notificationService,
	});
	const contactModule = createContactModule({
		raffleService: raffleServiceProxy,
	});
	linkCreatorRef = gatewayModule.linkCreator;
	confirmRef = purchaseModule.confirmTicketPayment;

	app.use("/api/raffles", createRaffleRoutes(raffleModule.controller));
	app.use("/api/combos", createComboRoutes(comboModule.controller));
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
