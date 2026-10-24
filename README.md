# Smart Adaptive Learning Application

## Overview

Smart Adaptive Learning is a web application that helps learners practise quiz questions, evaluate their performance, and receive recommendations based on their results. It supports difficulty adaptation and topic-wise performance tracking.

## Features

- Database-backed quiz questions
- Multiple-choice questions with answer validation
- Automatic score calculation
- Explanations for quiz answers
- Adaptive difficulty recommendations
- Topic-wise performance analysis
- Learner dashboard and quiz history
- Backend API automated tests

## Technology Stack

- **Frontend:**React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Testing:** Jest and Supertest

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB Community Server, or another accessible MongoDB instance
- Git

## Installation

Clone the repository and enter the project folder:

```bash
git clone https://github.com/Priya-6244/Smart-Adaptive-Learning
cd Smart-Adaptive-Learning
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies in a separate terminal:

```bash
cd client
npm install
```

## Configuration

Configure the MongoDB connection string using the backend environment variables supported by `server/server.js`.

For a local MongoDB instance, the application defaults to:

`mongodb://127.0.0.1:27017/smart_adaptive_learning`

If your project uses a `.env` file, create `server/.env` and set the appropriate `MONGODB_URI` and `PORT` values.

Never commit passwords, API keys, or other secrets.

## Run the Application

Start MongoDB first.

Start the backend from the `server` folder:

```bash
npm run dev
```

Start the frontend from the `client` folder in another terminal:

```bash
npm run dev
```

Open the local frontend URL printed by Vite, usually `http://localhost:5173/`.

## Run Automated Tests

From the `server` folder:

```bash
npm test
```

The current test run passed **16 tests across 3 test suites**.

## Project Structure

```text
Smart-Adaptive-Learning/
├── client/       # React frontend
├── server/       # Express backend and database models
│   ├── models/
│   ├── routes/
│   └── tests/
└── README.md
```

## Future Improvements

- User authentication and individual learner profiles
- More questions across topics and difficulty levels
- Advanced machine-learning-based personalization
- Deployment and production monitoring

## License

Add the license required by your internship or institution.
