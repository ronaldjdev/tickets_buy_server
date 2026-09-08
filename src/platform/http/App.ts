import cors from "cors";
import express from "express";

export function createApp() {
	const app = express();

	const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3002";

	app.use(cors({ origin: frontendUrl, credentials: true }));
	app.use(express.json());

	app.get("/health", (_req, res) => {
		res.json({ status: "ok" });
	});

	return app;
}
