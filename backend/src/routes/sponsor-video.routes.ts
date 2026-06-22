import { Router } from "express";
import {
  adminCreateSponsorVideo,
  adminDeleteSponsorVideo,
  adminGetSponsorVideos,
  adminGetSponsorVideoStats,
  adminSetSponsorVideoStatus,
  adminUpdateSponsorVideo,
  completeWatchSession,
  getCurrentVideo,
  startWatchSession,
} from "../controllers/sponsor-video.controller";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "./admin.routes";

const router = Router();

router.get("/current", getCurrentVideo);
router.post("/start", authenticate, startWatchSession);
router.post("/complete", authenticate, completeWatchSession);

router.use(requireAdmin);

router.post("/admin", adminCreateSponsorVideo);
router.get("/admin", adminGetSponsorVideos);
router.put("/admin/:id", adminUpdateSponsorVideo);
router.delete("/admin/:id", adminDeleteSponsorVideo);
router.get("/admin/stats", adminGetSponsorVideoStats);
router.post("/admin/:id/status", adminSetSponsorVideoStatus);

export const sponsorVideoRoutes = router;
