import { createRaffleRoutes } from "./features/raffle/adapters/in/http/routes/Raffle.routes";
import { createRaffleModule } from "./features/raffle/di";
import { createTicketRoutes } from "./features/ticket/adapters/in/http/routes/Ticket.routes";
import { createTicketModule } from "./features/ticket/di";
import { env } from "./platform/config/Env.config";
import { connectDB } from "./platform/database/Db.config";
import { createApp } from "./platform/http/App";
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

	app.listen(env.port, () => {
		console.log(`Servidor escuchando en http://localhost:${env.port}`);
	});
}

main();
