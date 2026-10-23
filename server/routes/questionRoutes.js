
const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')

const DIFFICULTIES = ['easy', 'medium', 'hard']

router.get('/topics', async (req, res) => {
  try {
    const topics = await Question.distinct('topic')
    res.json({ success: true, topics: topics.sort() })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topics.',
    })
  }
})

router.get('/', async (req, res) => {
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

    const baseFilter = {}
    if (topic) baseFilter.topic = topic

    const previousResponses = topic
      ? await QuizResult.aggregate([
          { $unwind: '$responses' },
          { $match: { 'responses.topic': topic } },
          { $group: { _id: '$responses.questionId' } },
        ])
      : []

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

    const requestedLevel = difficulty
      ? difficulty.toLowerCase()
      : null

    async function sampleQuestions(filter) {
      return Question.aggregate([
        { $match: filter },
        { $sample: { size: 10 } },
        { $project: { correctAnswer: 0 } },
      ])
    }

    let questions = []
    let poolReset = false
    let difficultyFallback = false

    if (requestedLevel) {
      questions = await sampleQuestions({
        ...unansweredFilter,
        difficulty: requestedLevel,
      })
    } else {
      questions = await sampleQuestions(unansweredFilter)
    }

    if (questions.length === 0) {
      questions = await sampleQuestions(unansweredFilter)

      if (questions.length > 0 && requestedLevel) {
        difficultyFallback = true
      }
    }

    if (questions.length === 0) {
      poolReset = true

      if (requestedLevel) {
        questions = await sampleQuestions({
          ...baseFilter,
          difficulty: requestedLevel,
        })
      }

      if (questions.length === 0) {
        questions = await sampleQuestions(baseFilter)

        if (requestedLevel && questions.length > 0) {
          difficultyFallback = true
        }
      }
    }

    res.json({
      success: true,
      count: questions.length,
      questions,
      poolReset,
      difficultyFallback,
      message: poolReset
        ? 'All available questions have been attempted. The question pool has restarted.'
        : difficultyFallback
          ? 'No unanswered questions were available at the requested level, so other levels were selected.'
          : 'Questions loaded successfully.',
    })
  } catch (error) {
    console.error('Fetching questions failed:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions.',
    })
  }
})

module.exports = router
