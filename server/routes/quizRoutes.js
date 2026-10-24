
const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')
const User = require('../models/User')
const { authenticateUser } = require('./authRoutes')

// Recover legacy quiz records for the original account only.
// Records already assigned to an account are never reassigned.
async function recoverLegacyResults(user) {
  const oldestUser = await User.findOne()
    .sort({ createdAt: 1, _id: 1 })
    .select('_id')

  if (
    !oldestUser ||
    oldestUser._id.toString() !== user._id.toString()
  ) {
    return
  }

  await QuizResult.updateMany(
    {
      $or: [
        { userId: null },
        { userId: { $exists: false } },
      ],
    },
    {
      $set: {
        userId: user._id,
        learnerName: user.name || 'Learner',
      },
    }
  )
}

function getNextDifficulty(
  percentage,
  currentDifficulty,
  previousResults = []
) {
  const rank = { easy: 1, medium: 2, hard: 3 }

  // Use up to three previous attempts from the same topic.
  const recentScores = previousResults
    .slice(0, 3)
    .map((result) => Number(result.scorePercentage))
    .filter((score) => Number.isFinite(score))

  let adjustedScore = percentage

  if (recentScores.length > 0) {
    const previousAverage =
      recentScores.reduce((sum, score) => sum + score, 0) /
      recentScores.length

    // Give the latest attempt more influence than older attempts.
    adjustedScore = Math.round(
      percentage * 0.7 + previousAverage * 0.3
    )
  }

  const currentRank = rank[currentDifficulty] || 1

  // Reduce difficulty when performance is consistently low.
  if (adjustedScore < 40) {
    return currentRank === 1
      ? 'easy'
      : currentRank === 3
        ? 'medium'
        : 'easy'
  }

  // Increase difficulty when performance is strong.
  if (adjustedScore >= 80) {
    if (currentRank === 1) return 'medium'
    if (currentRank === 2) return 'hard'
    return 'hard'
  }

  // Keep the current level for scores from 40% to 79%.
  return currentDifficulty
}

function getActualDifficulty(results) {
  const rank = { easy: 1, medium: 2, hard: 3 }

  const average =
    results.reduce(
      (sum, result) => sum + (rank[result.difficulty] || 1),
      0
    ) / results.length

  if (average < 1.5) return 'easy'
  if (average < 2.5) return 'medium'
  return 'hard'
}

// Submit and save a quiz for the authenticated user.
router.post('/submit', authenticateUser, async (req, res) => {
  try {
    const { answers, topic, timeTakenSeconds } = req.body

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please submit at least one answer.',
      })
    }

    if (
      answers.some(
        (answer) =>
          !answer.questionId ||
          !mongoose.isValidObjectId(answer.questionId) ||
          typeof answer.selectedAnswer !== 'string' ||
          !answer.selectedAnswer.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Each answer must include a valid question ID and selected answer.',
      })
    }

    const ids = answers.map((answer) => String(answer.questionId))

    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate question answers are not allowed.',
      })
    }

    const responses = []

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId)

      if (!question) {
        return res.status(400).json({
          success: false,
          message: 'A submitted question could not be found.',
        })
      }

      if (topic && question.topic !== topic) {
        return res.status(400).json({
          success: false,
          message:
            'Submitted questions must belong to the selected topic.',
        })
      }

      if (!question.options.includes(answer.selectedAnswer)) {
        return res.status(400).json({
          success: false,
          message: 'A submitted answer is not a valid option.',
        })
      }

      responses.push({
        questionId: question._id,
        questionText: question.questionText,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: question.correctAnswer === answer.selectedAnswer,
        explanation: question.explanation,
        topic: question.topic,
        difficulty: question.difficulty,
      })
    }

    const selectedTopic = topic || responses[0].topic

    // Do not combine different topics into one adaptive result.
    if (responses.some((response) => response.topic !== selectedTopic)) {
      return res.status(400).json({
        success: false,
        message: 'All questions in a quiz must belong to one topic.',
      })
    }

    const totalQuestions = responses.length
    const correctAnswers = responses.filter(
      (response) => response.isCorrect
    ).length

    const scorePercentage = Math.round(
      (correctAnswers / totalQuestions) * 100
    )

    const actualDifficulty = getActualDifficulty(responses)

    // Retrieve this learner's previous attempts for this topic only.
    const previousResults = await QuizResult.find({
      userId: req.user._id,
      topic: selectedTopic,
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(3)
      .select('scorePercentage difficulty createdAt')
      .lean()

    const recommendedDifficulty = getNextDifficulty(
      scorePercentage,
      actualDifficulty,
      previousResults
    )

    const savedResult = await QuizResult.create({
      userId: req.user._id,
      learnerName: req.user.name || 'Learner',
      topic: selectedTopic,
      difficulty: actualDifficulty,
      recommendedDifficulty,
      totalQuestions,
      correctAnswers,
      scorePercentage,
      timeTakenSeconds: Math.max(
        0,
        Number(timeTakenSeconds) || 0
      ),
      responses,
    })

    return res.json({
      success: true,
      message: 'Quiz evaluated and saved successfully.',
      savedResultId: savedResult._id,
      score: correctAnswers,
      totalQuestions,
      percentage: scorePercentage,
      currentDifficulty: actualDifficulty,
      recommendedDifficulty,
      results: responses,
    })
  } catch (error) {
    console.error('Quiz submission failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate quiz answers.',
    })
  }
})

