
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Brain,
  CalendarDays,
  Mail,
  UserRound,
  BookOpen,
  LockKeyhole,
  Eye,
  EyeOff
} from 'lucide-react'
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

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [saving, setSaving] = useState(false)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token') || !user) {
      navigate('/login', { replace: true })
    }
  }, [navigate, user])

  async function handleSaveProfile(event) {
    event.preventDefault()

    const name = editedName.trim()

    if (name.length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }

    if (name.length > 80) {
      toast.error('Name must be 80 characters or fewer')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
        }

        throw new Error(data.message || 'Unable to update profile')
      }

      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      setIsEditing(false)

      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault()

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      toast.error('New password must differ from your current password')
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
        }

        throw new Error(data.message || 'Unable to change password')
      }

      // The backend invalidates the existing token after this change.
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setShowPasswordForm(false)

      toast.success('Password changed. Please log in again.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)

    const token = localStorage.getItem('token')
    let serverLogoutSucceeded = false

    try {
      if (token) {
        const response = await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          serverLogoutSucceeded = true
        } else {
          const data = await response.json().catch(() => ({}))
          console.error(
            'Server logout failed:',
            data.message || response.statusText
          )
        }
      }
    } catch (error) {
      console.error('Server logout request failed:', error)
    } finally {
      // Always clear local authentication information.
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Clear password form values.
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setShowPasswordForm(false)

      // Clear profile editing state.
      setIsEditing(false)
      setEditedName('')

      setLoggingOut(false)

      if (serverLogoutSucceeded) {
        toast.success('You have been logged out')
      } else {
        toast.error(
          'Logged out on this browser. Server logout could not be confirmed.'
        )
      }

      navigate('/login', { replace: true })
    }
  }

  function renderPasswordField({
    id,
    label,
    value,
    setValue,
    visible,
    setVisible,
    autoComplete
  }) {
    return (
      <div>
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          {label}
        </label>

        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 focus-within:border-purple-500">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete={autoComplete}
            required
            minLength={
              id === 'newPassword' || id === 'confirmPassword'
                ? 8
                : undefined
            }
            className="w-full bg-transparent py-3 text-white outline-none"
            placeholder={`Enter ${label.toLowerCase()}`}
          />

          <button
            type="button"
            onClick={() => setVisible((previous) => !previous)}
            aria-label={visible ? `Hide ${label}` : `Show ${label}`}
            className="text-slate-400 hover:text-white"
          >
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>
    )
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
            <span className="font-semibold">
              Smart Adaptive Learning
            </span>
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

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-3">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(event) => setEditedName(event.target.value)}
                      placeholder="Enter your full name"
                      minLength={2}
                      maxLength={80}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-purple-500"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500 disabled:opacity-60"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditedName(user.name || '')
                          setIsEditing(false)
                        }}
                        disabled={saving}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="break-words font-semibold">
                      {user.name || 'Not provided'}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setEditedName(user.name || '')
                        setIsEditing(true)
                      }}
                      className="text-sm font-medium text-purple-400 hover:text-purple-300"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="mb-3 flex items-center gap-2 text-purple-400">
                  <Mail size={19} />
                  <span className="text-sm font-medium">Email Address</span>
                </div>
                <p className="break-words font-semibold">
                  {user.email || 'Not provided'}
                </p>
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

            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-600/20 p-3 text-purple-400">
                    <LockKeyhole size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">Change Password</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Keep your account secure by updating your password.
                    </p>
                  </div>
                </div>

                {!showPasswordForm && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    className="rounded-xl border border-purple-500/40 px-4 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-600/10"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form
                  onSubmit={handleChangePassword}
                  className="mt-6 space-y-5"
                >
                  {renderPasswordField({
                    id: 'currentPassword',
                    label: 'Current password',
                    value: currentPassword,
                    setValue: setCurrentPassword,
                    visible: showCurrentPassword,
                    setVisible: setShowCurrentPassword,
                    autoComplete: 'current-password'
                  })}

                  {renderPasswordField({
                    id: 'newPassword',
                    label: 'New password',
                    value: newPassword,
                    setValue: setNewPassword,
                    visible: showNewPassword,
                    setVisible: setShowNewPassword,
                    autoComplete: 'new-password'
                  })}

                  {renderPasswordField({
                    id: 'confirmPassword',
                    label: 'Confirm new password',
                    value: confirmPassword,
                    setValue: setConfirmPassword,
                    visible: showConfirmPassword,
                    setVisible: setShowConfirmPassword,
                    autoComplete: 'new-password'
                  })}

                  <p className="text-xs text-slate-500">
                    Your new password must contain at least 8 characters.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>

                    <button
                      type="button"
                      disabled={changingPassword}
                      onClick={() => {
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                        setShowCurrentPassword(false)
                        setShowNewPassword(false)
                        setShowConfirmPassword(false)
                        setShowPasswordForm(false)
                      }}
                      className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:text-white disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500"
              >
                Go to Dashboard
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Profile
