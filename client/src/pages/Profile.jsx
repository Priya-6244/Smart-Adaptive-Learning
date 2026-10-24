
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, CalendarDays, Mail, UserRound, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:5000/api'

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!localStorage.getItem('token') || !user) {
      navigate('/login', { replace: true })
    }
  }, [navigate, user])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('You have been logged out')
    navigate('/login', { replace: true })
  }

  if (!user || !localStorage.getItem('token')) {
    return null
  }

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : 'Account active'

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 text-purple-400">
            <Brain size={22} />
            <span className="font-semibold">Smart Adaptive Learning</span>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="h-32 bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-900" />

          <div className="px-6 pb-8 sm:px-9">
            <div className="-mt-12 mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-slate-900 bg-purple-600 text-3xl font-bold">
              {user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="mt-2 text-slate-400">
              View your account information and manage your session.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="mb-3 flex items-center gap-2 text-purple-400">
                  <UserRound size={19} />
                  <span className="text-sm font-medium">Full Name</span>
                </div>
                <p className="break-words font-semibold">{user.name || 'Not provided'}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="mb-3 flex items-center gap-2 text-purple-400">
                  <Mail size={19} />
                  <span className="text-sm font-medium">Email Address</span>
                </div>
                <p className="break-words font-semibold">{user.email || 'Not provided'}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="mb-3 flex items-center gap-2 text-purple-400">
                  <CalendarDays size={19} />
                  <span className="text-sm font-medium">Member Since</span>
                </div>
                <p className="font-semibold">{joinedDate}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="mb-3 flex items-center gap-2 text-purple-400">
                  <BookOpen size={19} />
                  <span className="text-sm font-medium">Learning Space</span>
                </div>
                <p className="font-semibold">Smart Adaptive Learning</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:border-red-500 hover:text-red-400"
              >
                Log Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Profile
