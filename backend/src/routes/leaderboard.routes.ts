import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getLeaderboard, getMyRank, getTopPlayers } from '../controllers/leaderboard.controller';

const router = Router();

router.get('/', getLeaderboard);
router.get('/top', getTopPlayers);
router.get('/my-rank', authenticate, getMyRank);

export default router;
