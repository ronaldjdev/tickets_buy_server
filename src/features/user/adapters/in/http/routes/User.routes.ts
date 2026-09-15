import { Router } from "express";

import { userController } from "../../../../di.js";

const router = Router();

router.post("/", userController.create);
router.get("/:id", userController.get);
router.get("/", userController.list);
router.patch("/:id", userController.update);
router.patch("/:id/role", userController.updateRole);
router.delete("/:id", userController.delete);
router.post("/request-password-reset", userController.requestPasswordReset);

export default router;
