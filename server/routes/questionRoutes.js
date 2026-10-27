
const express = require('express')
const mongoose = require('mongoose')

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')
const AdaptiveProgress = require('../models/AdaptiveProgress')
const { authenticateUser } = require('./authRoutes')

const router = express.Router()

const QUESTIONS_PER_QUIZ = 10
const DIFFICULTIES = ['easy', 'medium', 'hard']

// Escape special characters before using a topic in a regular expression.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Match topic names without case sensitivity or accidental partial matches.
function createTopicFilter(topic) {
  const cleanTopic = String(topic || '').trim()

  if (!cleanTopic) {
    return {}
  }

  return {
    topic: {
      $regex: `^${escapeRegex(cleanTopic)}$`,
      $options: 'i',
    },
  }
}

// Return available topics.
router.get('/topics', async (req, res) => {
  try {
    const topics = await Question.distinct('topic')

    return res.json({
      success: true,
      topics: topics.filter(Boolean).sort(),
    })
  } catch (error) {
    console.error('Get topics error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to load topics.',
    })
  }
})

// Get the next adaptive question for a specific topic.
router.get('/next', authenticateUser, async (req, res) => {
  try {
    const topic = String(req.query.topic || '').trim()

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required.',
      })
    }

    const userId = req.user._id || req.user.id
    const topicFilter = createTopicFilter(topic)

    // Use a consistent topic name for the progress record.
    let progress = await AdaptiveProgress.findOne({
      userId,
      topic,
    })

    if (!progress) {
      progress = await AdaptiveProgress.create({
        userId,
        topic,
        currentDifficulty: 'medium',
        attemptedQuestionIds: [],
      })
    }

    if (!DIFFICULTIES.includes(progress.currentDifficulty)) {
      progress.currentDifficulty = 'medium'
      await progress.save()
    }

    const attemptedIds = progress.attemptedQuestionIds || []

    // Find a question at the current difficulty.
    async function selectQuestion(excludedIds, difficulty) {
      const match = {
        ...topicFilter,
        _id: { $nin: excludedIds },
      }

      if (difficulty) {
        match.difficulty = difficulty
      }

      return Question.aggregate([
        { $match: match },
        { $sample: { size: 1 } },
        { $project: { correctAnswer: 0 } },
      ])
    }

    let questions = await selectQuestion(
      attemptedIds,
      progress.currentDifficulty
    )

    let difficultyFallback = false
    let poolReset = false

    // If the current difficulty has no unanswered questions,
    // try another difficulty in the same topic.
    if (questions.length === 0) {
      questions = await selectQuestion(attemptedIds, null)
      difficultyFallback = questions.length > 0
    }

    // If every question has been attempted, reset this topic's pool.
    if (questions.length === 0) {
      const availableCount = await Question.countDocuments(topicFilter)

      if (availableCount === 0) {
        return res.json({
          success: true,
          question: null,
          currentDifficulty: progress.currentDifficulty,
          completed: true,
          message: 'No questions exist for this topic.',
        })
      }

      progress.attemptedQuestionIds = []
      await progress.save()

      poolReset = true

      // Start a new cycle at the current difficulty first.
      questions = await selectQuestion(
        [],
        progress.currentDifficulty
      )

      // If that difficulty has no questions, use any difficulty.
      if (questions.length === 0) {
        questions = await selectQuestion([], null)
        difficultyFallback = questions.length > 0
      }
    }

    if (questions.length === 0) {
      return res.json({
        success: true,
        question: null,
        currentDifficulty: progress.currentDifficulty,
        completed: true,
        message: 'No questions are currently available.',
      })
    }

    return res.json({
      success: true,
      question: questions[0],
      currentDifficulty: progress.currentDifficulty,
      difficultyFallback,
      poolReset,
      completed: false,
    })
  } catch (error) {
    console.error('Next question error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to load the next question.',
    })
  }
})

// Get a question pool for a quiz.
router.get('/', authenticateUser, async (req, res) => {
  try {
    const topic = String(req.query.topic || '').trim()
    const requestedDifficulty = String(
      req.query.difficulty || 'easy'
    ).trim().toLowerCase()

    const difficulty = DIFFICULTIES.includes(requestedDifficulty)
      ? requestedDifficulty
      : 'easy'

    const topicFilter = createTopicFilter(topic)

    const excludedIds = String(req.query.exclude || '')
      .split(',')
      .filter(Boolean)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id))

    const filter = {
      ...topicFilter,
      difficulty,
    }

    if (excludedIds.length > 0) {
      filter._id = { $nin: excludedIds }
    }

    let questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: QUESTIONS_PER_QUIZ } },
      { $project: { correctAnswer: 0 } },
    ])

    let poolReset = false
    let difficultyFallback = false

    // Try the same topic at another difficulty if needed.
    if (questions.length === 0 && topic) {
      const fallbackFilter = {
        ...topicFilter,
      }

      if (excludedIds.length > 0) {
        fallbackFilter._id = { $nin: excludedIds }
      }

      questions = await Question.aggregate([
        { $match: fallbackFilter },
        { $sample: { size: QUESTIONS_PER_QUIZ } },
        { $project: { correctAnswer: 0 } },
      ])

      difficultyFallback = questions.length > 0
    }

    // If the excluded questions exhaust the topic pool, start again.
    if (questions.length === 0 && topic) {
      const availableCount = await Question.countDocuments(topicFilter)

      if (availableCount > 0) {
        const resetFilter = {
          ...topicFilter,
          difficulty,
        }

        questions = await Question.aggregate([
          { $match: resetFilter },
          { $sample: { size: QUESTIONS_PER_QUIZ } },
          { $project: { correctAnswer: 0 } },
        ])

        if (questions.length === 0) {
          questions = await Question.aggregate([
            { $match: topicFilter },
            { $sample: { size: QUESTIONS_PER_QUIZ } },
            { $project: { correctAnswer: 0 } },
          ])

          difficultyFallback = questions.length > 0
        }

        poolReset = questions.length > 0
      }
    }

    return res.json({
      success: true,
      questions,
      count: questions.length,
      topic: topic || null,
      difficulty,
      difficultyFallback,
      poolReset,
      message:
        questions.length === 0
          ? 'No questions are available for this topic.'
          : 'Questions loaded successfully.',
    })
  } catch (error) {
    console.error('Get questions error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to load questions.',
    })
  }
})

module.exports = router
