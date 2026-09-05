import { Router } from "express";

import { contactController } from "@/features/contact/di.js";

const router = Router();

router.post("/", contactController.create);
router.get("/:id", contactController.get);
router.get("/", contactController.list);
router.patch("/:id", contactController.update);
router.delete("/:id", contactController.delete);

export default router;
