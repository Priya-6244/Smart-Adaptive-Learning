
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  BookOpen,
  Brain,
  TrendingUp,
} from 'lucide-react'

function QuizResult() {
  const navigate = useNavigate()
  const location = useLocation()

  const result = location.state?.result
  const topic = location.state?.topic || result?.results?.[0]?.topic || ''

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-white">
        <BookOpen size={42} className="text-purple-400" />
        <h1 className="text-2xl font-bold">No quiz results found</h1>
        <p className="text-slate-400">
          Please complete a quiz to view your results.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const {
    score = 0,
    totalQuestions = 0,
    percentage = 0,
    results = [],
    currentDifficulty = 'easy',
    recommendedDifficulty = 'easy',
  } = result

  const difficultyMessage = {
    easy: 'Focus on building your fundamentals with easier questions.',
    medium: 'Continue practising at the intermediate level to strengthen your knowledge.',
    hard: 'Challenge yourself with advanced questions to deepen your knowledge.',
  }

  const difficultyStyle = {
    easy: 'text-green-400 border-green-500/30 bg-green-500/10',
    medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    hard: 'text-red-400 border-red-500/30 bg-red-500/10',
  }

  function practiseNextLevel() {
    navigate('/quiz', {
      state: {
        topic,
        difficulty: recommendedDifficulty,
      },
    })
  }

  function takeAnotherQuiz() {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <section className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950 to-slate-900 p-8 text-center sm:p-12">
          <Trophy size={52} className="mx-auto mb-4 text-yellow-400" />

          <p className="text-sm font-semibold tracking-widest text-purple-300">
            QUIZ COMPLETED
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Your Results
          </h1>

          {topic && (
            <p className="mt-3 text-slate-300">
              Topic: <span className="font-semibold text-white">{topic}</span>
            </p>
          )}

          <div className="mx-auto my-8 flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-purple-500/50 bg-slate-950">
            <span className="text-4xl font-bold">{percentage}%</span>
            <span className="mt-1 text-sm text-slate-400">Score</span>
          </div>

          <p className="text-lg text-slate-300">
            You answered{' '}
            <span className="font-bold text-white">{score}</span> out of{' '}
            <span className="font-bold text-white">{totalQuestions}</span>{' '}
            questions correctly.
          </p>

          <p className="mt-3 text-slate-400">
            {percentage >= 80
              ? 'Excellent work! You have a strong understanding of these questions.'
              : percentage >= 50
                ? 'Good effort! Review the explanations to improve further.'
                : 'Keep practising! Review the explanations and try again.'}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-purple-500/30 bg-slate-900 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-purple-500/15 p-3">
              <Brain className="text-purple-400" size={28} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-purple-300">
                ADAPTIVE LEARNING RECOMMENDATION
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Your next level:{' '}
                {recommendedDifficulty.toUpperCase()}
              </h2>

              <p className="mt-2 text-slate-400">
                You completed this quiz at the{' '}
                <span className="font-semibold capitalize text-white">
                  {currentDifficulty}
                </span>{' '}
                level.
              </p>

              <div
                className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-semibold capitalize ${
                  difficultyStyle[recommendedDifficulty] || difficultyStyle.easy
                }`}
              >
                Recommended: {recommendedDifficulty}
              </div>

              <p className="mt-4 leading-relaxed text-slate-300">
                {difficultyMessage[recommendedDifficulty] ||
                  difficultyMessage.easy}
              </p>

              <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <TrendingUp size={17} />
                Recommendation based on your quiz performance.
              </p>

              <button
                onClick={practiseNextLevel}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500"
              >
                <RotateCcw size={18} />
                Practise Next Level
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-bold">Answer Review</h2>

          <div className="space-y-5">
            {results.map((item, index) => (
              <article
                key={item.questionId || index}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="mb-4 flex items-start gap-3">
                  {item.isCorrect ? (
                    <CheckCircle
                      className="mt-1 shrink-0 text-green-400"
                      size={22}
                    />
                  ) : (
                    <XCircle
                      className="mt-1 shrink-0 text-red-400"
                      size={22}
                    />
                  )}

                  <div className="flex-1">
                    <p className="mb-2 text-sm capitalize text-slate-400">
                      Question {index + 1} · {item.topic} · {item.difficulty}
                    </p>

                    <h3 className="text-lg font-semibold leading-relaxed">
                      {item.questionText}
                    </h3>
                  </div>
                </div>

                <div className="ml-8 space-y-3 text-sm">
                  <p className="text-slate-300">
                    Your answer:{' '}
                    <span
                      className={
                        item.isCorrect
                          ? 'font-semibold text-green-400'
                          : 'font-semibold text-red-400'
                      }
                    >
                      {item.selectedAnswer}
                    </span>
                  </p>

                  {!item.isCorrect && (
                    <p className="text-slate-300">
                      Correct answer:{' '}
                      <span className="font-semibold text-green-400">
                        {item.correctAnswer}
                      </span>
                    </p>
                  )}

                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <p className="mb-1 font-semibold text-purple-300">
                      Explanation
                    </p>
                    <p className="leading-relaxed text-slate-300">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={takeAnotherQuiz}
            className="rounded-lg border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-900"
          >
            <BookOpen size={18} className="mr-2 inline" />
            Choose Another Topic
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-900"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizResult
