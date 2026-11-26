import { useState } from 'react'
import { LogoMark } from '../components/Icons'
import { Button, Field } from '../components/ui'
import { useAuth } from '../lib/auth'
import { navigate } from '../lib/navigation'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
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
      const { error: err } = await updatePassword(password)
      if (err) setError(err.message)
      else {
        setMessage('Password updated. You can now sign in.')
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch (err) {
      setError(err.message || 'Unable to update your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <main className="auth__main">
        <div className="auth-form">
          <LogoMark size={34} />
          <h2 className="auth-form__title">Reset password</h2>
          <p className="auth-form__sub">Enter your new password.</p>
          <form onSubmit={handleSubmit}>
            <Field label="New password">
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </Field>
            {error && <p role="alert" style={{ color: '#DC2626', marginTop: 12 }}>{error}</p>}
            {message && <p role="status" style={{ color: '#059669', marginTop: 12 }}>{message}</p>}
            <Button variant="primary" size="lg" className="btn--block" type="submit" disabled={loading} iconRight="arrowRight" style={{ marginTop: 16 }}>
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
