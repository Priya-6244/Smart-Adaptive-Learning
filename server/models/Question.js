
const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: [
        {
          validator: (options) =>
            Array.isArray(options) && options.length === 4,
          message: 'Each question must have exactly four options.',
        },
        {
          validator: (options) =>
            Array.isArray(options) &&
            options.every(
              (option) =>
                typeof option === 'string' &&
                option.trim().length > 0
            ),
          message: 'All four options must be non-empty strings.',
        },
      ],
    },

    correctAnswer: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (answer) {
          // Normal document validation
          if (Array.isArray(this.options)) {
            return this.options.includes(answer)
          }

          // Validation during updateOne() operations
          if (typeof this.getUpdate === 'function') {
            const update = this.getUpdate() || {}
            const options =
              update.$set?.options ??
              update.options ??
              this.get('options')

            return Array.isArray(options) && options.includes(answer)
          }

          return false
        },
        message:
          'The correct answer must match one of the four options.',
      },
    },

    explanation: {
      type: String,
      required: true,
      trim: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Question', questionSchema)
