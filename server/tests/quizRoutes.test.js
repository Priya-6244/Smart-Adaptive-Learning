
const request = require('supertest')

jest.mock('../models/Question', () => ({
  findById: jest.fn(),
  distinct: jest.fn(),
}))

jest.mock('../models/QuizResult', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
}))

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')
const app = require('../app')

describe('Quiz submission API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('rejects an empty answer list', async () => {
    const response = await request(app)
      .post('/api/quiz/submit')
      .send({ answers: [] })

    expect(response.statusCode).toBe(400)
    expect(response.body.success).toBe(false)
    expect(QuizResult.create).not.toHaveBeenCalled()
  })

  test('rejects answers without a selected option', async () => {
    const response = await request(app)
      .post('/api/quiz/submit')
      .send({
        answers: [{ questionId: 'question-id' }],
      })

    expect(response.statusCode).toBe(400)
    expect(response.body.success).toBe(false)
    expect(QuizResult.create).not.toHaveBeenCalled()
  })

  test('rejects duplicate question answers', async () => {
    const response = await request(app)
      .post('/api/quiz/submit')
      .send({
        answers: [
          { questionId: 'question-id', selectedAnswer: 'A' },
          { questionId: 'question-id', selectedAnswer: 'B' },
        ],
      })

    expect(response.statusCode).toBe(400)
    expect(response.body.message).toMatch(/Duplicate/)
    expect(QuizResult.create).not.toHaveBeenCalled()
  })

  test('scores correct answers and saves the result', async () => {
    Question.findById
      .mockResolvedValueOnce({
        _id: 'question-id-1',
        questionText: 'Which language is used with React?',
        options: ['Python', 'JavaScript', 'C++', 'Java'],
        correctAnswer: 'JavaScript',
        explanation: 'React applications commonly use JavaScript.',
        topic: 'Web Development',
        difficulty: 'easy',
      })
      .mockResolvedValueOnce({
        _id: 'question-id-2',
        questionText: 'What does HTML define?',
        options: ['Page structure', 'Database', 'Server', 'Operating system'],
        correctAnswer: 'Page structure',
        explanation: 'HTML defines the structure of a web page.',
        topic: 'Web Development',
        difficulty: 'easy',
      })

    QuizResult.create.mockImplementation(async (data) => ({
      ...data,
      _id: 'saved-result-id',
    }))

    const response = await request(app)
      .post('/api/quiz/submit')
      .send({
        learnerName: 'Test Learner',
        topic: 'Web Development',
        timeTakenSeconds: 45,
        answers: [
          {
            questionId: 'question-id-1',
            selectedAnswer: 'JavaScript',
          },
          {
            questionId: 'question-id-2',
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
      _id: 'question-id-1',
      questionText: 'Which language is used with React?',
      options: ['Python', 'JavaScript', 'C++', 'Java'],
      correctAnswer: 'JavaScript',
      explanation: 'React applications commonly use JavaScript.',
      topic: 'Web Development',
      difficulty: 'easy',
    })

    const response = await request(app)
      .post('/api/quiz/submit')
      .send({
        topic: 'Web Development',
        answers: [
          {
            questionId: 'question-id-1',
            selectedAnswer: 'Not an option',
          },
        ],
      })

    expect(response.statusCode).toBe(400)
    expect(response.body.success).toBe(false)
    expect(QuizResult.create).not.toHaveBeenCalled()
  })
  
  test('GET /stats returns dashboard statistics', async () => {
    Question.distinct.mockResolvedValue(['Web Development', 'Python'])

    const results = [
      { totalQuestions: 5, correctAnswers: 4 },
      { totalQuestions: 5, correctAnswers: 2 },
    ]

    QuizResult.find.mockReturnValue({
      select: jest.fn().mockResolvedValue(results),
    })

    QuizResult.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        recommendedDifficulty: 'medium',
      }),
    })

    const response = await request(app).get('/api/quiz/stats')

    expect(response.statusCode).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.topicsAvailable).toBe(2)
    expect(response.body.questionsAnswered).toBe(10)
    expect(response.body.accuracy).toBe(60)
    expect(response.body.currentLevel).toBe('medium')
    expect(response.body.quizAttempts).toBe(2)
  })

  test('GET /recommendations identifies a weak topic', async () => {
    Question.distinct.mockResolvedValue(['Python', 'Web Development'])

    QuizResult.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            topic: 'Python',
            totalQuestions: 5,
            correctAnswers: 2,
          },
        ]),
      }),
    })

    const response = await request(app).get('/api/quiz/recommendations')

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

})
