import { useState } from 'react'
import { Icon, LogoMark } from '../components/Icons'
import { Button, Field } from '../components/ui'
import { useAuth } from '../lib/auth'


const roles = [
  { key: 'teacher', label: 'Teacher', icon: 'graduation' },
  { key: 'student', label: 'Student', icon: 'users' },
]

export default function Register() {
  const { signUp } = useAuth()
  const [role, setRole] = useState('teacher')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { data, error: err } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role,
      })
      if (err) setError(err.message)
      else if (!data.session) setMessage('Account created. Check your email to verify before signing in.')
      else setMessage('Account created. Redirecting to your workspace…')
    } catch (err) {
      setError(err.message || 'Unable to create your account.')
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
            <span className="brand-name">Class<span>Track</span></span>
            <span className="auth__sub">Attendance platform</span>
          </span>
        </div>
        <div className="auth__content">
          <h1 className="auth__title">Create your account</h1>
          <p className="auth__text">Teachers and students can register. Administrator accounts must be provisioned by your institution.</p>
        </div>
      </aside>
      <main className="auth__main">
        <div className="auth-form">
          <h2 className="auth-form__title">Sign up</h2>
          <div className="auth-tabs" role="tablist">
            {roles.map((r) => (
              <button key={r.key} type="button" role="tab" aria-selected={role === r.key}
                className={role === r.key ? 'is-active' : ''}
                onClick={() => setRole(r.key)}>
                <Icon name={r.icon} size={14} /> {r.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="stack--sm" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="First name">
                <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </Field>
              <Field label="Last name">
                <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </Field>
              <Field label="Institutional email">
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Password">
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </Field>
            </div>
            {error && <p style={{ color: '#DC2626', marginTop: 12 }}>{error}</p>}
            {message && <p style={{ color: '#059669', marginTop: 12 }}>{message}</p>}
            <Button variant="primary" size="lg" className="btn--block" type="submit" disabled={loading} iconRight="arrowRight" style={{ marginTop: 16 }}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>
          <div className="row" style={{ marginTop: 18, justifyContent: 'center', gap: 6 }}>
            <span className="tiny muted">Already have an account?</span>
            <a href="#/login" className="card-link" style={{ fontSize: 11.5 }}>Sign in</a>
          </div>
        </div>
      </main>
    </div>
  )
}
