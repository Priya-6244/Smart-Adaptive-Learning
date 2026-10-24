
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  CheckCircle,
  ChartNoAxesCombined,
  Clock,
  Target,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  History,
  UserRound,
} from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

function Dashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [topics, setTopics] = useState([])
  const [performance, setPerformance] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      navigate('/login', { replace: true })
      return
    }

    try {
      const requestOptions = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      const [
        statsResponse,
        topicsResponse,
        recommendationResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/quiz/stats`, requestOptions),
        fetch(`${API_URL}/questions/topics`, requestOptions),
        fetch(`${API_URL}/quiz/recommendations`, requestOptions),
      ])

      if (
        statsResponse.status === 401 ||
        topicsResponse.status === 401 ||
        recommendationResponse.status === 401
      ) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }

      if (
        !statsResponse.ok ||
        !topicsResponse.ok ||
        !recommendationResponse.ok
      ) {
        throw new Error('Unable to load dashboard data.')
      }

      const statsData = await statsResponse.json()
      const topicsData = await topicsResponse.json()
      const recommendationData = await recommendationResponse.json()

      if (
        !statsData.success ||
        !topicsData.success ||
        !recommendationData.success
      ) {
        throw new Error('The server could not return dashboard data.')
      }

      setStats(statsData)
      setTopics(topicsData.topics || [])
      setPerformance(recommendationData.topicPerformance || [])

      setSelectedTopic((previous) =>
        topicsData.topics?.includes(previous)
          ? previous
          : topicsData.topics?.[0] || ''
      )
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  function startQuiz(topicName) {
    if (!topicName) return

    navigate('/quiz', {
      state: {
        topic: topicName,
        difficulty: stats?.currentLevel || 'easy',
      },
    })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-slate-300">
            Loading your learning dashboard...
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-8 text-center">
          <h1 className="mb-3 text-xl font-bold">
            Dashboard could not load
          </h1>

          <p className="mb-5 text-slate-400">{error}</p>

          <button
            onClick={loadDashboard}
            className="rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
          >
            Try Again
          </button>
        </div>
      </main>
    )
  }

  const cards = [
    {
      label: 'Topics Available',
      value: stats?.topicsAvailable ?? 0,
      icon: BookOpen,
      color: 'text-blue-400',
    },
    {
      label: 'Questions Answered',
      value: stats?.questionsAnswered ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
    {
      label: 'Overall Accuracy',
      value: `${stats?.accuracy ?? 0}%`,
      icon: Target,
      color: 'text-purple-400',
    },
    {
      label: 'Quiz Attempts',
      value: stats?.quizAttempts ?? 0,
      icon: ChartNoAxesCombined,
      color: 'text-amber-400',
    },
  ]

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-purple-400">
              <Brain size={18} />
              Smart Adaptive Learning
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Your Learning Dashboard
            </h1>

            <p className="mt-2 text-slate-400">
              Learn at your pace. Improve with every quiz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/quiz/history')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-purple-500 hover:bg-slate-900 hover:text-white"
            >
              <History size={17} />
              Quiz History
            </button>

            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-purple-500 hover:bg-slate-900 hover:text-white"
            >
              <UserRound size={17} />
              Profile
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm text-slate-400">{label}</span>
                <Icon size={21} className={color} />
              </div>

              <p className="text-3xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400">
                <TrendingUp size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Topic-wise Performance
                </h2>

                <p className="text-sm text-slate-400">
                  Discover your strengths and areas for improvement.
                </p>
              </div>
            </div>

            {performance.length === 0 ? (
              <p className="rounded-xl bg-slate-950 p-4 text-slate-400">
                No topics are available yet.
              </p>
            ) : (
              <div className="space-y-5">
                {performance.map((item) => (
                  <div key={item.topic}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{item.topic}</span>

                      <span className="text-sm text-slate-400">
                        {item.accuracy === null
                          ? 'Not attempted'
                          : `${item.accuracy}% accuracy`}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-500"
                        style={{
                          width: `${item.accuracy ?? 0}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {item.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 to-slate-900 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
              <Brain size={25} />
            </div>

            <h2 className="text-xl font-bold">
              Your Next Learning Step
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Choose a topic to practise. Your saved quiz results help
              identify areas that need more work.
            </p>

            <label
              htmlFor="topic-select"
              className="mb-2 mt-6 block text-sm font-medium text-slate-300"
            >
              Select a topic
            </label>

            <select
              id="topic-select"
              value={selectedTopic}
              onChange={(event) => setSelectedTopic(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-purple-500"
            >
              {topics.map((topicName) => (
                <option key={topicName} value={topicName}>
                  {topicName}
                </option>
              ))}
            </select>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <Clock className="shrink-0 text-purple-400" size={21} />

              <div>
                <p className="text-sm text-slate-400">
                  Recommended difficulty
                </p>

                <p className="font-semibold capitalize">
                  {stats?.currentLevel || 'easy'}
                </p>
              </div>
            </div>

            <button
              onClick={() => startQuiz(selectedTopic)}
              disabled={!selectedTopic}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Learning
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-2 text-xl font-bold">
            Personalized Recommendations
          </h2>

          <p className="mb-5 text-sm text-slate-400">
            Topics needing improvement appear first.
          </p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {performance.map((item) => (
              <article
                key={item.topic}
                className="rounded-xl border border-slate-800 bg-slate-950 p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{item.topic}</h3>

                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                    {item.accuracy === null
                      ? 'New topic'
                      : `${item.accuracy}%`}
                  </span>
                </div>

                <p className="mb-5 min-h-10 text-sm leading-5 text-slate-400">
                  {item.recommendation}
                </p>

                <button
                  onClick={() => startQuiz(item.topic)}
                  className="flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300"
                >
                  Practise topic
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div>
            <h2 className="font-semibold">
              Review your learning progress
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Revisit previous scores and answer explanations.
            </p>
          </div>

          <button
            onClick={() => navigate('/quiz/history')}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500"
          >
            View Quiz History
            <ArrowRight size={17} />
          </button>
        </footer>
      </div>
    </main>
  )
}

export default Dashboard
