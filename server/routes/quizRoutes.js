
const express = require('express')
const router = express.Router()

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')

function getNextDifficulty(percentage, currentDifficulty) {
  if (percentage < 40) return 'easy'

  if (percentage >= 80) {
    if (currentDifficulty === 'easy') return 'medium'
    if (currentDifficulty === 'medium') return 'hard'
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

router.post('/submit', async (req, res) => {
  try {
    const { answers, learnerName, topic, timeTakenSeconds } = req.body

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
          typeof answer.selectedAnswer !== 'string' ||
          !answer.selectedAnswer.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Each answer must include a question ID and selected answer.',
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
          message: 'Submitted questions must belong to the selected topic.',
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

    const totalQuestions = responses.length
    const correctAnswers = responses.filter((r) => r.isCorrect).length
    const scorePercentage = Math.round(
      (correctAnswers / totalQuestions) * 100
    )

    const actualDifficulty = getActualDifficulty(responses)
    const recommendedDifficulty = getNextDifficulty(
      scorePercentage,
      actualDifficulty
    )

    const savedResult = await QuizResult.create({
      learnerName: learnerName || 'Learner',
      topic: topic || responses[0].topic,
      difficulty: actualDifficulty,
      recommendedDifficulty,
      totalQuestions,
      correctAnswers,
      scorePercentage,
      timeTakenSeconds: Math.max(0, Number(timeTakenSeconds) || 0),
      responses,
    })

    res.json({
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
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate quiz answers.',
    })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const [topics, results, latestResult] = await Promise.all([
      Question.distinct('topic'),
      QuizResult.find().select(
        'totalQuestions correctAnswers difficulty createdAt'
      ),
      QuizResult.findOne().sort({ createdAt: -1 }),
    ])

    const questionsAnswered = results.reduce(
      (sum, result) => sum + result.totalQuestions,
      0
    )

    const correctAnswers = results.reduce(
      (sum, result) => sum + result.correctAnswers,
      0
    )

    res.json({
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics.',
    })
  }
})

router.get('/results', async (req, res) => {
  try {
    const results = await QuizResult.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.json({
      success: true,
      count: results.length,
      results,
    })
  } catch (error) {
    console.error('Fetching results failed:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results.',
    })
  }
})

// Topic-wise learner performance and recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const topics = await Question.distinct('topic')
    const results = await QuizResult.find().sort({ createdAt: -1 }).lean()

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
        recommendation = 'Start a quiz in this topic to measure your progress.'
      } else if (accuracy < 60) {
        recommendation = 'Review the explanations and practise this topic again.'
      } else if (accuracy < 80) {
        recommendation = 'Keep practising to improve your accuracy.'
      } else {
        recommendation = 'Great progress! Try a higher difficulty level.'
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
      if (a.accuracy === null) return -1
      if (b.accuracy === null) return 1
      return a.accuracy - b.accuracy
    })

    res.json({
      success: true,
      topicPerformance,
    })
  } catch (error) {
    console.error('Fetching recommendations failed:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to generate topic recommendations.',
    })
  }
})

module.exports = router
