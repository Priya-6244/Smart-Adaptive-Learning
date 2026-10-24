
require('dotenv').config()

const mongoose = require('mongoose')
const app = require('./app')

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/smart_adaptive_learning'
    )

    console.log('MongoDB Connected')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  startServer()
}

module.exports = { startServer }
