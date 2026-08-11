import express from 'express';
import {
  createQuiz,
  getAdminQuizzes,
  getQuizById,
  getQuizByJoinCode,
  updateQuiz,
  deleteQuiz,
  updateQuizStatus,
  releaseQuizResults,
  releaseQuizLeaderboard,
  exportQuizResultsCSV,
} from '../controllers/quizController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Public/Student routes with token
router.get('/code/:code', getQuizByJoinCode);
router.get('/:id', getQuizById);

// Admin-only routes
router.post('/', requireRole('admin'), createQuiz);
router.get('/admin/my', requireRole('admin'), getAdminQuizzes);
router.put('/:id', requireRole('admin'), updateQuiz);
router.delete('/:id', requireRole('admin'), deleteQuiz);
router.patch('/:id/status', requireRole('admin'), updateQuizStatus);
router.patch('/:id/release-results', requireRole('admin'), releaseQuizResults);
router.patch('/:id/release-leaderboard', requireRole('admin'), releaseQuizLeaderboard);
router.get('/:id/export', requireRole('admin'), exportQuizResultsCSV);

export default router;
