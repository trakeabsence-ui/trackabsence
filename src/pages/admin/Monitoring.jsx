import { Fragment, useMemo, useState } from 'react'
import { Icon } from '../../components/Icons'
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  IconButton,
  MenuItem,
  Modal,
  Progress,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import {
  alerts,
  checkinFeed,
  departments,
  heatmap,
  kpis,
  liveSessions as seedSessions,
} from '../../data/mockData'
import { downloadCsv } from '../../lib/utils'
import { cn } from '../../lib/utils'

const severity = {
  high: { tone: 'red', icon: 'alertTriangle', bg: '#FEF2F2', color: '#DC2626', label: 'High' },
  medium: { tone: 'amber', icon: 'alertCircle', bg: '#FFFBEB', color: '#D97706', label: 'Medium' },
  low: { tone: 'blue', icon: 'info', bg: '#EFF6FF', color: '#2563EB', label: 'Low' },
}

const departmentColor = Object.fromEntries(departments.map((item) => [item.name, item.color]))

function heatColor(value) {
  if (value >= 94) return { background: '#1E40AF', color: '#DBEAFE' }
  if (value >= 90) return { background: '#2563EB', color: '#EFF6FF' }
  if (value >= 85) return { background: '#60A5FA', color: '#0F172A' }
  if (value >= 80) return { background: '#BFDBFE', color: '#1E3A8A' }
  if (value >= 74) return { background: '#E2E8F0', color: '#475569' }
  return { background: '#FEE2E2', color: '#991B1B' }
}

const activity = [
  ...checkinFeed.slice(0, 4).map((entry) => ({
    id: `check-${entry.name}`,
    icon: 'checkCircle',
    color: entry.late ? '#D97706' : '#16A34A',
    bg: entry.late ? '#FFFBEB' : '#F0FDF4',
    title: `${entry.name} checked in`,
    text: `CS-301 · Advanced Data Structures · ${entry.late ? 'marked late' : 'on time'}`,
    time: entry.time,
  })),
  {
    id: 'qr-rotate',
    icon: 'qr',
    color: '#2563EB',
    bg: '#EFF6FF',
    title: 'QR token rotated',
    text: 'CS-301 · new token issued, previous token invalidated',
    time: '09:41',
  },
  {
    id: 'session-start',
    icon: 'play',
    color: '#7C3AED',
    bg: '#F5F3FF',
    title: 'Session opened',
    text: 'MTH-204 · Linear Algebra II · Leila Mansour',
    time: '09:00',
  },
]