// Dashboard statistics for the logged-in user.
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    await recoverLegacyResults(req.user)

    const userFilter = { userId: req.user._id }

    const [topics, results, latestResult] = await Promise.all([
      Question.distinct('topic'),
      QuizResult.find(userFilter).select(
        'totalQuestions correctAnswers difficulty recommendedDifficulty createdAt'
      ),
      QuizResult.findOne(userFilter).sort({ createdAt: -1, _id: -1 }),
    ])

    const questionsAnswered = results.reduce(
      (sum, result) => sum + result.totalQuestions,
      0
    )

    const correctAnswers = results.reduce(
      (sum, result) => sum + result.correctAnswers,
      0
    )

    return res.json({
      success: true,
      topicsAvailable: topics.length,
      questionsAnswered,
      accuracy: questionsAnswered
        ? Math.round((correctAnswers / questionsAnswered) * 100)
        : 0,
      currentLevel:
        latestResult?.recommendedDifficulty ||
        latestResult?.difficulty ||
        'easy',
      quizAttempts: results.length,
    })
  } catch (error) {
    console.error('Fetching stats failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics.',
    })
  }
})

// Quiz history for the logged-in user.
router.get('/results', authenticateUser, async (req, res) => {
  try {
    await recoverLegacyResults(req.user)

    const results = await QuizResult.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .lean()

    return res.json({
      success: true,
      count: results.length,
      results,
    })
  } catch (error) {
    console.error('Fetching results failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results.',
    })
  }
})

// Topic-wise performance for the logged-in user.
router.get('/recommendations', authenticateUser, async (req, res) => {
  try {
    await recoverLegacyResults(req.user)

    const topics = await Question.distinct('topic')

    const results = await QuizResult.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1, _id: -1 })
      .lean()

    const topicPerformance = topics.map((topicName) => {
      const attempts = results.filter(
        (result) => result.topic === topicName
      )

      const totalQuestions = attempts.reduce(
        (sum, attempt) => sum + attempt.totalQuestions,
        0
      )

      const correctAnswers = attempts.reduce(
        (sum, attempt) => sum + attempt.correctAnswers,
        0
      )

      const accuracy = totalQuestions
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : null

      let recommendation

      if (accuracy === null) {
        recommendation =
          'Start a quiz in this topic to measure your progress.'
      } else if (accuracy < 60) {
        recommendation =
          'Review the explanations and practise this topic again.'
      } else if (accuracy < 80) {
        recommendation =
          'Keep practising to improve your accuracy.'
      } else {
        recommendation =
          'Great progress! Try a higher difficulty level.'
      }

      return {
        topic: topicName,
        attempts: attempts.length,
        questionsAnswered: totalQuestions,
        correctAnswers,
        accuracy,
        recommendation,
      }
    })

    topicPerformance.sort((a, b) => {
      if (a.accuracy === null && b.accuracy !== null) return -1
      if (b.accuracy === null && a.accuracy !== null) return 1
      return (a.accuracy ?? 0) - (b.accuracy ?? 0)
    })

    return res.json({
      success: true,
      topicPerformance,
    })
  } catch (error) {
    console.error('Fetching recommendations failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate topic recommendations.',
    })
  }
})

module.exports = router
