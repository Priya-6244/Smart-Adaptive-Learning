
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Brain, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:5000/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to process your request')
      }

      setSubmitted(true)
      toast.success('If the account exists, follow the password reset instructions.')
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
          to="/login"
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
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <Mail size={24} />
          </div>

          <h1 className="text-3xl font-bold">Forgot Password?</h1>

          <p className="mt-3 leading-6 text-slate-400">
            Enter the email address associated with your account to request
            password reset instructions.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
              <p className="text-sm leading-6 text-slate-200">
                If an account matches that email, password reset instructions
                will be provided. Check your inbox when email delivery is
                configured.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 focus-within:border-purple-500">
                  <Mail size={18} className="text-slate-500" />

                  <input
                    id="forgot-email"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-purple-600 px-5 py-3.5 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-7 flex items-center justify-center gap-2 text-sm text-purple-400 hover:text-purple-300"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </section>
      </div>
    </main>
  )
}

export default ForgotPassword
