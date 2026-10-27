
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  CircleAlert,
  GraduationCap,
  Lightbulb,
  RefreshCw,
  Target,
} from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

const priorityStyles = {
  'Prerequisite Review': {
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  'High Priority': {
    color: 'border-red-500/40 bg-red-500/10 text-red-300',
  },
  'New Topic': {
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  },
  'Medium Priority': {
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  },
  'Ready to Advance': {
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
}

function ConceptRecommendations() {
  const navigate = useNavigate()

  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRecommendations = useCallback(async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/quiz/concept-recommendations`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        navigate('/login', { replace: true })
        return
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load concept recommendations.'
        )
      }

      setRecommendations(
        Array.isArray(data.recommendations)
          ? data.recommendations
          : []
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <header className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
              <GraduationCap size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Concept Recommendations
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Find out what to study next based on your learning
                performance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchRecommendations}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh recommendations
          </button>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <RefreshCw
              size={30}
              className="mx-auto mb-4 animate-spin text-purple-400"
            />
            <p className="text-slate-300">
              Analysing your learning performance...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="flex items-start gap-3">
              <CircleAlert
                size={22}
                className="mt-1 shrink-0 text-red-300"
              />
              <div>
                <h2 className="font-semibold text-red-200">
                  Could not load recommendations
                </h2>
                <p className="mt-2 text-sm text-red-200/80">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={fetchRecommendations}
                  className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-100 hover:bg-red-500/30"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <BookOpen
              size={36}
              className="mx-auto mb-4 text-purple-300"
            />
            <h2 className="text-xl font-semibold">
              No topics available yet
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
              Add questions to the question bank to make topics
              available for personalised recommendations.
            </p>
            <Link
              to="/quiz"
              className="mt-5 inline-flex rounded-lg bg-purple-600 px-5 py-2.5 font-medium hover:bg-purple-500"
            >
              Go to Quiz
            </Link>
          </div>
        )}

        {!loading && !error && recommendations.length > 0 && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <BookOpen className="mb-3 text-purple-300" size={23} />
                <p className="text-sm text-slate-400">
                  Available topics
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {recommendations.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <Target className="mb-3 text-red-300" size={23} />
                <p className="text-sm text-slate-400">
                  Topics needing attention
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {
                    recommendations.filter(
                      (item) =>
                        item.priority === 'High Priority' ||
                        item.priority === 'Prerequisite Review'
                    ).length
                  }
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <CheckCircle
                  className="mb-3 text-emerald-300"
                  size={23}
                />
                <p className="text-sm text-slate-400">
                  Ready to advance
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {
                    recommendations.filter(
                      (item) =>
                        item.priority === 'Ready to Advance'
                    ).length
                  }
                </p>
              </div>
            </div>

            <div className="mb-5 flex items-center gap-2">
              <Lightbulb size={21} className="text-amber-300" />
              <h2 className="text-xl font-semibold">
                Your learning plan
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {recommendations.map((item) => {
                const priorityStyle =
                  priorityStyles[item.priority]?.color ||
                  'border-slate-700 bg-slate-800 text-slate-300'

                return (
                  <article
                    key={item.topic}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-purple-500/40 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">
                        {item.topic}
                      </h3>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityStyle}`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          Topic accuracy
                        </span>
                        <span className="font-semibold">
                          {item.accuracy === null ||
                          item.accuracy === undefined
                            ? 'Not assessed'
                            : `${item.accuracy}%`}
                        </span>
                      </div>

                      {item.accuracy !== null &&
                        item.accuracy !== undefined && (
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-purple-500 transition-all"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(100, item.accuracy)
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-800/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Why this is recommended
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">
                        {item.reason}
                      </p>
                    </div>

                    {Array.isArray(item.prerequisites) &&
                      item.prerequisites.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-300">
                            Prerequisites
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.prerequisites.map((topic) => (
                              <span
                                key={topic}
                                className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {Array.isArray(item.missingPrerequisites) &&
                      item.missingPrerequisites.length > 0 && (
                        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                          <p className="text-sm font-medium text-amber-200">
                            Review these concepts first
                          </p>
                          <p className="mt-2 text-sm text-slate-300">
                            {item.missingPrerequisites.join(', ')}
                          </p>
                        </div>
                      )}

                    <div className="mt-5">
                      <p className="text-sm font-medium text-purple-300">
                        Recommended next activity
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {item.recommendedActivity}
                      </p>
                    </div>

                    <Link
                      to={`/quiz?topic=${encodeURIComponent(item.topic)}`}
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium transition hover:bg-purple-500"
                    >
                      Practise this topic
                      <ArrowLeft size={15} className="rotate-180" />
                    </Link>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ConceptRecommendations
