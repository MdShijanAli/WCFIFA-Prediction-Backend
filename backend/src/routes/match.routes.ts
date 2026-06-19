import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMatches, getMatch, updateMatchResult } from '../controllers/match.controller';

const router = Router();

router.get('/', getMatches);
router.get('/:id', getMatch);
router.put('/:id/result', authenticate, updateMatchResult); // Admin only in production

export default router;
