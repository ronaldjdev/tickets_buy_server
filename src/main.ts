import contactRoutes from "./features/contact/adapters/in/http/routes/Contact.routes";
import { createRaffleRoutes } from "./features/raffle/adapters/in/http/routes/Raffle.routes";
import { createRaffleModule } from "./features/raffle/di";
import { createTicketRoutes } from "./features/ticket/adapters/in/http/routes/Ticket.routes";
import { createTicketModule } from "./features/ticket/di";
import meRoutes from "./features/user/adapters/in/http/routes/Me.routes";
import userRoutes from "./features/user/adapters/in/http/routes/User.routes";
import { userController } from "./features/user/di";
import { getAuthHandlers } from "./platform/auth/auth.config";
import { env } from "./platform/config/Env.config";
import { connectDB } from "./platform/database/Db.config";
import { createApp } from "./platform/http/App";
import {
	requireAuth,
	requireRole,
} from "./platform/http/middleware/Auth.middleware";
import type { IRaffleService } from "./shared/contracts/raffle/IRaffleService.contract";

async function main() {
	await connectDB(env.mongodbUri);

	const app = createApp();

	let raffleShared: IRaffleService;
	const raffleServiceProxy: IRaffleService = {
		findById: (id) => raffleShared.findById(id),
	};

	const ticketModule = createTicketModule(raffleServiceProxy);
	const raffleModule = createRaffleModule(ticketModule.sharedService);
	raffleShared = raffleModule.sharedService;

	app.use("/api/raffles", createRaffleRoutes(raffleModule.controller));
	app.use("/api/tickets", createTicketRoutes(ticketModule.controller));

	app.use("/api/auth", await getAuthHandlers());
	app.post("/api/users/register", userController.register);
	app.use("/api/users/me", requireAuth, meRoutes);
	app.use("/api/users", requireAuth, requireRole("admin"), userRoutes);
	app.use(
		"/api/contacts",
		requireAuth,
		requireRole("admin", "vendedor"),
		contactRoutes,
	);

	app.listen(env.port, () => {
		console.log(`Servidor escuchando en http://localhost:${env.port}`);
	});
}

main();
