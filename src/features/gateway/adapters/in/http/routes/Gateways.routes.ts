import { Router } from "express";

import { gatewayController } from "@/platform/di/Gateway.di.js";

const router = Router();

router.get("/status", gatewayController.status);
router.post("/wompi/links", gatewayController.createPaymentLink);
router.post("/wompi/widget-session", gatewayController.createWidget);

export default router;
