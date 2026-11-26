import { useState } from 'react'
import { Icon, LogoMark } from '../components/Icons'
import { Avatar, Badge, Button, Field } from '../components/ui'
import { currentSession } from '../data/mockData'
import { navigate } from '../lib/navigation'

export default function CheckIn({ initialCode = '' }) {
  const [code, setCode] = useState(initialCode)
  const [verified, setVerified] = useState(Boolean(initialCode))
  const [checkedIn, setCheckedIn] = useState(false)

  const submitCode = (event) => {
    event.preventDefault()
    if (code.trim().length >= 4) setVerified(true)
  }

  return (
    <div className="checkin-page">
      <a className="checkin-brand" href="#/login">
        <LogoMark size={32} />
        <span>
          <span className="brand-name">
            Class<span>Track</span>
          </span>
          <span className="brand-sub">Student check-in</span>
        </span>
      </a>

      <div className="checkin-card">
        <div className="checkin-card__head">
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <span className="live-badge">Live session</span>
            <Badge tone="blue">QR check-in</Badge>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 12 }}>
            {checkedIn ? 'Attendance recorded' : 'Confirm your attendance'}
          </h1>
          <p className="small muted" style={{ marginTop: 4 }}>
            {checkedIn
              ? 'Your teacher can see your check-in in real time.'
              : 'You are one tap away from being marked present.'}
          </p>
        </div>

        <div className="checkin-card__body">
          {!verified ? (
            <form onSubmit={submitCode} className="stack" style={{ gap: 14 }}>
              <Field
                label="Session code"
                hint="Find the 8-character code under the QR code displayed by your teacher."
              >
                <input
                  className="input"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="CT-XXXX-XXXX"
                  autoFocus
                />
              </Field>
              <Button variant="primary" size="lg" type="submit" iconRight="arrowRight">
                Find session
              </Button>
              <div className="info-banner">
                <Icon name="info" size={15} className="info-banner__icon" />
                Demo code: <strong style={{ marginLeft: 4 }}>CT-8F2K</strong>
              </div>
            </form>
          ) : checkedIn ? (
            <div className="checkin-success">
              <div className="checkin-success__icon">
                <Icon name="check" size={30} strokeWidth={2.6} />
              </div>
              <h2>You&apos;re checked in!</h2>
              <p>
                Your attendance for <strong>{currentSession.code}</strong> has been recorded.
              </p>
              <div style={{ marginTop: 18, textAlign: 'left' }}>
                <div className="checkin-detail">
                  <span>Status</span>
                  <Badge tone="amber" dot>Late · 42 min</Badge>
                </div>
                <div className="checkin-detail">
                  <span>Session</span>
                  <strong>{currentSession.title}</strong>
                </div>
                <div className="checkin-detail">
                  <span>Time</span>
                  <strong>{currentSession.start} – {currentSession.end}</strong>
                </div>
                <div className="checkin-detail">
                  <span>Room</span>
                  <strong>{currentSession.room}</strong>
                </div>
                <div className="checkin-detail">
                  <span>Student</span>
                  <strong>Yasmine Ait Ali</strong>
                </div>
              </div>
              <div className="info-banner info-banner--green" style={{ marginTop: 16, textAlign: 'left' }}>
                <Icon name="checkCircle" size={15} className="info-banner__icon" />
                A record was created at 09:42. Contact your teacher if this is incorrect.
              </div>
              <Button
                variant="primary"
                size="lg"
                className="btn--block mt-16"
                onClick={() => navigate('/teacher/attendance')}
              >
                Back to ClassTrack demo
              </Button>
            </div>
          ) : (
            <>
              <div className="checkin-session">
                <span className="checkin-session__icon">
                  <Icon name="book" size={19} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="checkin-session__code">{currentSession.code}</div>
                  <div className="checkin-session__title">{currentSession.title}</div>
                  <div className="checkin-session__meta">
                    {currentSession.start} – {currentSession.end} · Room {currentSession.room}
                  </div>
                </div>
              </div>

              <div className="checkin-student">
                <Avatar name="Yasmine Ait Ali" size="md" color="#7C3AED" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="strong" style={{ fontSize: 13 }}>Yasmine Ait Ali</div>
                  <div className="tiny muted">NB-2024-1001 · BSc Computer Science</div>
                </div>
                <Badge tone="green" dot>Enrolled</Badge>
              </div>

              <div className="info-banner" style={{ marginBottom: 14 }}>
                <Icon name="info" size={15} className="info-banner__icon" />
                This session opened at 09:00. Check-ins after 09:15 are recorded as late.
              </div>

              <Button
                variant="primary"
                size="lg"
                className="btn--block"
                icon="check"
                onClick={() => setCheckedIn(true)}
              >
                Confirm check-in
              </Button>
              <button
                type="button"
                className="btn btn--ghost btn--block mt-8"
                onClick={() => setVerified(false)}
              >
                Use a different code
              </button>
            </>
          )}
        </div>
      </div>

      <p className="checkin-foot">
        Secured by ClassTrack dynamic QR · Code rotates every 20 seconds.
        <br />
        Never share the QR code or session code with another student.
      </p>
    </div>
  )
}
