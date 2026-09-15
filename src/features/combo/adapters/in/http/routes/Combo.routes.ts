import { Router } from "express";

import type { IRaffleService } from "../../../../../../shared/contracts/raffle/IRaffleService.contract.js";
import {
	optionalAuth,
	requireAuth,
	requireRole,
} from "../../../../../../platform/http/middleware/Auth.middleware.js";

import type { ComboController } from "../controllers/Combo.controller.js";

export function createComboRoutes(
	controller: ComboController,
	raffleService: IRaffleService,
): Router {
	const router = Router();
	const admin = [requireAuth, requireRole("admin")];

	router.get("/", optionalAuth, async (req, res, next) => {
		try {
			const isAdmin = req.user?.role === "admin";
			const raffleId = String(req.query.raffleId ?? "");

			if (!isAdmin && !raffleId) {
				return res.status(403).json({
					success: false,
					message: "No autorizado",
				});
			}

			if (!isAdmin && raffleId) {
				const raffle = await raffleService.findById(raffleId);
				if (!raffle || raffle.status !== "active") {
					return res.status(404).json({
						success: false,
						message: "No encontrado",
					});
				}
			}

			req.query.raffleId = raffleId || undefined;
			next();
		} catch (error) {
			next(error);
		}
	}, controller.list);
	router.post("/", admin, controller.create);
	router.patch("/:id", admin, controller.update);
	router.delete("/:id", admin, controller.remove);

	return router;
}