export default function AdminMonitoring() {
  const toast = useToast()
  const [sessions, setSessions] = useState(seedSessions)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [qrFilter, setQrFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [acknowledged, setAcknowledged] = useState([])

  const filtered = useMemo(
    () =>
      sessions
        .filter((session) => (department === 'all' ? true : session.department === department))
        .filter((session) => (qrFilter === 'all' ? true : qrFilter === 'on' ? session.qr : !session.qr))
        .filter((session) =>
          `${session.code} ${session.title} ${session.teacher} ${session.room}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        ),
    [sessions, department, qrFilter, query],
  )

  const toggleQr = (id) => {
    setSessions((current) =>
      current.map((session) => (session.id === id ? { ...session, qr: !session.qr } : session)),
    )
    const session = sessions.find((item) => item.id === id)
    toast({
      title: session.qr ? 'QR check-in paused' : 'QR check-in resumed',
      text: `${session.code} · ${session.teacher}`,
    })
  }

  const exportLog = () => {
    downloadCsv(
      'classtrack-live-monitoring.csv',
      filtered.map((session) => ({
        Session: session.code,
        Course: session.title,
        Teacher: session.teacher,
        Department: session.department,
        Room: session.room,
        Time: session.time,
        'Checked in': `${session.checked}/${session.expected}`,
        'Check-in rate': `${Math.round((session.checked / session.expected) * 100)}%`,
        QR: session.qr ? 'On' : 'Off',
      })),
    )
    toast({ title: 'Monitoring snapshot exported', text: `${filtered.length} live sessions downloaded.` })
  }

  const openAlerts = alerts.filter((alert) => !acknowledged.includes(alert.id))

  return (
    <>
      <PageHeader
        eyebrow="Institution monitoring · Live"
        title="Attendance monitoring"
        subtitle="Watch sessions, QR check-ins and anomalies across every department in real time."
        actions={
          <>
            <Button icon="download" onClick={exportLog}>
              Export snapshot
            </Button>
            <Button
              variant="primary"
              icon="refresh"
              onClick={() => toast({ title: 'Monitoring refreshed', text: 'Live data synced a moment ago.' })}
            >
              Refresh
            </Button>
          </>
        }
      />

      <div className="kpi-strip">
        <div className="kpi-cell">
          <div className="kpi-cell__label">
            <span className="live-badge live-badge--light" style={{ height: 17, fontSize: 8.5 }}>
              Live
            </span>
            Sessions now
          </div>
          <div className="kpi-cell__value">{kpis.liveNow}</div>
          <div className="kpi-cell__foot">across 6 departments</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Check-ins today</div>
          <div className="kpi-cell__value">{kpis.checkinsToday.toLocaleString()}</div>
          <div className="kpi-cell__foot">
            <span className="trend trend--up">
              <Icon name="arrowUpRight" size={11} /> 8.2%
            </span>{' '}
            vs. last Thursday
          </div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">QR success rate</div>
          <div className="kpi-cell__value">
            96.4<span>%</span>
          </div>
          <div className="kpi-cell__foot">2.1% invalid or expired</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Average check-in</div>
          <div className="kpi-cell__value">
            1.8<span>s</span>
          </div>
          <div className="kpi-cell__foot">from scan to confirmation</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Open alerts</div>
          <div className="kpi-cell__value" style={{ color: 'var(--red)' }}>
            {openAlerts.length}
          </div>
          <div className="kpi-cell__foot">2 high priority</div>
        </div>
      </div>

      <div className="filter-bar mt-20">
        <span className="filter-bar__label">
          <Icon name="filter" size={14} /> Filters
        </span>
        <div className="search-field" style={{ width: 260 }}>
          <Icon name="search" size={15} />
          <input
            className="input"
            placeholder="Search session, teacher or room…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="select select--sm"
          style={{ width: 190 }}
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          aria-label="Filter by department"
        >
          <option value="all">All departments</option>
          {departments.map((item) => (
            <option key={item.code} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          className="select select--sm"
          style={{ width: 150 }}
          value={qrFilter}
          onChange={(event) => setQrFilter(event.target.value)}
          aria-label="Filter by QR state"
        >
          <option value="all">Any QR state</option>
          <option value="on">QR enabled</option>
          <option value="off">QR disabled</option>
        </select>
        <span className="toolbar__spacer" />
        <span className="row tiny muted" style={{ gap: 5 }}>
          <span className="status-dot" /> Updated 12 seconds ago
        </span>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">
                Live sessions
                <Badge tone="red" dot>
                  {filtered.length} live
                </Badge>
              </h3>
              <p className="card__sub">Check-in progress and QR status per session</p>
            </div>
            <a className="card-link" href="#/admin/reports">
              Historical reports <Icon name="arrowRight" size={12} />
            </a>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Teacher</th>
                  <th>Department</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>QR</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((session) => {
                  const percent = Math.round((session.checked / session.expected) * 100)
                  return (
                    <tr key={session.id}>
                      <td>
                        <div className="cell-strong">{session.code}</div>
                        <div className="cell-muted">
                          {session.title} · {session.time}
                        </div>
                      </td>
                      <td>
                        <div className="teacher-cell">
                          <Avatar name={session.teacher} size="xs" color={departmentColor[session.department] ?? '#475569'} />
                          <span className="small">{session.teacher}</span>
                        </div>
                      </td>
                      <td>
                        <span className="dept-pill">
                          <span
                            className="dept-dot"
                            style={{ background: departmentColor[session.department] ?? '#64748B' }}
                          />
                          {session.department}
                        </span>
                      </td>
                      <td className="cell-muted">{session.room}</td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <Progress
                            value={percent}
                            tone={percent >= 90 ? 'green' : percent >= 75 ? 'amber' : 'red'}
                            style={{ width: 54 }}
                          />
                          <span className="small strong" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {session.checked}/{session.expected}
                          </span>
                        </div>
                        <div className="cell-muted">{percent}% checked in</div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={cn('badge', session.qr ? 'badge--green' : 'badge--slate')}
                          style={{ border: 0, cursor: 'pointer' }}
                          onClick={() => toggleQr(session.id)}
                          title={session.qr ? 'Pause QR check-in' : 'Resume QR check-in'}
                        >
                          <span className="badge__dot" />
                          {session.qr ? 'On' : 'Off'}
                        </button>
                      </td>
                      <td>
                        <div className="table-actions">
                          <IconButton
                            icon="eye"
                            label={`Inspect ${session.code}`}
                            onClick={() => setSelected(session)}
                          />
                          <Dropdown trigger={<IconButton icon="more" label={`Actions for ${session.code}`} />}>
                            <MenuItem icon="eye" onClick={() => setSelected(session)}>
                              Session detail
                            </MenuItem>
                            <MenuItem
                              icon="qr"
                              onClick={() => {
                                setSelected(session)
                                toast({ type: 'info', title: 'QR controls', text: 'Use the session panel to pause or resume check-in.' })
                              }}
                            >
                              QR controls
                            </MenuItem>
                            <MenuItem
                              icon="mail"
                              onClick={() =>
                                toast({ title: 'Teacher notified', text: `${session.teacher} received a check-in summary.` })
                              }
                            >
                              Notify teacher
                            </MenuItem>
                            <div className="menu-sep" />
                            <MenuItem
                              icon="alertTriangle"
                              danger
                              onClick={() =>
                                toast({
                                  type: 'error',
                                  title: 'Flag raised',
                                  text: `${session.code} was flagged for the academic operations review queue.`,
                                })
                              }
                            >
                              Flag session
                            </MenuItem>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state" style={{ padding: '34px 20px' }}>
                        <div className="empty-state__icon">
                          <Icon name="activity" size={22} />
                        </div>
                        <h3>No live sessions match</h3>
                        <p>Adjust the department or QR filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="card__footer">
            <span className="tiny muted">
              {filtered.length} of {kpis.liveNow} live sessions shown · data refreshes every 15 seconds
            </span>
            <span className="row tiny muted" style={{ gap: 6 }}>
              <span className="status-dot" /> Stream healthy
            </span>
          </div>
        </section>

        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Attention required</h3>
              <p className="card__sub">Open institutional alerts</p>
            </div>
            <Badge tone="red">{openAlerts.length}</Badge>
          </div>
          <div className="card__body" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <div className="alert-list">
              {openAlerts.map((alert) => {
                const meta = severity[alert.severity]
                return (
                  <div className="alert-item" key={alert.id}>
                    <span className="alert-item__icon" style={{ background: meta.bg, color: meta.color }}>
                      <Icon name={meta.icon} size={14} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="alert-item__title">{alert.title}</div>
                      <div className="alert-item__text">{alert.text}</div>
                      <div className="row row--between" style={{ gap: 8 }}>
                        <span className="alert-item__time">{alert.time}</span>
                        <button
                          type="button"
                          className="card-link"
                          style={{ border: 0, background: 'none', fontSize: 10.5 }}
                          onClick={() => setAcknowledged((current) => [...current, alert.id])}
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {openAlerts.length === 0 && (
                <div className="empty-state" style={{ padding: '28px 16px' }}>
                  <div className="empty-state__icon">
                    <Icon name="checkCircle" size={20} />
                  </div>
                  <h3>All clear</h3>
                  <p>No open alerts for this period.</p>
                </div>
              )}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">{acknowledged.length} acknowledged</span>
            <button
              type="button"
              className="card-link"
              style={{ border: 0, background: 'none' }}
              onClick={() => {
                setAcknowledged(alerts.map((alert) => alert.id))
                toast({ title: 'All alerts acknowledged' })
              }}
            >
              Acknowledge all
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Attendance heatmap</h3>
              <p className="card__sub">Average attendance by weekday and start time</p>
            </div>
            <div className="row tiny muted" style={{ gap: 6 }}>
              <span>Low</span>
              {['#FEE2E2', '#E2E8F0', '#BFDBFE', '#60A5FA', '#2563EB', '#1E40AF'].map((color) => (
                <span
                  key={color}
                  style={{ width: 16, height: 10, borderRadius: 3, background: color, display: 'inline-block' }}
                />
              ))}
              <span>High</span>
            </div>
          </div>
          <div className="card__body">
            <div
              className="heatmap"
              style={{ gridTemplateColumns: `52px repeat(${heatmap.days.length}, minmax(0, 1fr))` }}
              role="img"
              aria-label="Attendance heatmap by weekday and time"
            >
              <span className="heatmap__label" />
              {heatmap.days.map((day) => (
                <span key={day} className="heatmap__label" style={{ justifyContent: 'center', fontWeight: 600 }}>
                  {day}
                </span>
              ))}
              {heatmap.values.map((row, rowIndex) => (
                <Fragment key={`slot-${heatmap.slots[rowIndex]}`}>
                  <span className="heatmap__label">{heatmap.slots[rowIndex]}</span>
                  {row.map((value, colIndex) => {
                    const style = heatColor(value)
                    return (
                      <div
                        className="heatmap__cell"
                        key={`${rowIndex}-${colIndex}`}
                        style={{ ...style, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600 }}
                        title={`${heatmap.days[colIndex]} ${heatmap.slots[rowIndex]} · ${value}% attendance`}
                      >
                        {value}
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">Evening slots consistently underperform.</span>
            <button
              type="button"
              className="card-link"
              style={{ border: 0, background: 'none' }}
              onClick={() => toast({ type: 'info', title: 'Pattern flagged', text: 'Scheduling review added to the operations queue.' })}
            >
              Flag pattern <Icon name="arrowRight" size={12} />
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Check-in activity</h3>
              <p className="card__sub">Latest events across live sessions</p>
            </div>
            <span className="live-badge live-badge--light" style={{ height: 19, fontSize: 9 }}>
              Live
            </span>
          </div>
          <div className="card__body" style={{ paddingTop: 4, paddingBottom: 4 }}>
            <div className="alert-list">
              {activity.map((event) => (
                <div className="alert-item" key={event.id}>
                  <span className="alert-item__icon" style={{ background: event.bg, color: event.color }}>
                    <Icon name={event.icon} size={14} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="alert-item__title">{event.title}</div>
                    <div className="alert-item__text">{event.text}</div>
                  </div>
                  <span className="alert-item__time" style={{ marginTop: 2 }}>
                    {event.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">Events retained for 30 days</span>
            <a className="card-link" href="#/admin/reports">
              Audit log <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.code} · Live session` : 'Live session'}
        subtitle={selected ? `${selected.title} · ${selected.time} · Room ${selected.room}` : ''}
        icon="activity"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              icon="mail"
              onClick={() => {
                toast({ title: 'Summary sent', text: `${selected?.teacher} received the live attendance summary.` })
                setSelected(null)
              }}
            >
              Send summary
            </Button>
          </>
        }
      >
        {selected && (
          <div className="stack" style={{ gap: 14 }}>
            <div className="row row--between row--wrap" style={{ gap: 10 }}>
              <div className="teacher-cell">
                <Avatar name={selected.teacher} size="md" color={departmentColor[selected.department] ?? '#475569'} />
                <div>
                  <div className="strong">{selected.teacher}</div>
                  <div className="tiny muted">{selected.department}</div>
                </div>
              </div>
              <Badge tone={selected.qr ? 'green' : 'slate'} dot>
                QR {selected.qr ? 'enabled' : 'disabled'}
              </Badge>
            </div>

            <div className="grid grid-3" style={{ gap: 10 }}>
              {[
                ['Checked in', `${selected.checked}/${selected.expected}`],
                ['Rate', `${Math.round((selected.checked / selected.expected) * 100)}%`],
                ['Room', selected.room],
              ].map(([label, value]) => (
                <div className="card" key={label} style={{ padding: 12, boxShadow: 'none' }}>
                  <div className="mini-label">{label}</div>
                  <div className="stat-card__value" style={{ fontSize: 19 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="row row--between mb-8">
                <span className="small muted">Check-in progress</span>
                <span className="small strong">
                  {selected.checked} of {selected.expected}
                </span>
              </div>
              <Progress
                value={(selected.checked / selected.expected) * 100}
                tone="green"
                size="lg"
              />
            </div>

            <div className="info-banner">
              <Icon name="shield" size={15} className="info-banner__icon" />
              QR tokens rotate every 20 seconds. If an anomaly is detected, pause check-in and
              contact the teacher.
            </div>

            <div className="row" style={{ gap: 8 }}>
              <Button
                variant={selected.qr ? 'secondary' : 'primary'}
                icon={selected.qr ? 'pause' : 'play'}
                onClick={() => {
                  toggleQr(selected.id)
                  setSelected((current) => (current ? { ...current, qr: !current.qr } : current))
                }}
              >
                {selected.qr ? 'Pause QR check-in' : 'Resume QR check-in'}
              </Button>
              <Button
                variant="ghost"
                icon="alertTriangle"
                onClick={() => {
                  toast({ type: 'error', title: 'Session flagged', text: `${selected.code} added to the review queue.` })
                  setSelected(null)
                }}
              >
                Flag for review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
