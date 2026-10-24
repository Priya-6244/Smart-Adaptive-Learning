
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:5000/api'

function Quiz() {
  const location = useLocation()
  const navigate = useNavigate()

  const topic = location.state?.topic || ''
  const requestedDifficulty = location.state?.difficulty || 'easy'

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeTaken, setTimeTaken] = useState(0)
  const [poolReset, setPoolReset] = useState(false)

  useEffect(() => {
    let active = true

    async function loadQuestions() {
      setLoading(true)

      try {
        const token = localStorage.getItem('token')

        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        const params = new URLSearchParams()

        if (topic) params.set('topic', topic)

        const response = await fetch(
          `${API_URL}/questions?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          if (response.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            toast.error('Your session has expired. Please log in again.')
            navigate('/login', { replace: true })
            return
          }

          throw new Error(data.message || 'Unable to load questions.')
        }

        if (!active) return

        setQuestions(data.questions || [])
        setPoolReset(Boolean(data.poolReset))
        setAnswers({})
        setCurrentIndex(0)
        setTimeTaken(0)

        if (!data.questions?.length) {
          toast.error('No questions are available for this topic.')
        } else if (data.poolReset) {
          toast('The question pool has restarted.')
        }
      } catch (error) {
        if (active) {
          toast.error(error.message || 'Failed to load questions.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadQuestions()

    return () => {
      active = false
    }
  }, [topic, requestedDifficulty, navigate])

  useEffect(() => {
    if (loading || submitting || questions.length === 0) return

    const timer = setInterval(() => {
      setTimeTaken((previous) => previous + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, submitting, questions.length])

  function selectAnswer(questionId, selectedAnswer) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: selectedAnswer,
    }))
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`
  }

  async function handleSubmit() {
    if (submitting) return

    const unanswered = questions.filter(
      (question) => !answers[question._id]
    )

    if (unanswered.length > 0) {
      toast.error(
        `Please answer all questions. ${unanswered.length} remaining.`
      )
      return
    }

    const token = localStorage.getItem('token')

    if (!token) {
      toast.error('Your session has expired. Please log in again.')
      navigate('/login', { replace: true })
      return
    }

    setSubmitting(true)

    try {
      const submittedAnswers = questions.map((question) => ({
        questionId: question._id,
        selectedAnswer: answers[question._id],
      }))

      let user = {}

      try {
        user = JSON.parse(localStorage.getItem('user') || '{}')
      } catch {
        user = {}
      }

      const response = await fetch(`${API_URL}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          learnerName: user.name || 'Learner',
          topic,
          requestedDifficulty,
          timeTakenSeconds: timeTaken,
          answers: submittedAnswers,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        toast.error('Your session has expired. Please log in again.')
        navigate('/login', { replace: true })
        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to submit your quiz.')
      }

      toast.success('Quiz submitted successfully!')

      navigate('/quiz/results', {
        state: {
          result: data,
          topic,
          difficulty: requestedDifficulty,
          timeTakenSeconds: timeTaken,
        },
      })
    } catch (error) {
      toast.error(error.message || 'Quiz submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
          <p className="text-slate-300">Loading your questions...</p>
        </div>
      </main>
    )
  }

  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h1 className="mb-3 text-2xl font-bold">
            No Questions Available
          </h1>
          <p className="mb-6 text-slate-400">
            There are no questions available for this topic yet.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    )
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = Math.round(
    (answeredCount / questions.length) * 100
  )

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            <Clock size={16} className="text-purple-400" />
            {formatTime(timeTaken)}
          </div>
        </header>

        <section className="mb-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-sm text-purple-400">
                SMART ADAPTIVE LEARNING
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {topic || 'Practice Quiz'}
              </h1>
            </div>

            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm capitalize text-purple-300">
              {requestedDifficulty} level
            </span>
          </div>

          <div className="mb-2 flex justify-between text-sm text-slate-400">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>{answeredCount} answered</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {poolReset && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            You have attempted all available questions in this selection.
            The question pool has restarted.
          </div>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-400">
              Question {currentIndex + 1}
            </span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-300">
              {currentQuestion.difficulty || 'mixed'}
            </span>
          </div>

          <h2 className="mb-8 text-xl font-semibold leading-relaxed sm:text-2xl">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const selected = answers[currentQuestion._id] === option

              return (
                <button
                  key={`${currentQuestion._id}-${option}`}
                  type="button"
                  onClick={() =>
                    selectAnswer(currentQuestion._id, option)
                  }
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                    selected
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                      selected
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>

                  <span className="flex-1">{option}</span>

                  {selected && (
                    <CheckCircle
                      size={20}
                      className="shrink-0 text-purple-400"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0 || submitting}
            onClick={() =>
              setCurrentIndex((previous) => previous - 1)
            }
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={18} />
            Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                setCurrentIndex((previous) => previous + 1)
              }
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:opacity-50"
            >
              Next
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </footer>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {questions.map((question, index) => (
            <button
              key={question._id}
              type="button"
              aria-label={`Go to question ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                currentIndex === index
                  ? 'bg-purple-600 text-white'
                  : answers[question._id]
                    ? 'bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}

export default Quiz
