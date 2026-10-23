
const mongoose = require('mongoose')
const Question = require('../models/Question')

const questions = [
  {
    questionText: 'Which language is primarily used to structure web pages?',
    options: ['Python', 'HTML', 'Java', 'C++'],
    correctAnswer: 'HTML',
    explanation: 'HTML defines the structure and content of web pages.',
    topic: 'Web Development',
    difficulty: 'easy',
  },
  {
    questionText: 'Which CSS property changes the text color?',
    options: ['font-style', 'background', 'color', 'text-align'],
    correctAnswer: 'color',
    explanation: 'The CSS color property sets the foreground color of text.',
    topic: 'Web Development',
    difficulty: 'easy',
  },
  {
    questionText: 'Which keyword declares a block-scoped variable in JavaScript?',
    options: ['var', 'let', 'define', 'dim'],
    correctAnswer: 'let',
    explanation: 'The let keyword declares a block-scoped variable.',
    topic: 'JavaScript',
    difficulty: 'easy',
  },
  {
    questionText: 'Which method converts a JSON string into a JavaScript object?',
    options: [
      'JSON.stringify()',
      'JSON.parse()',
      'JSON.convert()',
      'JSON.object()',
    ],
    correctAnswer: 'JSON.parse()',
    explanation: 'JSON.parse() parses a JSON string into a JavaScript value.',
    topic: 'JavaScript',
    difficulty: 'medium',
  },
  {
    questionText: 'Which data structure follows the LIFO principle?',
    options: ['Queue', 'Stack', 'Linked list', 'Graph'],
    correctAnswer: 'Stack',
    explanation: 'A stack follows Last In, First Out.',
    topic: 'Data Structures',
    difficulty: 'easy',
  },
  {
    questionText: 'What is the average time complexity of binary search on a sorted array?',
    options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
    correctAnswer: 'O(log n)',
    explanation: 'Binary search halves the search space at each step.',
    topic: 'Data Structures',
    difficulty: 'medium',
  },
  {
    questionText: 'Which MongoDB format is used to represent documents?',
    options: ['CSV', 'BSON', 'Plain text only', 'XML only'],
    correctAnswer: 'BSON',
    explanation: 'MongoDB stores documents using BSON, a binary representation similar to JSON.',
    topic: 'Databases',
    difficulty: 'medium',
  },
  {
    questionText: 'Which SQL command retrieves data from a table?',
    options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'],
    correctAnswer: 'SELECT',
    explanation: 'SELECT queries and retrieves data from database tables.',
    topic: 'Databases',
    difficulty: 'easy',
  },
  {
    questionText: 'In machine learning, what is supervised learning?',
    options: [
      'Learning from labeled data',
      'Learning without any data',
      'Only storing files',
      'Deleting incorrect data',
    ],
    correctAnswer: 'Learning from labeled data',
    explanation: 'Supervised learning trains models using examples with known target labels.',
    topic: 'Machine Learning',
    difficulty: 'easy',
  },
  {
    questionText: 'Which metric measures the proportion of predicted positives that are actually positive?',
    options: ['Recall', 'Precision', 'Accuracy only', 'Mean squared error'],
    correctAnswer: 'Precision',
    explanation: 'Precision is true positives divided by all predicted positives.',
    topic: 'Machine Learning',
    difficulty: 'hard',
  },
]

async function seedQuestions() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        'mongodb://127.0.0.1:27017/smart_adaptive_learning'
    )

    // Avoid inserting the same seed questions every time.
    await Question.deleteMany({
      questionText: { $in: questions.map((q) => q.questionText) },
    })

    await Question.insertMany(questions)

    console.log(`Successfully inserted ${questions.length} questions.`)
  } catch (error) {
    console.error('Question seeding failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seedQuestions()
