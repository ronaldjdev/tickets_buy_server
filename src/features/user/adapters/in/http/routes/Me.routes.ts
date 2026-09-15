import { Router } from "express";

import { meController } from "../../../../di.js";

const router = Router();
router.get("/", meController.get);
router.patch("/", meController.update);

export default router;
