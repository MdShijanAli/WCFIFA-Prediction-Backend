import { Router } from "express";
import { authenticate, requiredAccess } from "../middleware/auth";
import {
  submitPrediction,
  getUserPredictions,
  submitBulkPredictions,
} from "../controllers/prediction.controller";

const router = Router();

router.use(authenticate, requiredAccess);

router.post("/", submitPrediction);
router.post("/bulk", submitBulkPredictions);
router.get("/", getUserPredictions);

export default router;
