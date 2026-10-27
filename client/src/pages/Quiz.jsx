
import { useEffect, useRef, useState } from 'react'
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
const QUIZ_LENGTH = 10

function Quiz() {
  const location = useLocation()
  const navigate = useNavigate()

  const searchParams = new URLSearchParams(location.search)

const topic =
  location.state?.topic ||
  searchParams.get('topic') ||
  ''

const requestedDifficulty =
  location.state?.difficulty ||
  searchParams.get('difficulty') ||
  'medium'

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeTaken, setTimeTaken] = useState(0)
  const [currentDifficulty, setCurrentDifficulty] = useState('medium')
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [answerFeedback, setAnswerFeedback] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [quizEnded, setQuizEnded] = useState(false)

  const questionRequestInProgress = useRef(false)
  const answerRequestInProgress = useRef(false)
  const finishRequestInProgress = useRef(false)

  const token = () => localStorage.getItem('token')

  async function handleUnauthorized(response) {
    if (response.status !== 401) return false

    localStorage.removeItem('token')
    localStorage.removeItem('user')

    toast.error('Your session has expired. Please log in again.')
    navigate('/login', { replace: true })

    return true
  }

  async function loadNextQuestion() {
    if (questionRequestInProgress.current || quizEnded) {
      return
    }

    questionRequestInProgress.current = true

    const authToken = token()

    if (!authToken) {
      questionRequestInProgress.current = false
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams({ topic })

      const response = await fetch(
        `${API_URL}/questions/next?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )

      const data = await response.json()

      if (await handleUnauthorized(response)) return

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load the next question.'
        )
      }

      setCurrentDifficulty(data.currentDifficulty || 'medium')

      if (data.completed || !data.question) {
        setQuizEnded(true)

        if (questions.length === 0) {
          toast.error(
            'No unanswered questions are available for this topic.'
          )
        } else {
          toast('No more unanswered questions are available.')
        }

        return
      }

      const newQuestionId = String(data.question._id)

      // Do not display the same question twice in one quiz.
      const alreadyLoaded = questions.some(
        (question) => String(question._id) === newQuestionId
      )

      if (alreadyLoaded) {
        setQuizEnded(true)
        toast.error(
          'The server returned a question already used in this quiz. Please finish with your saved answers.'
        )
        return
      }

      setQuestions((previous) => {
        // Final safeguard against duplicate IDs.
        if (
          previous.some(
            (question) => String(question._id) === newQuestionId
          )
        ) {
          return previous
        }

        const nextQuestions = [...previous, data.question]
        setCurrentIndex(nextQuestions.length - 1)

        return nextQuestions
      })

      setSelectedAnswer('')
      setAnswerFeedback(null)
      setHasAnswered(false)
    } catch (error) {
      toast.error(
        error.message || 'Failed to load the next question.'
      )
    } finally {
      questionRequestInProgress.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!topic) {
      toast.error('Please select a topic first.')
      navigate('/dashboard', { replace: true })
      return
    }

    setQuestions([])
    setAnswers({})
    setCurrentIndex(0)
    setTimeTaken(0)
    setCurrentDifficulty(requestedDifficulty)
    setSelectedAnswer('')
    setAnswerFeedback(null)
    setHasAnswered(false)
    setQuizEnded(false)

    loadNextQuestion()

    // The request lock prevents overlapping question requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, navigate])

  useEffect(() => {
    if (loading || submitting || quizEnded || questions.length === 0) {
      return
    }

    const timer = setInterval(() => {
      setTimeTaken((previous) => previous + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, submitting, quizEnded, questions.length])

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`
  }

  async function handleAnswerSubmit() {
    if (
      !selectedAnswer ||
      submitting ||
      hasAnswered ||
      answerRequestInProgress.current
    ) {
      return
    }

    const currentQuestion = questions[currentIndex]

    if (!currentQuestion) return

    const authToken = token()

    if (!authToken) {
      navigate('/login', { replace: true })
      return
    }

    answerRequestInProgress.current = true
    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/quiz/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic,
          questionId: currentQuestion._id,
          selectedAnswer,
        }),
      })

      const data = await response.json()

      if (await handleUnauthorized(response)) return

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to evaluate your answer.'
        )
      }

      setAnswers((previous) => ({
        ...previous,
        [String(currentQuestion._id)]: selectedAnswer,
      }))

      setAnswerFeedback(data)
      setHasAnswered(true)
      setCurrentDifficulty(
        data.currentDifficulty || currentDifficulty
      )

      if (data.isCorrect) {
        toast.success('Correct answer!')
      } else {
        toast.error('Not quite. Review the correct answer below.')
      }

      if (data.difficultyChanged) {
        toast(
          `Your next question will be at ${data.currentDifficulty.toUpperCase()} difficulty.`
        )
      }
    } catch (error) {
      toast.error(
        error.message || 'Failed to evaluate your answer.'
      )
    } finally {
      answerRequestInProgress.current = false
      setSubmitting(false)
    }
  }

  async function handleNext() {
    if (!hasAnswered || submitting || loading) return

    if (Object.keys(answers).length >= QUIZ_LENGTH) {
      setQuizEnded(true)
      return
    }

    await loadNextQuestion()
  }

  async function handleFinish() {
    if (submitting || finishRequestInProgress.current) return

    // Build a unique list by question ID before submitting.
    const uniqueQuestions = [
      ...new Map(
        questions.map((question) => [
          String(question._id),
          question,
        ])
      ).values(),
    ]

    const submittedAnswers = uniqueQuestions
      .filter((question) => {
        return Boolean(answers[String(question._id)])
      })
      .map((question) => ({
        questionId: question._id,
        selectedAnswer: answers[String(question._id)],
      }))

    if (submittedAnswers.length === 0) {
      toast.error('Answer at least one question before finishing.')
      return
    }

    const authToken = token()

    if (!authToken) {
      navigate('/login', { replace: true })
      return
    }

    finishRequestInProgress.current = true
    setSubmitting(true)

    try {
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
          Authorization: `Bearer ${authToken}`,
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

      if (await handleUnauthorized(response)) return

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to submit your quiz.'
        )
      }

      toast.success('Quiz submitted successfully!')

      navigate('/quiz/results', {
        state: {
          result: data,
          topic,
          difficulty: currentDifficulty,
          timeTakenSeconds: timeTaken,
        },
      })
    } catch (error) {
      toast.error(error.message || 'Quiz submission failed.')
    } finally {
      finishRequestInProgress.current = false
      setSubmitting(false)
    }
  }

  if (loading && questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
          <p className="text-slate-300">Loading your question...</p>
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
    (answeredCount / QUIZ_LENGTH) * 100
  )

  const shouldFinish =
    quizEnded || answeredCount >= QUIZ_LENGTH

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
              {currentDifficulty} level
            </span>
          </div>

          <div className="mb-2 flex justify-between text-sm text-slate-400">
            <span>
              Question {Math.min(answeredCount + 1, QUIZ_LENGTH)} of{' '}
              {QUIZ_LENGTH}
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

        {loading && (
          <div className="mb-5 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
            Loading your next question...
          </div>
        )}

        {!currentQuestion && quizEnded ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">
              Quiz Questions Completed
            </h2>

            <p className="mb-6 text-slate-400">
              You answered {answeredCount} question(s). Submit your
              answers to view your results.
            </p>

            <button
              type="button"
              disabled={submitting}
              onClick={handleFinish}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold transition hover:bg-emerald-500 disabled:opacity-50"
            >
              <Send size={18} />
              {submitting ? 'Submitting...' : 'View Results'}
            </button>
          </section>
        ) : currentQuestion ? (
          <>
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">
                  Question {currentIndex + 1}
                </span>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-300">
                  {currentQuestion.difficulty || currentDifficulty}
                </span>
              </div>

              <h2 className="mb-8 text-xl font-semibold leading-relaxed sm:text-2xl">
                {currentQuestion.questionText}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const selected = selectedAnswer === option

                  const isCorrectOption =
                    hasAnswered &&
                    answerFeedback?.correctAnswer === option

                  const isWrongSelection =
                    hasAnswered &&
                    selected &&
                    !answerFeedback?.isCorrect

                  let optionClass =
                    'border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-500'

                  if (selected && !hasAnswered) {
                    optionClass =
                      'border-purple-500 bg-purple-500/10 text-white'
                  } else if (isCorrectOption) {
                    optionClass =
                      'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                  } else if (isWrongSelection) {
                    optionClass =
                      'border-red-500 bg-red-500/10 text-red-200'
                  }

                  return (
                    <button
                      key={`${currentQuestion._id}-${option}`}
                      type="button"
                      disabled={
                        hasAnswered || submitting || loading
                      }
                      onClick={() => setSelectedAnswer(option)}
                      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition disabled:cursor-default ${optionClass}`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                          isCorrectOption
                            ? 'bg-emerald-600 text-white'
                            : isWrongSelection
                              ? 'bg-red-600 text-white'
                              : selected
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span className="flex-1">{option}</span>

                      {(selected || isCorrectOption) && (
                        <CheckCircle
                          size={20}
                          className={
                            isCorrectOption
                              ? 'shrink-0 text-emerald-400'
                              : isWrongSelection
                                ? 'shrink-0 text-red-400'
                                : 'shrink-0 text-purple-400'
                          }
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {hasAnswered && answerFeedback && (
                <div
                  className={`mt-6 rounded-xl border p-4 ${
                    answerFeedback.isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-red-500/30 bg-red-500/10'
                  }`}
                >
                  <h3 className="mb-2 font-semibold">
                    {answerFeedback.isCorrect
                      ? 'Correct!'
                      : 'Incorrect'}
                  </h3>

                  <p className="mb-2 text-sm text-slate-200">
                    Correct answer: {answerFeedback.correctAnswer}
                  </p>

                  {answerFeedback.explanation && (
                    <p className="text-sm leading-relaxed text-slate-300">
                      {answerFeedback.explanation}
                    </p>
                  )}

                  {answerFeedback.difficultyChanged && (
                    <p className="mt-3 text-sm font-semibold text-purple-300">
                      Your next question will be at{' '}
                      {answerFeedback.currentDifficulty} difficulty.
                    </p>
                  )}
                </div>
              )}
            </section>

            <footer className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {!hasAnswered ? (
                <button
                  type="button"
                  disabled={!selectedAnswer || submitting || loading}
                  onClick={handleAnswerSubmit}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle size={18} />
                  {submitting ? 'Checking Answer...' : 'Submit Answer'}
                </button>
              ) : shouldFinish ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinish}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={18} />
                  {submitting ? 'Submitting...' : 'Finish Quiz'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting || loading}
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next Question
                  <ArrowRight size={18} />
                </button>
              )}
            </footer>
          </>
        ) : null}
      </div>
    </main>
  )
}

export default Quiz
