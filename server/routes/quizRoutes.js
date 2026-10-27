const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')
const User = require('../models/User')
const { authenticateUser } = require('./authRoutes')
const AdaptiveProgress = require('../models/AdaptiveProgress')
const {
  getConceptRecommendations,
} = require('../services/conceptRecommendationService')

// Recover legacy quiz records for the original account only.
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

  const recentScores = previousResults
    .slice(0, 3)
    .map((result) => Number(result.scorePercentage))
    .filter((score) => Number.isFinite(score))

  let adjustedScore = percentage

  if (recentScores.length > 0) {
    const previousAverage =
      recentScores.reduce((sum, score) => sum + score, 0) /
      recentScores.length

    adjustedScore = Math.round(
      percentage * 0.7 + previousAverage * 0.3
    )
  }

  const currentRank = rank[currentDifficulty] || 1

  if (adjustedScore < 40) {
    return currentRank === 1
      ? 'easy'
      : currentRank === 3
        ? 'medium'
        : 'easy'
  }

  if (adjustedScore >= 80) {
    if (currentRank === 1) return 'medium'
    if (currentRank === 2) return 'hard'
    return 'hard'
  }

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

// Submit and save a quiz.
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

// Dashboard statistics.
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

// Quiz history.
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

// Level 3: personalized topic recommendations.
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
        (sum, attempt) => sum + (attempt.totalQuestions || 0),
        0
      )

      const correctAnswers = attempts.reduce(
        (sum, attempt) => sum + (attempt.correctAnswers || 0),
        0
      )

      const accuracy = totalQuestions
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : null

      let performanceLevel
      let recommendation
      let recommendedActivity

      if (accuracy === null) {
  performanceLevel = 'Not Assessed'
  recommendation =
    'Start a quiz to measure your current performance in this topic.'
  recommendedActivity =
    'Complete a beginner-level practice quiz.'
} else if (accuracy < 50) {
        performanceLevel = 'Needs Improvement'
        recommendation =
          'Review the explanations for incorrect answers and practise this topic again.'
        recommendedActivity =
          'Review the topic basics, study worked examples, and complete easy practice questions.'
      } else if (accuracy < 80) {
        performanceLevel = 'Developing'
        recommendation =
          'You understand some of this topic but would benefit from more practice.'
        recommendedActivity =
          'Review incorrect answers and complete medium-level practice questions.'
      } else {
        performanceLevel = 'Strong'
        recommendation =
          'You are performing well in this topic. Try more challenging questions.'
        recommendedActivity =
          'Attempt hard-level questions to strengthen your understanding.'
      }

      return {
        topic: topicName,
        attempts: attempts.length,
        questionsAnswered: totalQuestions,
        correctAnswers,
        accuracy,
        performanceLevel,
        recommendation,
        recommendedActivity,
      }
    })

    topicPerformance.sort((a, b) => {
      if (a.accuracy === null && b.accuracy !== null) return -1
      if (b.accuracy === null && a.accuracy !== null) return 1

      return (a.accuracy ?? 0) - (b.accuracy ?? 0)
    })

    const assessedTopics = topicPerformance.filter(
      (item) => item.accuracy !== null
    )

    const strongTopics = assessedTopics.filter(
      (item) => item.performanceLevel === 'Strong'
    )

    const weakTopics = assessedTopics.filter(
      (item) => item.performanceLevel === 'Needs Improvement'
    )

    return res.json({
      success: true,
      topicPerformance,
      strongTopics: strongTopics.map((item) => item.topic),
      weakTopics: weakTopics.map((item) => item.topic),
      recommendedNextActivity:
        topicPerformance[0]?.recommendedActivity ||
        'Start a quiz to begin tracking your progress.',
    })
  } catch (error) {
    console.error('Fetching recommendations failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Failed to generate topic recommendations.',
    })
  }
})
// Level 4: prerequisite-aware concept recommendations.
router.get(
  '/concept-recommendations',
  authenticateUser,
  async (req, res) => {
    try {
      await recoverLegacyResults(req.user)

      const recommendations = await getConceptRecommendations(
        req.user._id
      )

      return res.json({
        success: true,
        recommendations,
      })
    } catch (error) {
      console.error(
        'Fetching concept recommendations failed:',
        error.message
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to generate concept recommendations.',
      })
    }
  }
)
// Adaptive question evaluation.
router.post('/answer', authenticateUser, async (req, res) => {
  try {
    const { topic, questionId, selectedAnswer } = req.body

    if (!topic || !questionId || !selectedAnswer) {
      return res.status(400).json({
        message: 'Topic, question ID, and selected answer are required.',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        message: 'Invalid question ID.',
      })
    }

    const question = await Question.findById(questionId)

    if (!question) {
      return res.status(404).json({
        message: 'Question not found.',
      })
    }

    if (question.topic !== topic) {
      return res.status(400).json({
        message: 'Question does not belong to the selected topic.',
      })
    }

    if (!question.options.includes(selectedAnswer)) {
      return res.status(400).json({
        message: 'Selected answer is not a valid option.',
      })
    }

    let progress = await AdaptiveProgress.findOne({
      userId: req.user.id,
      topic,
    })

    if (!progress) {
      progress = await AdaptiveProgress.create({
        userId: req.user.id,
        topic,
        currentDifficulty: 'medium',
      })
    }

    const questionIdString = question._id.toString()

    if (
      progress.attemptedQuestionIds.some(
        (id) => id.toString() === questionIdString
      )
    ) {
      return res.status(409).json({
        message:
          'This question has already been answered in this adaptive run.',
      })
    }

    const isCorrect = selectedAnswer === question.correctAnswer
    const levels = ['easy', 'medium', 'hard']
    let difficultyChanged = false

    if (isCorrect) {
      progress.consecutiveCorrect += 1
      progress.consecutiveIncorrect = 0
    } else {
      progress.consecutiveIncorrect += 1
      progress.consecutiveCorrect = 0
    }

    if (progress.consecutiveCorrect >= 2) {
      const currentIndex = levels.indexOf(progress.currentDifficulty)

      if (currentIndex < levels.length - 1) {
        progress.currentDifficulty = levels[currentIndex + 1]
        difficultyChanged = true
      }

      progress.consecutiveCorrect = 0
    } else if (progress.consecutiveIncorrect >= 2) {
      const currentIndex = levels.indexOf(progress.currentDifficulty)

      if (currentIndex > 0) {
        progress.currentDifficulty = levels[currentIndex - 1]
        difficultyChanged = true
      }

      progress.consecutiveIncorrect = 0
    }

    progress.attemptedQuestionIds.push(question._id)
    await progress.save()

    return res.json({
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      currentDifficulty: progress.currentDifficulty,
      difficultyChanged,
      consecutiveCorrect: progress.consecutiveCorrect,
      consecutiveIncorrect: progress.consecutiveIncorrect,
      attemptedQuestionIds: progress.attemptedQuestionIds.map((id) =>
        id.toString()
      ),
    })
  } catch (error) {
    console.error('Answer evaluation error:', error)

    return res.status(500).json({
      message: 'Failed to evaluate answer.',
    })
  }
})

module.exports = router