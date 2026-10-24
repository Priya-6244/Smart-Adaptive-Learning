
const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')
const { authenticateUser } = require('./authRoutes')

const DIFFICULTIES = ['easy', 'medium', 'hard']
const QUESTIONS_PER_QUIZ = 10

// Get available topics.
router.get('/topics', async (req, res) => {
  try {
    const topics = await Question.distinct('topic')

    return res.json({
      success: true,
      topics: topics.sort(),
    })
  } catch (error) {
    console.error('Fetching topics failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch topics.',
    })
  }
})

// Load questions for the authenticated learner.
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { topic, difficulty, exclude } = req.query

    if (
      difficulty &&
      !DIFFICULTIES.includes(difficulty.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Difficulty must be easy, medium, or hard.',
      })
    }

    const userId = req.user._id

    // Only consider this learner's history.
    const historyFilter = { userId }

    // If no difficulty was explicitly supplied, use the learner's
    // most recent recommendation for the selected topic.
    let requestedLevel = difficulty
      ? difficulty.toLowerCase()
      : null

    if (!requestedLevel) {
      const latestResult = await QuizResult.findOne({
        ...historyFilter,
        ...(topic ? { topic } : {}),
      })
        .sort({ createdAt: -1, _id: -1 })
        .select('recommendedDifficulty difficulty')
        .lean()

      requestedLevel =
        latestResult?.recommendedDifficulty ||
        latestResult?.difficulty ||
        'easy'
    }

    const baseFilter = {}

    if (topic) {
      baseFilter.topic = topic
    }

    // Find questions already attempted by this learner.
    const previousResponses = await QuizResult.aggregate([
      { $match: historyFilter },
      { $unwind: '$responses' },
      ...(topic
        ? [{ $match: { 'responses.topic': topic } }]
        : []),
      { $group: { _id: '$responses.questionId' } },
    ])

    const excludedIds = [
      ...new Set([
        ...previousResponses.map((item) => String(item._id)),
        ...(exclude ? exclude.split(',') : []),
      ]),
    ]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id))

    const unansweredFilter = { ...baseFilter }

    if (excludedIds.length) {
      unansweredFilter._id = { $nin: excludedIds }
    }

    async function sampleQuestions(filter) {
      return Question.aggregate([
        { $match: filter },
        { $sample: { size: QUESTIONS_PER_QUIZ } },
        { $project: { correctAnswer: 0 } },
      ])
    }

    let questions = []
    let poolReset = false
    let difficultyFallback = false

    // First try unanswered questions at the recommended level.
    questions = await sampleQuestions({
      ...unansweredFilter,
      difficulty: requestedLevel,
    })

    // If none exist at that level, try unanswered questions
    // from other difficulty levels.
    if (questions.length === 0) {
      questions = await sampleQuestions(unansweredFilter)

      if (questions.length > 0) {
        difficultyFallback = true
      }
    }

    // If all available questions were attempted, reset the pool.
    if (questions.length === 0) {
      poolReset = true

      questions = await sampleQuestions({
        ...baseFilter,
        difficulty: requestedLevel,
      })

      if (questions.length === 0) {
        questions = await sampleQuestions(baseFilter)

        if (questions.length > 0) {
          difficultyFallback = true
        }
      }
    }

    return res.json({
      success: true,
      count: questions.length,
      questions,
      recommendedDifficulty: requestedLevel,
      poolReset,
      difficultyFallback,
      message: poolReset
        ? 'All available questions have been attempted. The question pool has restarted.'
        : difficultyFallback
          ? 'No questions were available at the recommended level, so questions from other levels were selected.'
          : 'Questions loaded successfully.',
    })
  } catch (error) {
    console.error('Fetching questions failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch questions.',
    })
  }
})

module.exports = router
