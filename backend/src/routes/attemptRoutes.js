import express from 'express';
import {
  startAttempt,
  submitAttempt,
  getQuizAttempts,
  getStudentAttempt,
} from '../controllers/attemptController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/start', requireRole('student'), startAttempt);
router.post('/submit', requireRole('student'), submitAttempt);
router.get('/my/:quizId', requireRole('student'), getStudentAttempt);
router.get('/quiz/:quizId', getQuizAttempts); // accessible by admin or student (for leaderboard)

export default router;
