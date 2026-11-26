import { useAuth } from '../lib/auth'
import { useState } from 'react'
import { Icon, LogoMark } from '../components/Icons'
import { Button, Field } from '../components/ui'
import { institution } from '../data/mockData'


const features = [
  { icon: 'qr', text: 'Dynamic QR check-in that rotates every 20 seconds' },
  { icon: 'sparkles', text: 'AI timetable import from a photo or pasted text' },
  { icon: 'chart', text: 'Live attendance analytics and accreditation reports' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const { signIn, resetPassword, authError } = useAuth()
  const handleSignIn = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { error: err } = await signIn(email, password)
      if (err) setError(err.message)
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setError('')
    setMessage('')
    if (!email.trim()) {
      setError('Enter your email address first, then request a password reset.')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await resetPassword(email.trim())
      if (err) setError(err.message)
      else setMessage('If an account exists for that email, a password reset link has been sent.')
    } catch (err) {
      setError(err.message || 'Unable to request a password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <aside className="auth__aside">
        <div className="auth__brand">
          <LogoMark size={38} />
          <span>
            <span className="brand-name">
              Class<span>Track</span>
            </span>
            <span className="brand-sub">Attendance platform</span>
          </span>
        </div>

        <div className="auth__content">
          <span className="auth__eyebrow">
            <Icon name="sparkles" size={12} />
            Built for higher education
          </span>
          <h1 className="auth__title">
            Attendance,
            <br />
            without the <em>busywork.</em>
          </h1>
          <p className="auth__text">
            One workspace for classes, timetables, QR check-in and the reports your
            institution actually needs. Designed with faculty, for faculty.
          </p>

          <div className="auth__features">
            {features.map((feature) => (
              <div className="auth__feature" key={feature.text}>
                <span className="auth__feature-icon">
                  <Icon name={feature.icon} size={14} />
                </span>
                {feature.text}
              </div>
            ))}
          </div>

          <div className="auth__stats">
            <div className="auth__stat">
              <strong>2,418</strong>
              <span>Students tracked</span>
            </div>
            <div className="auth__stat">
              <strong>92%</strong>
              <span>Average attendance</span>
            </div>
            <div className="auth__stat">
              <strong>18</strong>
              <span>Live sessions today</span>
            </div>
          </div>
        </div>

        <div className="tiny" style={{ color: '#64748B', position: 'relative', zIndex: 1 }}>
          © 2026 ClassTrack · {institution.name} · SOC 2 Type II
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth-form">
          <div className="auth__mobile-brand">
            <LogoMark size={34} />
            <span>
              <span className="brand-name">
                Class<span>Track</span>
              </span>
              <span className="brand-sub">Attendance platform</span>
            </span>
          </div>

          <h2 className="auth-form__title">Welcome back</h2>
          <p className="auth-form__sub">Sign in to your {institution.name} workspace.</p>

          <form onSubmit={handleSignIn}>
            <div className="stack--sm" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Institutional email">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                />
              </Field>

              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 40 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 5,
                      top: 5,
                      width: 28,
                      height: 28,
                      border: 0,
                      background: 'transparent',
                      color: '#64748B',
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 6,
                    }}
                  >
                    <Icon name="eye" size={15} />
                  </button>
                </div>
              </Field>
            </div>

            <div className="auth-form__row">
              <span />
              <a href="#/login" onClick={(event) => { event.preventDefault(); handlePasswordReset() }}>
                Forgot password?
              </a>
            </div>

            {(error || message || authError) && (
              <p role={error || authError ? 'alert' : 'status'} style={{ color: error || authError ? '#DC2626' : '#059669', marginTop: 12 }}>
                {error || message || authError}
              </p>
            )}

            <Button variant="primary" size="lg" className="btn--block" type="submit" disabled={loading} iconRight="arrowRight">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="row" style={{ marginTop: 18, justifyContent: 'center', gap: 6 }}>
              <span className="tiny muted">Student?</span>
              <a href="#/checkin" className="card-link" style={{ fontSize: 11.5 }}>
                Open QR check-in
                <Icon name="arrowRight" size={12} />
              </a>
            </div>
            <div className="row" style={{ marginTop: 12, justifyContent: 'center', gap: 6 }}>
              <span className="tiny muted">New to ClassTrack?</span>
              <a href="#/register" className="card-link" style={{ fontSize: 11.5 }}>Create an account</a>
            </div>
          </form>

          <p className="auth__legal">
            By continuing you agree to the ClassTrack Terms of Service and Privacy Policy.
            <br />
            Need help? Contact your academic operations office.
          </p>
        </div>
      </main>
    </div>
  )
}
