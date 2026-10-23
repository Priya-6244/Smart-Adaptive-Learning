
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

const questionRoutes = require('./routes/questionRoutes')
const quizRoutes = require('./routes/quizRoutes')

app.get('/', (req, res) => {
  res.json({
    message: 'Smart Adaptive Learning API is running!'
  })
})

app.get('/test-questions', (req, res) => {
  res.json({
    message: 'Question test route works!'
  })
})

app.use('/api/questions', questionRoutes)
app.use('/api/quiz', quizRoutes)

// Handle invalid routes
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  })
})

module.exports = app
