import { generateQuestions, parseQuestions, regenerateQuestion, refineQuestions } from '../services/groqService.js';
import { validateQuestion, detectDuplicates, normalizeQuestion } from '../utils/questionValidator.js';

export const generateQuestionsHandler = async (req, res) => {
  try {
    const {
      topic,
      count,
      difficulty,
      type,
      optionsCount,
      marks,
      timeLimit,
      instructions,
      existingQuestions,
    } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ message: 'Topic is required.' });
    }

    const result = await generateQuestions({
      topic,
      count,
      difficulty,
      type,
      optionsCount,
      marks,
      timeLimit,
      instructions,
      existingQuestions,
    });

    const validCount = result.questions.filter((q) => q.validationStatus === 'valid').length;
    const needsReviewCount = result.questions.length - validCount;

    res.json({
      ...result,
      summary: {
        total: result.questions.length,
        valid: validCount,
        needsReview: needsReviewCount,
      },
    });
  } catch (error) {
    console.error('AI generate error:', error.message);

    if (error.message.includes('API key')) {
      return res.status(503).json({ message: error.message });
    }
    if (error.message.includes('timed out')) {
      return res.status(504).json({ message: error.message });
    }
    if (error.message.includes('429') || error.message.toLowerCase().includes('rate')) {
      return res.status(429).json({ message: 'Gemini rate limit reached. Please try again shortly.' });
    }

    res.status(500).json({ message: error.message || 'Failed to generate questions.' });
  }
};

export const parseQuestionsHandler = async (req, res) => {
  try {
    const { content, marks, timeLimit } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Pasted content is required.' });
    }

    const result = await parseQuestions(content, { marks, timeLimit });

    const validCount = result.questions.filter((q) => q.validationStatus === 'valid').length;

    res.json({
      ...result,
      summary: {
        total: result.questions.length,
        valid: validCount,
        needsReview: result.questions.length - validCount,
      },
    });
  } catch (error) {
    console.error('AI parse error:', error.message);

    if (error.message.includes('API key')) {
      return res.status(503).json({ message: error.message });
    }
    if (error.message.includes('timed out')) {
      return res.status(504).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || 'Failed to parse questions.' });
  }
};

export const regenerateQuestionHandler = async (req, res) => {
  try {
    const {
      topic,
      difficulty,
      type,
      marks,
      timeLimit,
      optionsCount,
      existingQuestions,
      questionToReplace,
    } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ message: 'Topic is required.' });
    }

    const result = await regenerateQuestion({
      topic,
      difficulty,
      type,
      marks,
      timeLimit,
      optionsCount,
      existingQuestions,
      questionToReplace,
    });

    res.json(result);
  } catch (error) {
    console.error('AI regenerate error:', error.message);

    if (error.message.includes('API key')) {
      return res.status(503).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || 'Failed to regenerate question.' });
  }
};

export const validateQuestionsHandler = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ message: 'Questions array is required.' });
    }

    const validated = questions.map((q, i) => validateQuestion(q, i));
    const withDuplicates = detectDuplicates(validated);

    const validCount = withDuplicates.filter((q) => q.validationStatus === 'valid').length;

    res.json({
      questions: withDuplicates,
      summary: {
        total: withDuplicates.length,
        valid: validCount,
        needsReview: withDuplicates.length - validCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate questions.' });
  }
};

export const refineQuestionsHandler = async (req, res) => {
  try {
    const { topic, questions, instruction } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ message: 'Topic is required.' });
    }
    if (!Array.isArray(questions)) {
      return res.status(400).json({ message: 'Questions array is required.' });
    }
    if (!instruction?.trim()) {
      return res.status(400).json({ message: 'Instruction is required.' });
    }

    const result = await refineQuestions({ topic, questions, instruction });

    if (!result || !Array.isArray(result.changes)) {
      return res.status(422).json({ message: 'AI returned an invalid change format.' });
    }

    const validatedChanges = [];
    const warnings = [];

    for (let i = 0; i < result.changes.length; i++) {
      const change = result.changes[i];
      if (!change.questionId || !change.action) {
        warnings.push(`Change element at index ${i} is missing questionId or action.`);
        continue;
      }

      if (change.action === 'deleted') {
        validatedChanges.push({
          questionId: change.questionId,
          action: 'deleted',
          reason: change.reason || 'Removed by editor request.',
        });
      } else if (change.action === 'modified' || change.action === 'added') {
        if (!change.question) {
          warnings.push(`Change element ${change.questionId} specifies '${change.action}' but has no question data.`);
          continue;
        }

        const normalized = normalizeQuestion(change.question);
        const validated = validateQuestion(normalized, i);

        if (validated.validationStatus === 'needs_review') {
          warnings.push(`Question ${change.questionId} failed validation: ${validated.validationIssues.join(', ')}`);
        }

        // Map back timeLimit/timeLimitSec
        const timeLimit = change.question.timeLimit ?? change.question.timeLimitSec;
        if (timeLimit !== undefined) {
          validated.timeLimitSec = Number(timeLimit) || 30;
        }

        validatedChanges.push({
          questionId: change.questionId,
          action: change.action,
          reason: change.reason || 'Modified by editor request.',
          question: validated,
        });
      } else {
        warnings.push(`Unknown action '${change.action}' for question ${change.questionId}.`);
      }
    }

    res.json({
      changes: validatedChanges,
      warnings,
      summary: `Modified ${validatedChanges.filter(c => c.action === 'modified').length} question(s), added ${validatedChanges.filter(c => c.action === 'added').length}, and deleted ${validatedChanges.filter(c => c.action === 'deleted').length}.`
    });
  } catch (error) {
    console.error('AI refine error:', error.message);

    if (error.message.includes('API key')) {
      return res.status(503).json({ message: error.message });
    }
    if (error.message.includes('timed out')) {
      return res.status(504).json({ message: error.message });
    }
    if (error.message.includes('429') || error.message.toLowerCase().includes('rate')) {
      return res.status(429).json({ message: 'Gemini/Groq rate limit reached. Please try again shortly.' });
    }

    res.status(500).json({ message: error.message || 'Failed to refine questions.' });
  }
};
