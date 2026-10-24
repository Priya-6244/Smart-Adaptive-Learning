import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  History,
  Target,
  XCircle,
  RefreshCw,
} from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

function QuizHistory() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      const response = await fetch(`${API_URL}/quiz/results`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      let data

try {
  data = await response.json()
} catch {
  throw new Error('The server returned an invalid response. Please try again.')
}

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load quiz history.')
      }

      setResults(data.results || [])
    } catch (err) {
      setError(err.message || 'Failed to load quiz history.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  function formatDate(date) {
    if (!date) return 'Date unavailable'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable'
    }

    return parsedDate.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  function formatTime(seconds = 0) {
    const totalSeconds = Number(seconds) || 0
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60

    return `${minutes}m ${remainingSeconds}s`
  }

  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce(
            (sum, result) =>
              sum + (Number(result.scorePercentage) || 0),
            0
          ) / results.length
        )
      : 0

  const totalQuestions = results.reduce(
    (sum, result) => sum + (Number(result.totalQuestions) || 0),
    0
  )

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mb-5 flex items-center gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>

            <div className="mb-2 flex items-center gap-2 text-purple-400">
              <History size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Learning Activity
              </span>
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Quiz History
            </h1>

            <p className="mt-2 text-slate-400">
              Review your previous attempts and track your progress.
            </p>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm transition hover:bg-slate-900 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </header>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            Loading your quiz history...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-slate-900 p-6 text-center">
            <p className="mb-4 text-red-300">{error}</p>

            <button
              type="button"
              onClick={loadHistory}
              className="rounded-xl bg-purple-600 px-5 py-3 font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <BookOpen
              className="mx-auto mb-4 text-purple-400"
              size={40}
            />

            <h2 className="text-xl font-bold">
              No quiz attempts yet
            </h2>

            <p className="mt-2 text-slate-400">
              Complete your first quiz to see your results here.
            </p>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-6 rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
            >
              Start Learning
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <History className="mb-3 text-purple-400" size={22} />
                <p className="text-sm text-slate-400">Total Attempts</p>
                <p className="mt-1 text-3xl font-bold">
                  {results.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <Target className="mb-3 text-emerald-400" size={22} />
                <p className="text-sm text-slate-400">Average Score</p>
                <p className="mt-1 text-3xl font-bold">
                  {averageScore}%
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <BookOpen className="mb-3 text-blue-400" size={22} />
                <p className="text-sm text-slate-400">Questions Answered</p>
                <p className="mt-1 text-3xl font-bold">
                  {totalQuestions}
                </p>
              </div>
            </div>

            {results.map((result, index) => {
              const percentage = Math.min(
                100,
                Math.max(0, Number(result.scorePercentage) || 0)
              )

              return (
                <article
                  key={result._id || index}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
                >
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                        Attempt #{results.length - index}
                      </p>

                      <h2 className="text-xl font-bold">
                        {result.topic || 'General Quiz'}
                      </h2>

                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                        <CalendarDays size={15} />
                        {formatDate(result.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        percentage >= 80
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : percentage >= 40
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-red-500/10 text-red-300'
                      }`}
                    >
                      {percentage}% score
                    </span>
                  </div>

                  <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle
                        className="text-emerald-400"
                        size={20}
                      />
                      <div>
                        <p className="text-lg font-semibold">
                          {result.correctAnswers ?? 0}/
                          {result.totalQuestions ?? 0}
                        </p>
                        <p className="text-xs text-slate-400">
                          Correct answers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <BookOpen className="text-blue-400" size={20} />
                      <div>
                        <p className="text-lg font-semibold capitalize">
                          {result.difficulty || 'easy'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Quiz difficulty
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="text-purple-400" size={20} />
                      <div>
                        <p className="text-lg font-semibold">
                          {formatTime(result.timeTakenSeconds)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Time taken
                        </p>
                      </div>
                    </div>
                  </div>

                  {result.recommendedDifficulty && (
                    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-sm text-slate-400">
                        Recommended next level
                      </p>
                      <p className="mt-1 font-semibold capitalize text-purple-300">
                        {result.recommendedDifficulty}
                      </p>
                    </div>
                  )}

                  {Array.isArray(result.responses) &&
                    result.responses.length > 0 && (
                      <details className="mt-5">
                        <summary className="cursor-pointer text-sm font-semibold text-purple-300 hover:text-purple-200">
                          Review answers and explanations
                        </summary>

                        <div className="mt-4 space-y-4">
                          {result.responses.map((answer, answerIndex) => (
                            <div
                              key={answer.questionId || answerIndex}
                              className="rounded-xl border border-slate-800 p-4"
                            >
                              <p className="mb-3 font-medium">
                                {answerIndex + 1}. {answer.questionText}
                              </p>

                              <p
                                className={`flex items-start gap-2 text-sm ${
                                  answer.isCorrect
                                    ? 'text-emerald-300'
                                    : 'text-red-300'
                                }`}
                              >
                                {answer.isCorrect ? (
                                  <CheckCircle
                                    size={17}
                                    className="mt-0.5 shrink-0"
                                  />
                                ) : (
                                  <XCircle
                                    size={17}
                                    className="mt-0.5 shrink-0"
                                  />
                                )}

                                Your answer: {answer.selectedAnswer}
                              </p>

                              {!answer.isCorrect && (
                                <p className="mt-2 text-sm text-emerald-300">
                                  Correct answer: {answer.correctAnswer}
                                </p>
                              )}

                              <p className="mt-3 text-sm leading-6 text-slate-400">
                                Explanation: {answer.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export default QuizHistory