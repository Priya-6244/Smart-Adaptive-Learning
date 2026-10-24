# Smart Adaptive Learning Application

A full-stack web application that helps students practise quiz questions, track their learning progress, identify weak topics, and receive personalized difficulty recommendations.

Developed as part of the **DIGIT Innovations Engineering Internship Assignment**.

## Features

### 1. User Authentication
- User signup and login.
- Passwords stored as bcrypt hashes.
- JWT-based authentication.
- Forgot-password and password-reset functionality through email.
- Protected application routes.
- Profile editing and password changing.
- Logout and session invalidation.

### 2. Quiz Application
- Multiple-choice questions retrieved from MongoDB.
- Questions organized by topic and difficulty.
- Server-side answer validation and score calculation.
- Correct answers and explanations displayed after submission.
- Quiz attempts and individual responses saved in the database.
- Quiz history for the authenticated learner.

### 3. Adaptive Quiz Engine
- Supports Easy, Medium, and Hard difficulty levels.
- Uses recent quiz performance to recommend the next difficulty.
- Selects questions according to the recommended difficulty when suitable questions are available.
- Avoids previously attempted questions where possible.
- Handles unavailable questions and question-pool resets.

### 4. Personalized Learning
- Topic-wise performance analysis.
- Overall accuracy and quiz statistics.
- Identification of strong and weak topics.
- Personalized recommendations for revision and further practice.
- Dashboard displaying progress and previous quiz results.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Email | Nodemailer |
| Testing | Jest, Supertest |

## Application Architecture

1. The React frontend sends requests to the Express backend.
2. The backend authenticates users and validates requests.
3. Mongoose communicates with MongoDB to retrieve questions and persist application records.
4. The backend evaluates quiz answers, calculates scores, and generates recommendations.
5. The frontend displays results, quiz history, and learning progress.

## Adaptive Algorithm

The current adaptive engine is rule-based, not a trained machine-learning model.

It considers the current quiz score and the average score of up to three previous attempts on the same topic.

The adjusted score combines:
- 70% of the current quiz score.
- 30% of the average of the available previous quiz scores.

The difficulty recommendation follows these rules:

- Below 40% adjusted performance: reduce difficulty where possible.
- At or above 80% adjusted performance: increase difficulty where possible.
- Otherwise: retain the current difficulty.

The recommendation is bounded by Easy and Hard. The question-selection route uses the most recent recommendation for the selected topic unless a difficulty is explicitly requested. If no suitable unanswered questions are available, the application can select questions from other levels or restart the question pool.

These rules are intended to provide a simple, explainable adaptive learning mechanism. They are not evidence of a trained ML model.

## Database Design

The application uses MongoDB for persistent storage.

The main collections include:

- **Users:** names, email addresses, password hashes, and authentication-related fields.
- **Questions:** question statements, options, correct answers, explanations, topics, and difficulty levels.
- **Quiz Results:** learner references, scores, selected answers, correctness, question details, and recommended difficulty.

Quiz history and progress statistics are retrieved from the backend and scoped to the authenticated learner.

## Project Structure

```text
Smart-Adaptive-Learning/
├── client/
│   └── src/
├── server/
│   ├── models/
│   ├── routes/
│   └── tests/
├── .gitignore
└── README.md
```

## Prerequisites

Install the following:

- Node.js and npm.
- Git.
- MongoDB Community Server or an accessible MongoDB instance.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Priya-6244/Smart-Adaptive-Learning.git
cd Smart-Adaptive-Learning
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

Create a `server/.env` file and configure the environment variables required by the backend.

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_adaptive_learning
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_email_address
EMAIL_APP_PASSWORD=your_email_app_password
```

Use the actual variable names expected by the backend configuration. Configure email credentials only if email functionality is required.

Never commit `.env` files, passwords, JWT secrets, or API keys to GitHub.

### 4. Start the backend

Make sure MongoDB is running. From the `server` directory, run:

```bash
npm run dev
```

The backend should start on the configured port, normally port 5000.

### 5. Install frontend dependencies

Open a second terminal in VS Code and run:

```bash
cd client
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite, normally:

`http://localhost:5173`

If the port is already occupied, Vite may display another port.

## Testing

Run backend automated tests from the `server` directory:

```bash
npm test
```

Test the following scenarios before submission:

- Successful signup and login.
- Invalid credentials and protected routes.
- Password-reset workflow.
- Correct, incorrect, and mixed quiz answers.
- Score calculation and result persistence.
- Adaptive difficulty recommendations.
- Topic-wise statistics and quiz history.
- Separation of quiz history between user accounts.
- Question selection when a difficulty has no available unanswered questions.
- Persistence of records after restarting the backend.

Record the actual test results from your latest test run before submitting.

## Internship Assignment Progress

- **Level 1 — Basic Full-Stack Quiz Application:** Main functionality implemented; complete final verification before submission.
- **Level 2 — Adaptive Quiz Engine:** Rule-based difficulty recommendation implemented.
- **Level 3 — Personalized Learning:** Topic-wise performance, learning history, and recommendations implemented.
- **Level 4 — Advanced AI/ML:** A trained ML model or integrated AI tutor has not yet been verified.

## Current Limitations and Future Improvements

- The adaptive engine currently uses predefined rules rather than a trained ML model.
- Recommendation quality depends on the amount and quality of recorded quiz history.
- The question bank should contain enough questions across topics and difficulty levels.
- A future version could include ML-based performance prediction, Bayesian Knowledge Tracing, or an AI-powered learning assistant.
- Deployment configuration and production security should be verified before public release.

## AI Assistance Disclosure

AI development tools were used to assist with code development, debugging, documentation, and implementation planning. The submitted implementation and its capabilities should be reviewed and tested by the developer, who must be able to explain the architecture, algorithms, limitations, and design decisions.

## Repository

GitHub: https://github.com/Priya-6244/Smart-Adaptive-Learning
