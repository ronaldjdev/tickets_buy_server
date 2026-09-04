import { Router } from "express";

import { gatewayController } from "@/platform/di/Gateway.di.js";

const router = Router();

router.post("/events", gatewayController.wompiEvents);

export default router;
