
const mongoose = require('mongoose')

const adaptiveProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    currentDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      required: true,
    },

    consecutiveCorrect: {
      type: Number,
      default: 0,
      min: 0,
    },

    consecutiveIncorrect: {
      type: Number,
      default: 0,
      min: 0,
    },

    attemptedQuestionIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true }
)

adaptiveProgressSchema.index(
  { userId: 1, topic: 1 },
  { unique: true }
)

module.exports = mongoose.model(
  'AdaptiveProgress',
  adaptiveProgressSchema
)
