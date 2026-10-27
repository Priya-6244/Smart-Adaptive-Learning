
require('dotenv').config()

const mongoose = require('mongoose')
const Question = require('./models/Question')
const { buildQuestions } = require('./scripts/seedQuestions')

async function findExtraQuestions() {
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
      { questionText: 1, topic: 1, difficulty: 1 }
    ).lean()

    const extraQuestions = allQuestions.filter(
      (q) => !seedKeys.has(`${q.topic}|||${q.questionText}`)
    )

    console.log('Total questions:', allQuestions.length)
    console.log('Questions in seed bank:', seedQuestions.length)
    console.log('Questions outside seed bank:', extraQuestions.length)

    console.table(
      extraQuestions.map((q) => ({
        Topic: q.topic,
        Difficulty: q.difficulty,
        Question: q.questionText,
      }))
    )
  } catch (error) {
    console.error('Check failed:', error.message)
  } finally {
    await mongoose.disconnect()
  }
}

findExtraQuestions()
