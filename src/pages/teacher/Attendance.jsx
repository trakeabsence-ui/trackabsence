import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icons'
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Field,
  IconButton,
  MenuItem,
  Modal,
  Progress,
  useToast,
} from '../../components/ui'
import { PageHeader, SessionStatusBadge } from '../../components/Layout'
import { navigate } from '../../lib/navigation'
import { checkinFeed, currentSession, studentsByClass } from '../../data/mockData'
import { cn } from '../../lib/utils'

const roster = studentsByClass('cs301')

function initialStatuses() {
  return Object.fromEntries(
    roster.map((student, index) => {
      if (student.risk === 'at_risk' || student.risk === 'critical') return [student.id, 'absent']
      if (student.risk === 'watch') return [student.id, 'late']
      if (index % 11 === 10) return [student.id, null]
      return [student.id, 'present']
    }),
  )
}

function initialLateMinutes() {
  return Object.fromEntries(
    roster.map((student, index) => [student.id, 5 + (index % 14)]),
  )
}

function QRPattern({ seed = 1 }) {
  const cells = []

  const random = (x, y) => {
    const value = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed * 37.719) * 43758.5453
    return value - Math.floor(value)
  }

  const finderAt = (x, y) => {
    const origins = [
      [0, 0],
      [18, 0],
      [0, 18],
    ]
    for (const [ox, oy] of origins) {
      if (x >= ox && x < ox + 7 && y >= oy && y < oy + 7) {
        const dx = x - ox
        const dy = y - oy
        const border = dx === 0 || dx === 6 || dy === 0 || dy === 6
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        return border || core
      }
    }
    return null
  }

  for (let y = 0; y < 25; y += 1) {
    for (let x = 0; x < 25; x += 1) {
      const finder = finderAt(x, y)
      if (finder !== null) {
        if (finder) cells.push([x, y])
        continue
      }
      if (x >= 9 && x <= 15 && y >= 9 && y <= 15) continue
      if (y === 6 && x > 7 && x < 17) {
        if (x % 2 === 0) cells.push([x, y])
        continue
      }
      if (x === 6 && y > 7 && y < 17) {
        if (y % 2 === 0) cells.push([x, y])
        continue
      }
      if (random(x, y) > 0.52) cells.push([x, y])
    }
  }

  return (
    <svg viewBox="0 0 25 25" role="img" aria-label="Dynamic attendance QR code">
      <rect width="25" height="25" fill="#fff" />
      {cells.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x + 0.04}
          y={y + 0.04}
          width="0.92"
          height="0.92"
          rx="0.12"
          fill="#0F172A"
        />
      ))}
      <rect x="9.4" y="9.4" width="6.2" height="6.2" rx="1.3" fill="#fff" />
      <path
        d="M11.2 12.5l1.3 1.3 2.2-2.5"
        fill="none"
        stroke="#2563EB"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TeacherAttendance() {
  const toast = useToast()
  const [statuses, setStatuses] = useState(initialStatuses)
  const [lateMinutes, setLateMinutes] = useState(initialLateMinutes)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sessionState, setSessionState] = useState('live')
  const [qrActive, setQrActive] = useState(true)
  const [countdown, setCountdown] = useState(18)
  const [qrSeed, setQrSeed] = useState(3)
  const [modal, setModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('Teacher unavailable')
  const [reschedule, setReschedule] = useState({
    date: '2026-12-03',
    start: '09:00',
    end: '10:30',
    room: 'B-204',
    reason: 'Department event',
  })

  const live = sessionState === 'live'

  useEffect(() => {
    if (!live || !qrActive) return undefined
    const timer = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          setQrSeed((seed) => seed + 1)
          return 20
        }
        return previous - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [live, qrActive])

  const counts = useMemo(() => {
    const values = Object.values(statuses)
    return {
      present: values.filter((value) => value === 'present').length,
      late: values.filter((value) => value === 'late').length,
      absent: values.filter((value) => value === 'absent').length,
      excused: values.filter((value) => value === 'excused').length,
      unmarked: values.filter((value) => !value).length,
    }
  }, [statuses])

  const checkedIn = counts.present + counts.late
  const progress = Math.round((checkedIn / currentSession.expected) * 100)

  const visible = roster
    .filter((student) => {
      if (filter === 'all') return true
      if (filter === 'unmarked') return !statuses[student.id]
      return statuses[student.id] === filter
    })
    .filter((student) =>
      `${student.name} ${student.number}`.toLowerCase().includes(query.trim().toLowerCase()),
    )

  const setStatus = (student, status) => {
    setStatuses((current) => ({ ...current, [student.id]: status }))
    if (status === 'late') {
      setLateMinutes((current) => ({ ...current, [student.id]: current[student.id] || 5 }))
    }
  }

  const markAllPresent = () => {
    setStatuses(Object.fromEntries(roster.map((student) => [student.id, 'present'])))
    toast({ title: 'All students marked present', text: 'Adjust individual exceptions before saving.' })
  }

  const saveAttendance = () => {
    toast({
      title: 'Attendance saved',
      text: `${counts.present} present · ${counts.late} late · ${counts.absent} absent. Students can see updates immediately.`,
    })
  }

  const closeSession = () => {
    setSessionState('completed')
    setQrActive(false)
    toast({
      title: 'Session closed',
      text: 'Unmarked students were recorded as absent. Attendance is now locked.',
    })
  }

  const submitCancel = () => {
    setSessionState('cancelled')
    setQrActive(false)
    setModal(null)
    toast({
      type: 'error',
      title: 'Session cancelled',
      text: 'Students were notified and this session was excluded from attendance rates.',
    })
  }

  const submitReschedule = () => {
    setSessionState('rescheduled')
    setQrActive(false)
    setModal(null)
    toast({
      title: 'Session rescheduled',
      text: `New session on ${reschedule.date} at ${reschedule.start}. Students were notified.`,
    })
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentSession.qrToken)
      toast({ title: 'Code copied', text: 'Share only with students in this room.' })
    } catch {
      toast({ type: 'info', title: 'Manual code', text: currentSession.qrToken })
    }
  }

  const filterOptions = [
    ['all', 'All', roster.length],
    ['present', 'Present', counts.present],
    ['late', 'Late', counts.late],
    ['absent', 'Absent', counts.absent],
    ['excused', 'Excused', counts.excused],
    ['unmarked', 'Unmarked', counts.unmarked],
  ]

  return (
    <>
      <PageHeader
        eyebrow="Attendance · Thursday, November 26"
        title="Live attendance"
        subtitle="Mark attendance, manage late arrivals and monitor QR check-ins in real time."
        actions={
          <>
            <Button icon="eye" onClick={() => navigate('/checkin')}>
              Student view
            </Button>
            <Button variant="primary" icon="check" onClick={saveAttendance} disabled={!live}>
              Save attendance
            </Button>
          </>
        }
      />

      {!live && (
        <div className="info-banner info-banner--amber mb-16">
          <Icon name="alertTriangle" size={15} className="info-banner__icon" />
          <div className="row row--between w-full" style={{ gap: 12 }}>
            <span>
              This session is <strong>{sessionState}</strong>. Attendance and QR check-in are locked.
            </span>
            <button
              type="button"
              className="card-link"
              style={{ border: 0, background: 'none' }}
              onClick={() => {
                setSessionState('live')
                setQrActive(true)
                toast({ title: 'Session reopened', text: 'QR check-in is active again.' })
              }}
            >
              Reopen session
            </button>
          </div>
        </div>
      )}

      <section className="session-bar">
        <span className="session-bar__icon">
          <Icon name="book" size={20} />
        </span>
        <div className="session-bar__main">
          <div className="session-bar__title">
            <span className="mono muted" style={{ fontSize: 11.5 }}>{currentSession.code}</span>
            {currentSession.title}
            <SessionStatusBadge status={sessionState} />
          </div>
          <div className="session-bar__meta">
            <span><Icon name="clock" size={12} /> {currentSession.start} – {currentSession.end}</span>
            <span><Icon name="mapPin" size={12} /> Room {currentSession.room}</span>
            <span><Icon name="users" size={12} /> {roster.length} enrolled</span>
            <span><Icon name="checkCheck" size={12} /> {checkedIn} checked in</span>
          </div>
        </div>

        <div className="att-summary">
          <span className="att-count att-count--present"><i style={{ background: 'var(--green)' }} />{counts.present}</span>
          <span className="att-count att-count--late"><i style={{ background: 'var(--amber)' }} />{counts.late}</span>
          <span className="att-count att-count--absent"><i style={{ background: 'var(--red)' }} />{counts.absent}</span>
        </div>

        <Dropdown trigger={<IconButton icon="more" label="Session options" variant="bordered" />}>
          <MenuItem icon="calendarPlus" onClick={() => setModal('reschedule')}>Reschedule session</MenuItem>
          <MenuItem icon="clock" onClick={() => toast({ type: 'info', title: 'Session window', text: 'QR closes 45 minutes after the session starts.' })}>
            Session settings
          </MenuItem>
          <div className="menu-sep" />
          <MenuItem icon="xCircle" danger onClick={() => setModal('cancel')}>Cancel session</MenuItem>
        </Dropdown>

        <Button size="sm" icon="square" onClick={closeSession} disabled={!live}>
          Close session
        </Button>
      </section>

      <div className="attendance-layout mt-20">
        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">
                Attendance roster
                <Badge tone="slate">{roster.length}</Badge>
              </h3>
              <p className="card__sub">
                {checkedIn} of {roster.length} checked in · {counts.unmarked} not marked
              </p>
            </div>
            <Button size="sm" variant="soft" icon="checkCheck" onClick={markAllPresent} disabled={!live}>
              Mark all present
            </Button>
          </div>

          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="toolbar">
              <div className="search-field" style={{ maxWidth: 260 }}>
                <Icon name="search" size={15} />
                <input
                  className="input"
                  placeholder="Search students…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="filter-tabs">
                {filterOptions.map(([key, label, count]) => (
                  <button
                    key={key}
                    type="button"
                    className={cn('filter-tab', filter === key && 'is-active')}
                    onClick={() => setFilter(key)}
                  >
                    {label}
                    <span className="filter-tab__count">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="attendance-list" style={{ maxHeight: 620, overflowY: 'auto' }}>
            {visible.map((student) => {
              const status = statuses[student.id]
              return (
                <div className="att-row" key={student.id}>
                  <Avatar name={student.name} size="sm" color={student.color} />
                  <div className="att-row__main">
                    <div className="att-row__name">{student.name}</div>
                    <div className="att-row__id">
                      {student.number}
                      {status === 'late' && ` · ${lateMinutes[student.id]} min late`}
                      {student.risk === 'at_risk' && status !== 'present' && ' · at risk'}
                    </div>
                  </div>
                  <div className="att-options" role="group" aria-label={`Attendance for ${student.name}`}>
                    {[
                      ['present', 'P', 'Present'],
                      ['late', 'L', 'Late'],
                      ['absent', 'A', 'Absent'],
                      ['excused', 'E', 'Excused'],
                    ].map(([value, letter, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={cn('att-opt', status === value && `is-${value}`)}
                        onClick={() => setStatus(student, value)}
                        title={label}
                        aria-pressed={status === value}
                        disabled={!live}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            {visible.length === 0 && (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <div className="empty-state__icon"><Icon name="search" size={20} /></div>
                <h3>No students found</h3>
                <p>Try a different filter or search term.</p>
              </div>
            )}
          </div>

          <div className="card__footer">
            <span className="tiny muted">
              <Icon name="checkCircle" size={12} className="inline-icon" /> Last saved 09:38 · Auto-save on
            </span>
            <div className="row" style={{ gap: 6 }}>
              <Button size="sm" variant="ghost" onClick={() => setFilter('all')}>Reset filters</Button>
              <Button size="sm" variant="primary" icon="check" onClick={saveAttendance} disabled={!live}>
                Save attendance
              </Button>
            </div>
          </div>
        </section>

        <aside className="qr-card">
          <div className="qr-card__head">
            <div>
              <h3><Icon name="qr" size={15} /> Live QR check-in</h3>
              <p>{live ? `Rotates every 20 seconds · ${currentSession.qrToken}` : 'Check-in unavailable'}</p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              {live && qrActive && (
                <div className="qr-countdown">
                  <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
                    <circle cx="17" cy="17" r="14" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
                    <circle
                      cx="17"
                      cy="17"
                      r="14"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(countdown / 20) * 87.9} 87.9`}
                      transform="rotate(-90 17 17)"
                    />
                  </svg>
                  <span className="qr-countdown__num">{countdown}</span>
                </div>
              )}
              <IconButton
                icon={qrActive ? 'pause' : 'play'}
                label={qrActive ? 'Pause check-in' : 'Resume check-in'}
                onClick={() => setQrActive((value) => !value)}
                style={{ color: '#CBD5E1' }}
                disabled={!live}
              />
            </div>
          </div>

          <div className="qr-body">
            <div className="qr-frame">
              <QRPattern seed={qrSeed} />
              {(!live || !qrActive) && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 10,
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(2px)',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    color: '#475569',
                    textAlign: 'center',
                    padding: 10,
                  }}
                >
                  <Icon name={live ? 'pause' : 'lock'} size={22} />
                  <span className="strong" style={{ fontSize: 11.5 }}>
                    {live ? 'Check-in paused' : 'Session closed'}
                  </span>
                  <span className="tiny muted">
                    {live ? 'Resume to accept scans' : 'QR codes are no longer valid'}
                  </span>
                </div>
              )}
            </div>

            <button type="button" className="qr-code" onClick={copyCode} style={{ cursor: 'pointer' }}>
              {currentSession.qrToken}
              <span>manual code</span>
              <Icon name="copy" size={12} />
            </button>
            <p className="qr-hint">
              Students scan with their phone camera or open the check-in page and enter the manual
              code.
            </p>
          </div>

          <div className="qr-stats">
            <div className="qr-stat">
              <div className="qr-stat__label">Checked in</div>
              <div className="qr-stat__value">{checkedIn}<span className="muted" style={{ fontSize: 12, fontWeight: 500 }}> / {roster.length}</span></div>
            </div>
            <div className="qr-stat">
              <div className="qr-stat__label">Late arrivals</div>
              <div className="qr-stat__value" style={{ color: 'var(--amber)' }}>{counts.late}</div>
            </div>
            <div className="qr-stat">
              <div className="qr-stat__label">Window closes</div>
              <div className="qr-stat__value" style={{ fontSize: 14 }}>09:45</div>
            </div>
            <div className="qr-stat">
              <div className="qr-stat__label">Progress</div>
              <div className="qr-stat__value" style={{ fontSize: 14 }}>{progress}%</div>
            </div>
          </div>

          <div className="checkin-feed">
            <div className="checkin-feed__title">
              <span>Recent check-ins</span>
              <span className="live-badge live-badge--light" style={{ height: 18, fontSize: 8.5 }}>Live</span>
            </div>
            {checkinFeed.slice(0, 4).map((entry) => (
              <div className="checkin-item" key={entry.name}>
                <span className={cn('checkin-dot', entry.late && 'checkin-dot--late')} />
                <span className="checkin-item__name">{entry.name}</span>
                <span className="checkin-item__time">{entry.time}</span>
              </div>
            ))}
            <button
              type="button"
              className="card-link mt-8"
              style={{ border: 0, background: 'none', padding: 0 }}
              onClick={() => toast({ type: 'info', title: 'Check-in log', text: `${checkedIn} check-ins recorded this session.` })}
            >
              View all check-ins <Icon name="arrowRight" size={12} />
            </button>
          </div>

          <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="primary" icon="eye" onClick={() => navigate('/checkin')}>
              Preview student view
            </Button>
            <Button variant="secondary" icon="download" onClick={() => toast({ title: 'QR poster ready', text: 'A printable A4 poster was generated.' })}>
              Print QR poster
            </Button>
          </div>
        </aside>
      </div>

      <div className="grid grid-2 mt-20">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Session summary</h3>
              <p className="card__sub">Live counts update as students check in</p>
            </div>
            <Badge tone="blue">Auto-saved</Badge>
          </div>
          <div className="card__body">
            <div className="row row--between mb-8">
              <span className="small muted">Overall check-in progress</span>
              <span className="small strong">{checkedIn} / {roster.length} · {progress}%</span>
            </div>
            <Progress value={progress} tone="green" size="lg" />
            <div className="grid grid-3 mt-16" style={{ gap: 10 }}>
              <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
                <div className="mini-label">Present</div>
                <div className="stat-card__value" style={{ fontSize: 20, color: 'var(--green)' }}>{counts.present}</div>
              </div>
              <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
                <div className="mini-label">Late</div>
                <div className="stat-card__value" style={{ fontSize: 20, color: 'var(--amber)' }}>{counts.late}</div>
              </div>
              <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
                <div className="mini-label">Absent</div>
                <div className="stat-card__value" style={{ fontSize: 20, color: 'var(--red)' }}>{counts.absent}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Session actions</h3>
              <p className="card__sub">Changes are logged and shared with students</p>
            </div>
          </div>
          <div className="card__body">
            <div className="quick-actions">
              <button type="button" className="quick-action" onClick={() => setModal('reschedule')}>
                <span className="quick-action__icon"><Icon name="calendarPlus" size={15} /></span>
                Reschedule
              </button>
              <button type="button" className="quick-action" onClick={() => setModal('cancel')}>
                <span className="quick-action__icon"><Icon name="xCircle" size={15} /></span>
                Cancel session
              </button>
              <button type="button" className="quick-action" onClick={saveAttendance}>
                <span className="quick-action__icon"><Icon name="check" size={15} /></span>
                Save now
              </button>
              <button type="button" className="quick-action" onClick={() => toast({ title: 'Absence report downloaded' })}>
                <span className="quick-action__icon"><Icon name="download" size={15} /></span>
                Absence report
              </button>
            </div>
            <div className="info-banner mt-16">
              <Icon name="shield" size={15} className="info-banner__icon" />
              QR codes rotate every 20 seconds and can only be used once per student.
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={modal === 'cancel'}
        onClose={() => setModal(null)}
        title="Cancel this session?"
        subtitle="Cancelled sessions are excluded from attendance rates. Enrolled students are notified."
        icon="xCircle"
        width="narrow"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Keep session</Button>
            <Button variant="danger" icon="x" onClick={submitCancel}>Cancel session</Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Reason">
            <select className="select" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
              <option>Teacher unavailable</option>
              <option>Public holiday</option>
              <option>Room unavailable</option>
              <option>Institution event</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Note for students" hint="Optional, included in the notification email.">
            <textarea className="textarea" placeholder="The session will be rescheduled to next week." />
          </Field>
          <div className="info-banner info-banner--amber">
            <Icon name="alertTriangle" size={15} className="info-banner__icon" />
            This cannot be undone if attendance has already been saved.
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'reschedule'}
        onClose={() => setModal(null)}
        title="Reschedule session"
        subtitle="Create a replacement session. The original is kept in history for audit."
        icon="calendarPlus"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="primary" icon="calendar" onClick={submitReschedule}>Reschedule</Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="New date" full>
            <input
              className="input"
              type="date"
              value={reschedule.date}
              onChange={(event) => setReschedule((current) => ({ ...current, date: event.target.value }))}
            />
          </Field>
          <Field label="Starts">
            <input
              className="input"
              type="time"
              value={reschedule.start}
              onChange={(event) => setReschedule((current) => ({ ...current, start: event.target.value }))}
            />
          </Field>
          <Field label="Ends">
            <input
              className="input"
              type="time"
              value={reschedule.end}
              onChange={(event) => setReschedule((current) => ({ ...current, end: event.target.value }))}
            />
          </Field>
          <Field label="Room">
            <input
              className="input"
              value={reschedule.room}
              onChange={(event) => setReschedule((current) => ({ ...current, room: event.target.value }))}
            />
          </Field>
          <Field label="Reason">
            <select
              className="select"
              value={reschedule.reason}
              onChange={(event) => setReschedule((current) => ({ ...current, reason: event.target.value }))}
            >
              <option>Department event</option>
              <option>Teacher unavailable</option>
              <option>Room conflict</option>
              <option>Institution holiday</option>
              <option>Other</option>
            </select>
          </Field>
          <div className="field--full">
            <div className="info-banner">
              <Icon name="info" size={15} className="info-banner__icon" />
              Students will receive the new time and room by email and in-app notification.
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
