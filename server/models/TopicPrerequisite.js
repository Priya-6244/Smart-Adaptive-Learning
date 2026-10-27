
const mongoose = require('mongoose')

const topicPrerequisiteSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },

    prerequisites: {
      type: [String],
      default: [],
      validate: {
        validator: function (topics) {
          return (
            Array.isArray(topics) &&
            topics.every(
              (item) =>
                typeof item === 'string' &&
                item.trim().length > 0
            ) &&
            !topics.some(
              (item) =>
                item.trim().toLowerCase() ===
                this.topic.trim().toLowerCase()
            ) &&
            new Set(
              topics.map((item) => item.trim().toLowerCase())
            ).size === topics.length
          )
        },
        message:
          'Prerequisites must be unique, non-empty topics and cannot include the topic itself.',
      },
    },
  },
  { timestamps: true }
)

topicPrerequisiteSchema.index({ topic: 1 }, { unique: true })

module.exports = mongoose.model(
  'TopicPrerequisite',
  topicPrerequisiteSchema
)
