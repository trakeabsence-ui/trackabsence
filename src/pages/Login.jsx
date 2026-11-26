import { useState } from 'react'
import { Icon, LogoMark } from '../components/Icons'
import { Button, Field } from '../components/ui'
import { adminUser, currentUser, institution } from '../data/mockData'
import { navigate } from '../lib/navigation'

const features = [
  { icon: 'qr', text: 'Dynamic QR check-in that rotates every 20 seconds' },
  { icon: 'sparkles', text: 'AI timetable import from a photo or pasted text' },
  { icon: 'chart', text: 'Live attendance analytics and accreditation reports' },
]

export default function Login() {
  const [role, setRole] = useState('teacher')
  const [email, setEmail] = useState(currentUser.email)
  const [password, setPassword] = useState('classtrack-demo')
  const [showPassword, setShowPassword] = useState(false)

  const selectRole = (nextRole) => {
    setRole(nextRole)
    setEmail(nextRole === 'admin' ? adminUser.email : currentUser.email)
  }

  const signIn = (event) => {
    event.preventDefault()
    navigate(role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard')
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
          <p className="auth-form__sub">Sign in to your Northbridge University workspace.</p>

          <div className="auth-tabs" role="tablist" aria-label="Select role">
            <button
              type="button"
              role="tab"
              aria-selected={role === 'teacher'}
              className={role === 'teacher' ? 'is-active' : ''}
              onClick={() => selectRole('teacher')}
            >
              <Icon name="graduation" size={14} />
              Teacher
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === 'admin'}
              className={role === 'admin' ? 'is-active' : ''}
              onClick={() => selectRole('admin')}
            >
              <Icon name="shield" size={14} />
              Administrator
            </button>
          </div>

          <form onSubmit={signIn}>
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
              <label className="row" style={{ gap: 7, cursor: 'pointer' }}>
                <input type="checkbox" className="checkbox" defaultChecked />
                Keep me signed in
              </label>
              <a href="#/login">Forgot password?</a>
            </div>

            <Button variant="primary" size="lg" className="btn--block" type="submit" iconRight="arrowRight">
              Sign in as {role === 'admin' ? 'administrator' : 'teacher'}
            </Button>

            <div className="auth-demo">
              <strong>Demo workspace.</strong> Credentials are prefilled and authentication is
              simulated. Pick a role above to explore both dashboards.
            </div>

            <div className="row" style={{ marginTop: 18, justifyContent: 'center', gap: 6 }}>
              <span className="tiny muted">Student?</span>
              <a href="#/checkin" className="card-link" style={{ fontSize: 11.5 }}>
                Open QR check-in
                <Icon name="arrowRight" size={12} />
              </a>
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
