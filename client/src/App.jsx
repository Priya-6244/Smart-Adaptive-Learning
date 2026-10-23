
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Quiz from './pages/Quiz.jsx'
import QuizResult from './pages/QuizResult.jsx'
import QuizHistory from './pages/QuizHistory.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/results" element={<QuizResult />} />
        <Route path="/quiz/history" element={<QuizHistory />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
