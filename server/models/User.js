
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    passwordResetToken: {
      type: String,
      select: false
    },

    passwordResetExpires: {
      type: Date,
      select: false
    },

    // Used to invalidate previously issued login tokens.
    tokenVersion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('User', userSchema)
