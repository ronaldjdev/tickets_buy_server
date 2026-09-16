import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX ?? 600);
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 100);

function parseOrigins(value: string | undefined): string[] {
	return (value ?? "http://localhost:3000")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

export function createApp() {
	const app = express();

	const frontendOrigins = parseOrigins(process.env.FRONTEND_URL);

	app.set("trust proxy", 1);
	app.use(
		helmet({
			contentSecurityPolicy: false,
			crossOriginResourcePolicy: { policy: "cross-origin" },
		}),
	);

	app.use(
		cors({
			origin: frontendOrigins,
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	);
	app.use(express.json({ limit: "500kb" }));

	const apiLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: API_RATE_LIMIT_MAX,
		standardHeaders: true,
		legacyHeaders: false,
		message: { success: false, message: "Demasiadas solicitudes" },
		skipSuccessfulRequests: false,
	});

	const authLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: AUTH_RATE_LIMIT_MAX,
		standardHeaders: true,
		legacyHeaders: false,
		message: {
			success: false,
			message: "Demasiados intentos de autenticación. Inténtalo más tarde",
		},
	});

	const strictAuthLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: Number(process.env.STRICT_AUTH_RATE_LIMIT_MAX ?? 10),
		standardHeaders: true,
		legacyHeaders: false,
		message: {
			success: false,
			message: "Demasiados intentos de autenticación. Inténtalo más tarde",
		},
	});

	app.use("/api/auth", authLimiter);
	app.use("/api/auth/sign-in/email", strictAuthLimiter);
	app.use("/api/auth/sign-up/email", strictAuthLimiter);
	app.use("/api", apiLimiter);

	app.post("/api/users/register", strictAuthLimiter);

	app.get("/health", (_req, res) => {
		res.json({ status: "ok" });
	});

	return app;
}
