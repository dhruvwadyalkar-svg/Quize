import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedOptions: [{
    type: Number,
  }],
  isCorrect: {
    type: Boolean,
    default: false,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
  timeTakenSec: {
    type: Number,
    default: 0,
  },
});

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  studentPrn: {
    type: String,
    required: true,
    trim: true,
  },
  answers: [answerSchema],
  score: {
    type: Number,
    default: 0,
  },
  totalPossibleMarks: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  totalTimeTakenSec: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'auto-submitted'],
    default: 'in-progress',
  },
});

// Ensure a student can submit only one completed attempt per quiz
quizAttemptSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
