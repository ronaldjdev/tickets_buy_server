import { Router } from "express";

import { notificationController } from "@/platform/di/Notification.di";

const router = Router();

router.get("/stream", notificationController.stream);
router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.read);
router.post("/read-all", notificationController.readAll);

export default router;
