
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:5000/api'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      if (!data.token || !data.user) {
        throw new Error('Invalid login response from server')
      }

      // Keep the existing session format for compatibility.
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <span className="rounded-xl bg-purple-600/20 p-3 text-purple-400">
            <Brain size={30} />
          </span>
          <span className="text-xl font-bold">
            Smart Adaptive Learning
          </span>
        </Link>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-9">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-slate-400">
            Sign in to continue your learning journey.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 focus-within:border-purple-500">
                <Mail size={18} className="text-slate-500" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-3.5 text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 focus-within:border-purple-500">
                <LockKeyhole size={18} className="text-slate-500" />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent py-3.5 text-white outline-none placeholder:text-slate-600"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 px-5 py-3.5 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-purple-400 hover:text-purple-300"
            >
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

export default Login
