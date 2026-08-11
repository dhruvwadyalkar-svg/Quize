import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';

export const startAttempt = async (req, res) => {
  try {
    const { quizId, studentName, studentPrn } = req.body;
    const studentId = req.user._id;

    const name = typeof studentName === 'string' ? studentName.trim() : '';
    const prn = typeof studentPrn === 'string' ? studentPrn.trim() : '';
    if (!name || !prn) {
      return res.status(400).json({ message: 'Your name and PRN are required before starting the quiz.' });
    }
    if (name.length > 100 || prn.length > 50) {
      return res.status(400).json({ message: 'Name or PRN is too long.' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    let attempt = await QuizAttempt.findOne({ quizId, studentId });
    if (!attempt) {
      attempt = await QuizAttempt.create({
        quizId,
        studentId,
        studentName: name,
        studentPrn: prn,
        startedAt: new Date(),
        totalPossibleMarks: quiz.totalMarks || 0,
        status: 'in-progress',
      });
    } else if (attempt.status === 'in-progress') {
      // Keep the identity submitted on the join screen current if the student re-enters the quiz.
      attempt.studentName = name;
      attempt.studentPrn = prn;
      await attempt.save();
    }

    res.json(attempt);
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ message: 'Error starting quiz attempt.' });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const { quizId, answers, isAutoSubmitted, studentName, studentPrn } = req.body; // answers: [{ questionId, selectedOptions, timeTakenSec }]
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    let attempt = await QuizAttempt.findOne({ quizId, studentId });
    if (!attempt) {
      const name = typeof studentName === 'string' ? studentName.trim() : '';
      const prn = typeof studentPrn === 'string' ? studentPrn.trim() : '';
      if (!name || !prn) {
        return res.status(400).json({ message: 'Your name and PRN are required before submitting the quiz.' });
      }
      attempt = new QuizAttempt({
        quizId,
        studentId,
        studentName: name,
        studentPrn: prn,
        startedAt: new Date(),
      });
    }

    let totalScore = 0;
    let totalTimeTaken = 0;
    const evaluatedAnswers = [];

    const totalPossibleMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    // Evaluate answers
    if (answers && Array.isArray(answers)) {
      for (const q of quiz.questions) {
        const studentAns = answers.find((a) => String(a.questionId) === String(q._id));
        const selectedOptions = studentAns ? (Array.isArray(studentAns.selectedOptions) ? studentAns.selectedOptions.map(Number) : []) : [];
        const timeTaken = studentAns ? Number(studentAns.timeTakenSec || 0) : 0;
        totalTimeTaken += timeTaken;

        // Check correctness: exact match of sets
        const correctSet = new Set((q.correctOptions || [0]).map(Number));
        const selectedSet = new Set(selectedOptions);

        let isCorrect = false;
        if (correctSet.size === selectedSet.size) {
          isCorrect = [...correctSet].every((opt) => selectedSet.has(opt));
        }

        const pointsEarned = isCorrect ? (q.marks || 1) : 0;
        totalScore += pointsEarned;

        evaluatedAnswers.push({
          questionId: q._id,
          selectedOptions,
          isCorrect,
          pointsEarned,
          timeTakenSec: timeTaken,
        });
      }
    }

    const percentage = totalPossibleMarks > 0 ? (totalScore / totalPossibleMarks) * 100 : 0;

    attempt.answers = evaluatedAnswers;
    attempt.score = totalScore;
    attempt.totalPossibleMarks = totalPossibleMarks;
    attempt.percentage = percentage;
    attempt.totalTimeTakenSec = totalTimeTaken;
    attempt.submittedAt = new Date();
    attempt.status = isAutoSubmitted ? 'auto-submitted' : 'submitted';

    await attempt.save();
    console.log(`✅ Attempt submitted for student ${req.user.name}: Score ${totalScore}/${totalPossibleMarks}`);

    res.json(attempt);
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ message: error.message || 'Error submitting quiz attempt.' });
  }
};

export const getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    if (req.user.role === 'student') {
      const quiz = await Quiz.findById(quizId).select('leaderboardReleased');
      if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
      if (!quiz.leaderboardReleased) {
        return res.status(403).json({ message: 'The leaderboard has not been released by the admin yet.' });
      }
    }
    const attempts = await QuizAttempt.find({ quizId }).sort({ score: -1, totalTimeTakenSec: 1 });
    res.json(attempts);
  } catch (error) {
    console.error('Fetch attempts error:', error);
    res.status(500).json({ message: 'Error fetching attempts.' });
  }
};

export const getStudentAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).select('resultsReleased');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    if (!quiz.resultsReleased) {
      return res.status(403).json({ message: 'Your result has not been released by the admin yet.' });
    }
    const attempt = await QuizAttempt.findOne({ quizId, studentId: req.user._id });
    if (!attempt) {
      return res.status(404).json({ message: 'No attempt found.' });
    }
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student attempt.' });
  }
};
