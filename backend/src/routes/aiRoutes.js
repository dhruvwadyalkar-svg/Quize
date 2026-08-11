import express from 'express';
import {
  generateQuestionsHandler,
  parseQuestionsHandler,
  regenerateQuestionHandler,
  validateQuestionsHandler,
  refineQuestionsHandler,
} from '../controllers/aiController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import { aiRateLimiter, validateContentSize } from '../middleware/aiRateLimiter.js';

const router = express.Router();

router.use(verifyToken, requireRole('admin'), aiRateLimiter);

router.post('/generate-questions', generateQuestionsHandler);
router.post('/parse-questions', validateContentSize, parseQuestionsHandler);
router.post('/regenerate-question', regenerateQuestionHandler);
router.post('/validate-questions', validateQuestionsHandler);
router.post('/refine-questions', refineQuestionsHandler);

export default router;
