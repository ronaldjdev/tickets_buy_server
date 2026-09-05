import { Router } from "express";

import { configController } from "@/features/config/di.js";

const router = Router();

router.post("/", configController.add);
router.get("/", configController.get);
router.patch("/", configController.update);

export default router;
