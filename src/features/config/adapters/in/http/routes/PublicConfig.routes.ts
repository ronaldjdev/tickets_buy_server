import { Router } from "express";

import { configController } from "@/features/config/di.js";

const router = Router();

router.get("/", configController.public);

export default router;
