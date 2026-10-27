# Smart Adaptive Learning Application

A full-stack web application that helps students practise quiz questions, track their learning progress, identify weak topics, and receive personalized difficulty and concept recommendations.

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
- Quiz attempts and responses saved in the database.
- Quiz history for authenticated learners.

### 3. Adaptive Quiz Engine
- Supports Easy, Medium, and Hard difficulty levels.
- Uses quiz performance to recommend the next difficulty.
- Selects questions according to the recommended difficulty when suitable questions are available.
- Avoids previously attempted questions where possible.
- Handles unavailable questions and question-pool resets.

### 4. Personalized Learning
- Topic-wise performance analysis.
- Overall accuracy and quiz statistics.
- Identification of strong and weak topics.
- Personalized recommendations for revision and further practice.
- Dashboard displaying progress and previous quiz results.

### 5. Intelligent Concept Recommendation Engine
- Generates topic recommendations using learner performance and prerequisite information.
- Uses a dedicated concept recommendation service.
- Provides a backend API for concept recommendations.
- Supports prerequisite relationships between topics.
- Displays recommendations through a dedicated frontend page.
- Connects recommended topics to topic-specific quiz practice.
- Supports recommendations for new learners without quiz history.

The recommendation engine is rule-based. It should not be described as a trained machine-learning model unless such a model is separately implemented and verified.

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
3. Mongoose communicates with MongoDB to retrieve questions and store application records.
4. The backend evaluates quiz answers, calculates scores, and manages adaptive difficulty.
5. The recommendation service uses learner performance and topic prerequisites to generate learning recommendations.
6. The frontend displays quiz results, learning progress, quiz history, and concept recommendations.

## Adaptive Algorithm

The adaptive quiz engine uses predefined rules rather than a trained machine-learning model.

The documented scoring logic considers the current quiz score and the average score of up to three previous attempts on the same topic.

The adjusted score combines:
- 70% of the current quiz score.
- 30% of the average of the available previous quiz scores.

The difficulty recommendation follows these rules:

- Below 40% adjusted performance: reduce difficulty where possible.
- At or above 80% adjusted performance: increase difficulty where possible.
- Otherwise: retain the current difficulty.

The recommended difficulty is bounded by Easy and Hard. If suitable unanswered questions are unavailable, the application can select questions from other difficulty levels or restart the question pool.

The exact relationship between the scoring logic and question selection should be verified against the current implementation before submission.

## Concept Recommendation Logic

The Intelligent Concept Recommendation Engine uses topic performance and prerequisite information to help determine what a learner should study next.

Topic prerequisite records describe dependencies between concepts. For example:

- Web Development depends on JavaScript.
- Machine Learning depends on Data Structures and Databases.

The recommendation service evaluates learner performance and prerequisite relationships to generate topic recommendations. The frontend displays these recommendations and provides navigation to practice the selected topic.

The recommendation engine is a rule-based system, not a trained AI model. Its quality depends on the accuracy of learner performance data, prerequisite definitions, and the available question bank.

## Database Design

The application uses MongoDB for persistent storage.

The main collections and records include:

- **Users:** learner names, email addresses, password hashes, and authentication-related fields.
- **Questions:** question statements, answer options, correct answers, explanations, topics, and difficulty levels.
- **Quiz Results:** learner references, scores, selected answers, correctness, question details, and recommended difficulty.
- **Adaptive Progress:** learner-specific progress, current difficulty, and attempted question identifiers.
- **Topic Prerequisites:** topic names and prerequisite topic relationships.

The exact fields depend on the schemas defined in the source code. Verify the current model files before treating this list as an exhaustive database specification.

## Project Structure

```text
Smart-Adaptive-Learning/
├── client/
│   └── src/
├── server/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── tests/
├── .gitignore
└── README.md
```

## Prerequisites

Install the following:

- Node.js and npm.
- Git.
- MongoDB Community Server or access to a MongoDB instance.

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

Create a `server/.env` file and configure the variables required by the backend.

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_adaptive_learning
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_email_address
EMAIL_APP_PASSWORD=your_email_app_password
```

Use the exact environment variable names expected by the current backend code. Configure email credentials only if required for the features being tested.

Never commit `.env` files, passwords, JWT secrets, or API keys to GitHub.

### 4. Start MongoDB

Ensure that MongoDB is running and that the configured connection string is correct.

### 5. Start the backend

From the `server` directory, run:

```bash
npm run dev
```

The backend should start on the configured port, normally port 5000.

### 6. Install frontend dependencies

Open a second terminal at the project root and run:

```bash
cd client
npm install
```

### 7. Start the frontend

From the `client` directory, run:

```bash
npm run dev
```

Open the local URL displayed by Vite, normally:

http://localhost:5173

If the port is occupied, Vite may select another port.

### 8. Initialize questions and prerequisites

Ensure that the required question records and topic prerequisite records exist in MongoDB.

Use the repository's seed scripts or documented initialization process if available. If no seed script exists, document the procedure for adding the required records.

## Testing

Run backend automated tests from the `server` directory:

```bash
npm test
```

The backend test suite has passed in the development environment. Record the actual test count and results from the final test run before submission.

Recommended scenarios to verify include:

- Successful signup and login.
- Invalid credentials and protected routes.
- Password-reset workflow.
- Correct, incorrect, and mixed quiz answers.
- Score calculation and result persistence.
- Adaptive difficulty recommendations.
- Topic-wise statistics and quiz history.
- Separation of quiz history between user accounts.
- Question selection when a difficulty has no unanswered questions.
- Prerequisite-aware concept recommendations.
- Recommendations for users without quiz history.
- Topic-specific practice navigation.
- Persistence of records after restarting the backend.

## Internship Assignment Progress

Update these statuses only after comparing the implementation with the official requirements for each level.

- **Level 1 — Basic Full-Stack Quiz Application:** Main functionality implemented; final verification against the official requirements is required.
- **Level 2 — Adaptive Quiz Engine:** Rule-based difficulty recommendation implemented; verify all required scenarios.
- **Level 3 — Personalized Learning:** Topic performance, learning history, and recommendations implemented; verify against the official rubric.
- **Level 4 — Intelligent Concept Recommendation Engine:** Core recommendation service, prerequisite data, backend endpoint, frontend integration, and topic-specific practice navigation implemented. Functional checks and backend tests have passed in the development environment. Final verification against the official Level 4 requirements remains necessary.

## Current Limitations

- The adaptive quiz engine uses predefined rules rather than a trained machine-learning model.
- Recommendation quality depends on the amount and quality of recorded quiz history.
- Recommendation quality also depends on accurate prerequisite definitions.
- The question bank should contain sufficient questions across topics and difficulty levels.
- Production deployment, security configuration, and public accessibility require separate verification.
- The project should be tested using a fresh installation and database before final submission.

## AI Assistance Disclosure

AI development tools were used to assist with code development, debugging, documentation, and implementation planning. The developer is responsible for reviewing and testing the submitted implementation and should be prepared to explain its architecture, algorithms, limitations, and design decisions.

## Demonstration Video

 Demonstration video showing:

- User signup and login.
- Quiz practice and submission.
- Adaptive difficulty behavior.
- Dashboard and learning statistics.
- Concept recommendations and prerequisite-aware learning.
- The application running with its frontend, backend, and database.



**Demonstration video:** Add the verified Google Drive link here.

## GitHub Repository

https://github.com/Priya-6244/Smart-Adaptive-Learning
