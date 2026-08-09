import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctOptions: [{
    type: Number, // array of 0-based indices for single or multi-correct MCQ
    required: true,
  }],
  marks: {
    type: Number,
    default: 1,
  },
  timeLimitSec: {
    type: Number,
    default: 0, // 0 means use global quiz duration or no per-question limit
  },
  order: {
    type: Number,
    default: 0,
  },
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  durationMinutes: {
    type: Number,
    default: 15,
  },
  perQuestionTimeSec: {
    type: Number,
    default: 0, // optional default override per question
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'live', 'ended'],
    default: 'draft',
  },
  startTime: {
    type: Date,
    default: null,
  },
  questions: [questionSchema],
  totalMarks: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

quizSchema.pre('save', function (next) {
  this.totalMarks = this.questions.reduce((acc, q) => acc + (q.marks || 1), 0);
  next();
});

export const Quiz = mongoose.model('Quiz', quizSchema);
