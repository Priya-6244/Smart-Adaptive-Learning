
const mongoose = require('mongoose')

const responseSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    selectedAnswer: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
  },
  { _id: false }
)

const quizResultSchema = new mongoose.Schema(
  {
    // Links each quiz attempt to its registered user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    learnerName: {
      type: String,
      default: 'Learner',
      trim: true,
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    recommendedDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    scorePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    responses: {
      type: [responseSchema],
      default: [],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('QuizResult', quizResultSchema)
