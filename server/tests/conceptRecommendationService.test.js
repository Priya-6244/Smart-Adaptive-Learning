
jest.mock('../models/Question', () => ({
  distinct: jest.fn(),
}))

jest.mock('../models/QuizResult', () => ({
  find: jest.fn(),
}))

jest.mock('../models/TopicPrerequisite', () => ({
  find: jest.fn(),
}))

const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')
const TopicPrerequisite = require('../models/TopicPrerequisite')
const {
  getConceptRecommendations,
} = require('../services/conceptRecommendationService')

function mockQuery(result) {
  const query = {
    sort: jest.fn(() => query),
    lean: jest.fn().mockResolvedValue(result),
  }

  return query
}

describe('Level 4 concept recommendation service', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    Question.distinct.mockResolvedValue([
      'Python Basics',
      'Functions',
      'Advanced Functions',
    ])

    QuizResult.find.mockReturnValue(mockQuery([]))
    TopicPrerequisite.find.mockReturnValue(mockQuery([]))
  })

  test('recommends an unassessed topic for beginners', async () => {
    const recommendations = await getConceptRecommendations(
      'test-user'
    )

    const topic = recommendations.find(
      (item) => item.topic === 'Python Basics'
    )

    expect(topic.accuracy).toBeNull()
    expect(topic.priority).toBe('New Topic')
    expect(topic.recommendedActivity).toMatch(/easy-level/i)
  })

  test('prioritizes topics with weak performance', async () => {
    QuizResult.find.mockReturnValue(
      mockQuery([
        {
          topic: 'Python Basics',
          totalQuestions: 10,
          correctAnswers: 3,
          createdAt: new Date(),
        },
      ])
    )

    const recommendations = await getConceptRecommendations(
      'test-user'
    )

    const topic = recommendations.find(
      (item) => item.topic === 'Python Basics'
    )

    expect(topic.accuracy).toBe(30)
    expect(topic.priority).toBe('High Priority')
  })

  test('recommends prerequisites when they have not been mastered', async () => {
    TopicPrerequisite.find.mockReturnValue(
      mockQuery([
        {
          topic: 'Functions',
          prerequisites: ['Python Basics'],
        },
      ])
    )

    QuizResult.find.mockReturnValue(
      mockQuery([
        {
          topic: 'Functions',
          totalQuestions: 10,
          correctAnswers: 9,
          createdAt: new Date(),
        },
      ])
    )

    const recommendations = await getConceptRecommendations(
      'test-user'
    )

    const functionsTopic = recommendations.find(
      (item) => item.topic === 'Functions'
    )

    expect(functionsTopic.priority).toBe('Prerequisite Review')
    expect(functionsTopic.missingPrerequisites).toContain(
      'Python Basics'
    )
  })

  test('recommends harder practice for strong topics without missing prerequisites', async () => {
    QuizResult.find.mockReturnValue(
      mockQuery([
        {
          topic: 'Python Basics',
          totalQuestions: 10,
          correctAnswers: 9,
          createdAt: new Date(),
        },
      ])
    )

    const recommendations = await getConceptRecommendations(
      'test-user'
    )

    const topic = recommendations.find(
      (item) => item.topic === 'Python Basics'
    )

    expect(topic.accuracy).toBe(90)
    expect(topic.priority).toBe('Ready to Advance')
    expect(topic.recommendedActivity).toMatch(/hard-level/i)
  })
})
