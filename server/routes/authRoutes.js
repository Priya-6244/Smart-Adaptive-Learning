
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const nodemailer = require('nodemailer')

const router = express.Router()

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
})

// Create a versioned JWT token
function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion ?? 0
    },
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

    const token = createToken(user)

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

    const token = createToken(user)

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

    const clientUrl =
      process.env.CLIENT_URL || 'http://localhost:5173'

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
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save()

      console.error(
        'Password reset email failed:',
        emailError.message
      )

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
        message:
          'Reset link is invalid or expired. Please request a new one.'
      })
    }

    user.password = await bcrypt.hash(password, 12)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    // Invalidate previously issued login tokens.
    user.tokenVersion = (user.tokenVersion ?? 0) + 1

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

// Verify JWT and identify the logged-in user
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Please log in to continue'
      })
    }

    const token = authHeader.slice(7).trim()

    if (!token) {
      return res.status(401).json({
        message: 'Please log in to continue'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (
      !decoded ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.tokenVersion !== 'number'
    ) {
      return res.status(401).json({
        message: 'Invalid session. Please log in again.'
      })
    }

    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({
        message: 'User account not found'
      })
    }

    if (decoded.tokenVersion !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({
        message: 'Your session has expired. Please log in again.'
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired session. Please log in again.'
    })
  }
}

// Get the logged-in user's profile
router.get('/me', authenticateUser, (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    }
  })
})

// Update the logged-in user's profile
router.put('/me', authenticateUser, async (req, res) => {
  try {
    const { name } = req.body

    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        message: 'Name must be at least 2 characters'
      })
    }

    req.user.name = name.trim()
    await req.user.save()

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    })
  } catch (error) {
    console.error('Profile update error:', error.message)

    return res.status(500).json({
      message: 'Unable to update profile'
    })
  }
})

// Change password
router.put('/change-password', authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters'
      })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message:
          'New password must be different from your current password'
      })
    }

    const user = await User.findById(req.user._id).select('+password')

    if (!user) {
      return res.status(404).json({
        message: 'User account not found'
      })
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    )

    if (!passwordMatches) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      })
    }

    user.password = await bcrypt.hash(newPassword, 12)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    // Invalidate tokens issued before this password change.
    user.tokenVersion = (user.tokenVersion ?? 0) + 1

    await user.save()

    return res.json({
      message:
        'Password changed successfully. Please log in again.'
    })
  } catch (error) {
    console.error('Change password error:', error.message)

    return res.status(500).json({
      message: 'Unable to change password. Please try again.'
    })
  }
})

// Logout from all sessions using this account.
// The frontend should also remove its stored token and user data.
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(401).json({
        message: 'User account not found'
      })
    }

    user.tokenVersion = (user.tokenVersion ?? 0) + 1
    await user.save()

    return res.json({
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error.message)

    return res.status(500).json({
      message: 'Unable to log out on the server'
    })
  }
})

module.exports = router
module.exports.authenticateUser = authenticateUser
