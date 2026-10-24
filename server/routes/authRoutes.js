
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const nodemailer = require('nodemailer')

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
})

const router = express.Router()

function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Name, email, and password are required'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    })

    const token = createToken(user._id.toString())

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      })
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message
      })
    }

    console.error('Signup error:', error.message)

    return res.status(500).json({
      message: 'Unable to create account'
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email and password are required'
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password')

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const token = createToken(user._id.toString())

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error.message)

    return res.status(500).json({
      message: 'Unable to log in'
    })
  }
})

// Forgot password

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        message: 'Please enter your email address'
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    })

    const response = {
      message:
        'If an account exists for this email, password reset instructions will be sent.'
    }

    // Use the same response for unknown accounts.
    if (!user) {
      return res.json(response)
    }

    const resetToken = crypto.randomBytes(32).toString('hex')

    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    user.passwordResetToken = hashedResetToken
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000)

    await user.save()

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const resetLink =
      `${clientUrl}/reset-password?token=${resetToken}`

    try {
      await emailTransporter.sendMail({
        from: `"Smart Adaptive Learning" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Reset your Smart Adaptive Learning password',
        text: `Hello ${user.name},

We received a request to reset your password.

Open this link to choose a new password. It expires in 15 minutes and can only be used once:

${resetLink}

If you did not request this, you can ignore this email.`
      })
    } catch (emailError) {
      // Invalidate the token if the email could not be sent.
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save()

      console.error('Password reset email failed:', emailError.message)

      return res.status(503).json({
        message:
          'Unable to send the reset email. Check the email configuration and try again.'
      })
    }

    return res.json(response)
  } catch (error) {
    console.error('Forgot password error:', error.message)

    return res.status(500).json({
      message: 'Unable to process the password reset request'
    })
  }
})


// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (
      typeof token !== 'string' ||
      !token ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        message: 'Reset token and new password are required'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters'
      })
    }

    const hashedResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires')

    if (!user) {
      return res.status(400).json({
        message: 'Reset link is invalid or expired. Please request a new one.'
      })
    }

    user.password = await bcrypt.hash(password, 12)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()

    return res.json({
      message: 'Password reset successfully. You can now log in.'
    })
  } catch (error) {
    console.error('Reset password error:', error.message)

    return res.status(500).json({
      message: 'Unable to reset the password'
    })
  }
})

module.exports = router
