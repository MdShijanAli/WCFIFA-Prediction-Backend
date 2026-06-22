import { Router } from "express";
import { authenticate, requirePaid } from "../middleware/auth";
import {
  submitPrediction,
  getUserPredictions,
  submitBulkPredictions,
} from "../controllers/prediction.controller";

const router = Router();

router.use(authenticate, requirePaid);

router.post("/", submitPrediction);
router.post("/bulk", submitBulkPredictions);
router.get("/", getUserPredictions);

export default router;
