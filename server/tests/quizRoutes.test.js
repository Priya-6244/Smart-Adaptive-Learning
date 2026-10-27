
process.env.JWT_SECRET = 'test-secret-for-jest-only'

const jwt = require('jsonwebtoken')
const request = require('supertest')
const mongoose = require('mongoose')

jest.mock('../models/Question', () => ({
  findById: jest.fn(),
  distinct: jest.fn(),
}))

jest.mock('../models/QuizResult', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  updateMany: jest.fn(),
}))

jest.mock('../models/User', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}))

jest.mock('../services/conceptRecommendationService', () => ({
  getConceptRecommendations: jest.fn(),
}))

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')
const User = require('../models/User')

const {
  getConceptRecommendations,
} = require('../services/conceptRecommendationService')

const app = require('../app')

const testUserId = '507f1f77bcf86cd799439011'
const questionId1 = '507f1f77bcf86cd799439012'
const questionId2 = '507f1f77bcf86cd799439013'

const testUser = {
  _id: new mongoose.Types.ObjectId(testUserId),
  name: 'Test Learner',
  tokenVersion: 0,
}

const testToken = jwt.sign(
  {
    userId: testUserId,
    tokenVersion: 0,
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

const authenticatedRequest = () => ({
  post: (path) =>
    request(app)
      .post(path)
      .set('Authorization', `Bearer ${testToken}`),

  get: (path) =>
    request(app)
      .get(path)
      .set('Authorization', `Bearer ${testToken}`),
})

// Create a chainable Mongoose-style query mock.
function mockQuery(result) {
  const query = {
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    select: jest.fn(() => query),
    lean: jest.fn(() => query),
    then: (resolve, reject) =>
      Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  }

  return query
}

describe('Quiz submission API', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    User.findById.mockResolvedValue(testUser)

    // recoverLegacyResults() checks the oldest user.
    User.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: testUser._id,
        }),
      }),
    })

    QuizResult.updateMany.mockResolvedValue({
      modifiedCount: 0,
    })

    QuizResult.find.mockReturnValue(mockQuery([]))
    QuizResult.findOne.mockReturnValue(mockQuery(null))
  })

  test('rejects an empty answer list', async () => {
    const response = await authenticatedRequest()
      .post('/api/quiz/submit')
      .send({ answers: [] })

    expect(response.statusCode).toBe(400)
    expect(response.body.success).toBe(false)
    expect(QuizResult.create).not.toHaveBeenCalled()
  })

  test('rejects answers without a selected option', async () => {
    const response = await authenticatedRequest()
      .post('/api/quiz/submit')
      .send({
        answers: [{ questionId: questionId1 }],
      })

    expect(response.statusCode).toBe(400)
    expect(response.body.success).toBe(false)
    expect(QuizResult.create).not.toHaveBeenCalled()
  })

  test('rejects duplicate question answers', async () => {
    const response = await authenticatedRequest()
      .post('/api/quiz/submit')
      .send({
        answers: [
          { questionId: questionId1, selectedAnswer: 'A' },
          { questionId: questionId1, selectedAnswer: 'B' },
        ],
      })

    expect(response.statusCode).toBe(400)
    expect(response.body.message).toMatch(/Duplicate/i)
    expect(QuizResult.create).not.toHaveBeenCalled()
  })

  test('scores correct answers and saves the result', async () => {
    Question.findById
      .mockResolvedValueOnce({
        _id: questionId1,
        questionText: 'Which language is used with React?',
        options: ['Python', 'JavaScript', 'C++', 'Java'],
        correctAnswer: 'JavaScript',
        explanation: 'React applications commonly use JavaScript.',
        topic: 'Web Development',
        difficulty: 'easy',
      })
      .mockResolvedValueOnce({
        _id: questionId2,
        questionText: 'What does HTML define?',
        options: [
          'Page structure',
          'Database',
          'Server',
          'Operating system',
        ],
        correctAnswer: 'Page structure',
        explanation: 'HTML defines the structure of a web page.',
        topic: 'Web Development',
        difficulty: 'easy',
      })

    QuizResult.find.mockReturnValue(mockQuery([]))

    QuizResult.create.mockImplementation(async (data) => ({
      ...data,
      _id: 'saved-result-id',
    }))

    const response = await authenticatedRequest()
      .post('/api/quiz/submit')
      .send({
        topic: 'Web Development',
        timeTakenSeconds: 45,
        answers: [
          {
            questionId: questionId1,
            selectedAnswer: 'JavaScript',
          },
          {
            questionId: questionId2,
            selectedAnswer: 'Database',
          },
        ],
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.score).toBe(1)
    expect(response.body.totalQuestions).toBe(2)
    expect(response.body.percentage).toBe(50)
    expect(response.body.results[0].isCorrect).toBe(true)
    expect(response.body.results[1].isCorrect).toBe(false)
    expect(QuizResult.create).toHaveBeenCalledTimes(1)
  })

  test('rejects an answer that is not one of the question options', async () => {
    Question.findById.mockResolvedValueOnce({
      _id: questionId1,
      questionText: 'Which language is used with React?',
      options: ['Python', 'JavaScript', 'C++', 'Java'],
      correctAnswer: 'JavaScript',
      explanation: 'React applications commonly use JavaScript.',
      topic: 'Web Development',
      difficulty: 'easy',
    })

    const response = await authenticatedRequest()
      .post('/api/quiz/submit')
      .send({
        topic: 'Web Development',
        answers: [
          {
            questionId: questionId1,
            selectedAnswer: 'Not an option',
          },
        ],
      })

    expect(response.statusCode).toBe(400)
    expect(response.body.success).toBe(false)
    expect(QuizResult.create).not.toHaveBeenCalled()
  })

  test('GET /stats returns dashboard statistics', async () => {
    Question.distinct.mockResolvedValue([
      'Web Development',
      'Python',
    ])

    QuizResult.find.mockReturnValue(
      mockQuery([
        { totalQuestions: 5, correctAnswers: 4 },
        { totalQuestions: 5, correctAnswers: 2 },
      ])
    )

    QuizResult.findOne.mockReturnValue(
      mockQuery({
        recommendedDifficulty: 'medium',
      })
    )

    const response = await authenticatedRequest()
      .get('/api/quiz/stats')

    expect(response.statusCode).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.topicsAvailable).toBe(2)
    expect(response.body.questionsAnswered).toBe(10)
    expect(response.body.accuracy).toBe(60)
    expect(response.body.currentLevel).toBe('medium')
    expect(response.body.quizAttempts).toBe(2)
  })

  test('GET /recommendations identifies a weak topic', async () => {
    Question.distinct.mockResolvedValue([
      'Python',
      'Web Development',
    ])

    QuizResult.find.mockReturnValue(
      mockQuery([
        {
          topic: 'Python',
          totalQuestions: 5,
          correctAnswers: 2,
        },
      ])
    )

    const response = await authenticatedRequest()
      .get('/api/quiz/recommendations')

    expect(response.statusCode).toBe(200)
    expect(response.body.success).toBe(true)

    const python = response.body.topicPerformance.find(
      (item) => item.topic === 'Python'
    )

    const web = response.body.topicPerformance.find(
      (item) => item.topic === 'Web Development'
    )

    expect(python.accuracy).toBe(40)
    expect(python.recommendation).toMatch(/Review the explanations/)
    expect(web.accuracy).toBeNull()
    expect(web.recommendation).toMatch(/Start a quiz/)
  })

  test('GET /concept-recommendations returns prerequisite-aware recommendations', async () => {
    const mockRecommendations = [
      {
        topic: 'Python',
        accuracy: 40,
        attempts: 2,
        prerequisites: [],
        missingPrerequisites: [],
        priority: 'High Priority',
        reason:
          'Your performance indicates that this topic needs more practice.',
        recommendedActivity:
          'Review explanations and practise easy-level questions.',
      },
    ]

    getConceptRecommendations.mockResolvedValue(
      mockRecommendations
    )

    const response = await authenticatedRequest()
      .get('/api/quiz/concept-recommendations')

    expect(response.statusCode).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.recommendations).toEqual(
      mockRecommendations
    )
    expect(getConceptRecommendations).toHaveBeenCalledWith(
      testUser._id
    )
  })
})
