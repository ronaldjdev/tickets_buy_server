import { Router } from "express";
import { notificationController } from "@/platform/di/Notification.di";
import { requireAuth } from "@/platform/http/middleware/Auth.middleware.js";

const router = Router();

router.get("/stream", requireAuth, notificationController.stream);
router.get("/", requireAuth, notificationController.list);
router.get("/unread-count", requireAuth, notificationController.unreadCount);
router.get("/preferences", requireAuth, notificationController.getPreferences);
router.patch(
	"/preferences",
	requireAuth,
	notificationController.updatePreferences,
);
router.patch("/:id/read", requireAuth, notificationController.read);
router.post("/read-all", requireAuth, notificationController.readAll);

export default router;
