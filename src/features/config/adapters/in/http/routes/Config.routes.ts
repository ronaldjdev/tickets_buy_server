import { Router } from "express";

import { configController } from "../../../../di.js";

const router = Router();

router.post("/", configController.add);
router.get("/", configController.get);
router.patch("/", configController.update);
router.post("/email/test", configController.testEmail);

export default router;
