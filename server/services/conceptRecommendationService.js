
const Question = require('../models/Question')
const QuizResult = require('../models/QuizResult')
const TopicPrerequisite = require('../models/TopicPrerequisite')

async function getConceptRecommendations(userId) {
  const [topics, results, prerequisiteRules] = await Promise.all([
    Question.distinct('topic'),
    QuizResult.find({ userId })
      .sort({ createdAt: -1, _id: -1 })
      .lean(),
    TopicPrerequisite.find({}).lean(),
  ])

  const performanceByTopic = new Map()

  for (const topic of topics) {
    const attempts = results.filter(
      (result) => result.topic === topic
    )

    const totalQuestions = attempts.reduce(
      (sum, result) => sum + (result.totalQuestions || 0),
      0
    )

    const correctAnswers = attempts.reduce(
      (sum, result) => sum + (result.correctAnswers || 0),
      0
    )

    const accuracy = totalQuestions
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : null

    performanceByTopic.set(topic, {
      topic,
      attempts: attempts.length,
      totalQuestions,
      correctAnswers,
      accuracy,
    })
  }

  const rulesByTopic = new Map(
    prerequisiteRules.map((rule) => [
      rule.topic,
      rule.prerequisites || [],
    ])
  )

  const availableTopics = new Set(topics)

  const recommendations = topics.map((topic) => {
    const performance = performanceByTopic.get(topic)
    const prerequisites = rulesByTopic.get(topic) || []

    const missingPrerequisites = prerequisites.filter(
      (prerequisite) =>
        !availableTopics.has(prerequisite) ||
        performanceByTopic.get(prerequisite)?.accuracy < 50 ||
        performanceByTopic.get(prerequisite)?.accuracy === null ||
        performanceByTopic.get(prerequisite)?.accuracy === undefined
    )

    let priority
    let reason
    let recommendedActivity

    if (missingPrerequisites.length > 0) {
      priority = 'Prerequisite Review'
      reason =
        'Review the required concepts before studying this topic.'
      recommendedActivity =
        `Study prerequisite topics: ${missingPrerequisites.join(', ')}.`
    } else if (performance.accuracy === null) {
      priority = 'New Topic'
      reason =
        'This topic has not been assessed yet and is ready to explore.'
      recommendedActivity =
        'Complete an easy-level practice quiz.'
    } else if (performance.accuracy < 50) {
      priority = 'High Priority'
      reason =
        'Your performance indicates that this topic needs more practice.'
      recommendedActivity =
        'Review explanations and practise easy-level questions.'
    } else if (performance.accuracy < 80) {
      priority = 'Medium Priority'
      reason =
        'More practice can help strengthen your understanding.'
      recommendedActivity =
        'Review mistakes and practise medium-level questions.'
    } else {
      priority = 'Ready to Advance'
      reason =
        'Your performance is strong enough to try more challenging work.'
      recommendedActivity =
        'Attempt hard-level questions or a related advanced topic.'
    }

    return {
      topic,
      accuracy: performance.accuracy,
      attempts: performance.attempts,
      prerequisites,
      missingPrerequisites,
      priority,
      reason,
      recommendedActivity,
    }
  })

  const priorityRank = {
    'Prerequisite Review': 0,
    'High Priority': 1,
    'New Topic': 2,
    'Medium Priority': 3,
    'Ready to Advance': 4,
  }

  recommendations.sort((a, b) => {
    const rankDifference =
      priorityRank[a.priority] - priorityRank[b.priority]

    if (rankDifference !== 0) return rankDifference

    return (a.accuracy ?? -1) - (b.accuracy ?? -1)
  })

  return recommendations
}

module.exports = { getConceptRecommendations }
