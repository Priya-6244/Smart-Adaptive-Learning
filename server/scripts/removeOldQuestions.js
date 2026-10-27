
require('dotenv').config()

const mongoose = require('mongoose')
const Question = require('../models/Question')
const { buildQuestions } = require('./seedQuestions')

async function removeOldQuestions() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        'mongodb://127.0.0.1:27017/smart_adaptive_learning'
    )

    const seedQuestions = buildQuestions()

    const seedKeys = new Set(
      seedQuestions.map(
        (q) => `${q.topic}|||${q.questionText}`
      )
    )

    const allQuestions = await Question.find(
      {},
      { questionText: 1, topic: 1 }
    ).lean()

    const extraQuestions = allQuestions.filter(
      (q) => !seedKeys.has(`${q.topic}|||${q.questionText}`)
    )

    if (extraQuestions.length !== 10) {
      throw new Error(
        `Expected exactly 10 older questions, found ${extraQuestions.length}. Nothing was deleted.`
      )
    }

    console.log('Older questions to remove:')
    extraQuestions.forEach((q, index) => {
      console.log(`${index + 1}. [${q.topic}] ${q.questionText}`)
    })

    const result = await Question.deleteMany({
      _id: { $in: extraQuestions.map((q) => q._id) },
    })

    console.log(`\nDeleted ${result.deletedCount} older questions.`)
    console.log('The 150-question seed bank has been preserved.')
  } catch (error) {
    console.error('Cleanup failed:', error.message)
  } finally {
    await mongoose.disconnect()
  }
}

removeOldQuestions()
