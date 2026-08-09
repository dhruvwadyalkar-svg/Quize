import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';

const generateJoinCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createQuiz = async (req, res) => {
  try {
    const { title, description, durationMinutes, perQuestionTimeSec, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Title and at least one question are required.' });
    }

    let joinCode = generateJoinCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await Quiz.findOne({ joinCode });
      if (!existing) isUnique = true;
      else joinCode = generateJoinCode();
    }

    const formattedQuestions = questions.map((q, index) => ({
      text: q.text,
      options: q.options,
      correctOptions: Array.isArray(q.correctOptions) ? q.correctOptions.map(Number) : [Number(q.correctOptions || 0)],
      marks: Number(q.marks) || 1,
      timeLimitSec: Number(q.timeLimitSec) || 0,
      order: index,
    }));

    const quiz = await Quiz.create({
      title,
      description: description || '',
      createdBy: req.user._id,
      joinCode,
      durationMinutes: Number(durationMinutes) || 15,
      perQuestionTimeSec: Number(perQuestionTimeSec) || 0,
      questions: formattedQuestions,
    });

    console.log(`✅ Created Quiz "${quiz.title}" with Join Code: ${quiz.joinCode}`);
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Error creating quiz.' });
  }
};

export const getAdminQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    console.log(`📋 Admin ${req.user.name} fetched ${quizzes.length} quizzes.`);
    res.json(quizzes);
  } catch (error) {
    console.error('Get admin quizzes error:', error);
    res.status(500).json({ message: 'Error fetching quizzes.' });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    if (req.user && req.user.role === 'student') {
      const attempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: req.user._id });
      const isSubmitted = attempt && attempt.status !== 'in-progress';
      const isEnded = quiz.status === 'ended';

      if (!isSubmitted && !isEnded) {
        const sanitizedQuiz = quiz.toObject();
        sanitizedQuiz.questions = sanitizedQuiz.questions.map((q) => {
          const { correctOptions, ...safeQ } = q;
          return safeQ;
        });
        return res.json(sanitizedQuiz);
      }
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz details.' });
  }
};

export const getQuizByJoinCode = async (req, res) => {
  try {
    const { code } = req.params;
    const quiz = await Quiz.findOne({ joinCode: code.toUpperCase() });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz with this join code does not exist.' });
    }

    if (req.user && req.user.role === 'student') {
      const attempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: req.user._id });
      const isSubmitted = attempt && attempt.status !== 'in-progress';
      const isEnded = quiz.status === 'ended';

      if (!isSubmitted && !isEnded) {
        const sanitizedQuiz = quiz.toObject();
        sanitizedQuiz.questions = sanitizedQuiz.questions.map((q) => {
          const { correctOptions, ...safeQ } = q;
          return safeQ;
        });
        return res.json(sanitizedQuiz);
      }
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error finding quiz by code.' });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized.' });
    }

    const { title, description, durationMinutes, perQuestionTimeSec, questions } = req.body;
    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (durationMinutes) quiz.durationMinutes = Number(durationMinutes);
    if (perQuestionTimeSec !== undefined) quiz.perQuestionTimeSec = Number(perQuestionTimeSec);

    if (questions && Array.isArray(questions)) {
      quiz.questions = questions.map((q, index) => ({
        text: q.text,
        options: q.options,
        correctOptions: Array.isArray(q.correctOptions) ? q.correctOptions.map(Number) : [Number(q.correctOptions || 0)],
        marks: Number(q.marks) || 1,
        timeLimitSec: Number(q.timeLimitSec) || 0,
        order: index,
      }));
    }

    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error updating quiz.' });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized.' });
    }
    await QuizAttempt.deleteMany({ quizId: req.params.id });
    res.json({ message: 'Quiz and associated attempts deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting quiz.' });
  }
};

export const updateQuizStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized.' });
    }

    quiz.status = status;
    if (status === 'live' && !quiz.startTime) {
      quiz.startTime = new Date();
    }

    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error updating quiz status.' });
  }
};

// Zero-dependency native CSV Exporter Engine
export const exportQuizResultsCSV = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const attempts = await QuizAttempt.find({ quizId: quiz._id }).populate('studentId', 'name email');

    // Rank attempts: score desc, time taken asc
    attempts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTimeTakenSec - b.totalTimeTakenSec;
    });

    const headers = ['Rank', 'Student Name', 'Email', 'Score', 'Total Possible', 'Percentage', 'Time Taken (Seconds)', 'Status', 'Submitted At'];
    const rows = [headers.join(',')];

    attempts.forEach((att, idx) => {
      const rank = idx + 1;
      const name = (att.studentName || att.studentId?.name || 'Student').replace(/"/g, '""');
      const email = (att.studentId?.email || 'N/A').replace(/"/g, '""');
      const score = att.score || 0;
      const totalPossible = att.totalPossibleMarks || quiz.totalMarks || 0;
      const percentage = `${(att.percentage || 0).toFixed(1)}%`;
      const timeTaken = att.totalTimeTakenSec || 0;
      const status = att.status || 'submitted';
      const submittedAt = att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'N/A';

      rows.push([
        rank,
        `"${name}"`,
        `"${email}"`,
        score,
        totalPossible,
        `"${percentage}"`,
        timeTaken,
        status,
        `"${submittedAt}"`
      ].join(','));
    });

    const csvContent = rows.join('\n');

    console.log(`📊 Generated CSV report for Quiz ${quiz.joinCode} (${attempts.length} attempts)`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=quiz_results_${quiz.joinCode}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Error exporting CSV results.' });
  }
};
