import { useState } from 'react'
import { Icon } from '../../components/Icons'
import { Avatar, Badge, Button, Progress, RateCell, useToast } from '../../components/ui'
import { SessionStatusBadge } from '../../components/Layout'
import { navigate } from '../../lib/navigation'
import { Donut, LineChart } from '../../components/Charts'
import {
  classById,
  sessionHistory,
  studentsByClass,
  teacherDistribution,
  teacherTrend,
  timetable,
} from '../../data/mockData'
import { formatPct, riskMeta } from '../../lib/utils'
import { cn } from '../../lib/utils'

export default function ClassDetail({ classId }) {
  const toast = useToast()
  const cls = classById(classId)
  const [tab, setTab] = useState('overview')

  if (!cls) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state__icon">
            <Icon name="book" size={22} />
          </div>
          <h3>Class not found</h3>
          <p>This class may have been archived or removed.</p>
          <Button className="mt-16" onClick={() => navigate('/teacher/classes')}>
            Back to classes
          </Button>
        </div>
      </div>
    )
  }

  const roster = studentsByClass(cls.id)
  const riskCount = roster.filter((student) => student.risk === 'at_risk' || student.risk === 'critical').length
  const trend = teacherTrend.map((point, index) => ({
    ...point,
    value: Math.max(70, Math.min(100, point.value + (cls.attendance - 92.4) + ((index % 3) - 1) * 0.4)),
  }))
  const classSchedule = timetable.filter((entry) => entry.classId === cls.id)

  return (
    <>
      <div className="row row--between row--wrap" style={{ marginBottom: 16 }}>
        <a className="card-link" href="#/teacher/classes">
          <Icon name="arrowLeft" size={13} /> All classes
        </a>
        <div className="row" style={{ gap: 8 }}>
          <Button
            icon="edit"
            size="sm"
            onClick={() => toast({ type: 'info', title: 'Edit class', text: 'Class settings opened in demo mode.' })}
          >
            Edit class
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="play"
            onClick={() => navigate('/teacher/attendance')}
          >
            Start session
          </Button>
        </div>
      </div>

      <section className="class-detail-hero" style={{ '--class-color': cls.color }}>
        <div className="row" style={{ gap: 8 }}>
          <span
            className="class-code"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#93C5FD', border: '1px solid rgba(147,197,253,0.25)' }}
          >
            {cls.code}
          </span>
          <span className="badge" style={{ background: 'rgba(34,197,94,0.14)', color: '#86EFAC', border: '1px solid rgba(134,239,172,0.3)' }}>
            <span className="badge__dot" /> Active
          </span>
          <span className="tiny" style={{ color: '#64748B' }}>{cls.term}</span>
        </div>
        <h1>{cls.title}</h1>
        <p style={{ color: '#94A3B8', fontSize: 12.5, marginTop: 6, maxWidth: 640 }}>{cls.description}</p>
        <div className="class-detail-hero__meta">
          <span>
            <Icon name="calendar" size={13} /> {cls.schedule}
          </span>
          <span>
            <Icon name="mapPin" size={13} /> Room {cls.room}
          </span>
          <span>
            <Icon name="user" size={13} /> {cls.teacher}
          </span>
        </div>

        <div className="class-detail-stats">
          <div className="class-detail-stat">
            <div className="class-detail-stat__label">Students</div>
            <div className="class-detail-stat__value">{cls.students}</div>
          </div>
          <div className="class-detail-stat">
            <div className="class-detail-stat__label">Attendance</div>
            <div className="class-detail-stat__value">{cls.attendance}%</div>
          </div>
          <div className="class-detail-stat">
            <div className="class-detail-stat__label">Sessions held</div>
            <div className="class-detail-stat__value">{cls.sessions}</div>
          </div>
          <div className="class-detail-stat">
            <div className="class-detail-stat__label">At risk</div>
            <div className="class-detail-stat__value" style={{ color: riskCount > 0 ? '#FCA5A5' : '#fff' }}>
              {riskCount}
            </div>
          </div>
        </div>
      </section>

      <div className="tabs mt-20">
        {[
          ['overview', 'Overview', null],
          ['students', 'Students', cls.students],
          ['sessions', 'Sessions', cls.sessions],
        ].map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            className={cn('tab', tab === key && 'is-active')}
            onClick={() => setTab(key)}
          >
            {label}
            {count !== null && <span className="tab__count">{count}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-2-1 mt-20">
            <section className="card">
              <div className="card__header">
                <div>
                  <h3 className="card__title">Attendance trend</h3>
                  <p className="card__sub">{cls.code} · last 9 weeks</p>
                </div>
                <Badge tone={cls.attendance >= 90 ? 'green' : 'amber'} dot>
                  {cls.attendance >= 90 ? 'On track' : 'Monitor'}
                </Badge>
              </div>
              <div className="card__body" style={{ paddingTop: 12 }}>
                <LineChart data={trend} reference={{ value: 90, label: 'Target 90%' }} />
              </div>
            </section>

            <section className="card">
              <div className="card__header">
                <div>
                  <h3 className="card__title">Status breakdown</h3>
                  <p className="card__sub">{cls.sessions} sessions · this term</p>
                </div>
              </div>
              <div className="card__body">
                <div className="donut-wrap" style={{ justifyContent: 'center' }}>
                  <Donut
                    data={teacherDistribution}
                    size={140}
                    thickness={18}
                    centerValue={`${cls.attendance}%`}
                    centerLabel="Attendance"
                  />
                </div>
                <div className="legend-list mt-16">
                  {teacherDistribution.map((item) => (
                    <div className="legend-row" key={item.label}>
                      <span className="legend-dot" style={{ background: item.color }} />
                      <span className="legend-row__label">{item.label}</span>
                      <span className="legend-row__value">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-2 mt-20">
            <section className="card">
              <div className="card__header card__header--bordered">
                <div>
                  <h3 className="card__title">Weekly schedule</h3>
                  <p className="card__sub">Recurring sessions this term</p>
                </div>
                <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => navigate('/teacher/timetable')}>
                  Timetable
                </Button>
              </div>
              <div className="card__body">
                <div className="session-list">
                  {classSchedule.map((entry) => (
                    <div className="session-item" key={entry.id}>
                      <div className="session-time">
                        {entry.start}
                        <span>{entry.end}</span>
                      </div>
                      <div className="session-item__main">
                        <div className="session-item__title">{entry.day} session</div>
                        <div className="session-item__meta">
                          <span>
                            <Icon name="mapPin" size={11} /> {entry.room}
                          </span>
                          <span>{cls.students} students</span>
                        </div>
                      </div>
                      <Badge tone="blue">Weekly</Badge>
                    </div>
                  ))}
                  {classSchedule.length === 0 && (
                    <div className="tiny muted">No recurring sessions configured.</div>
                  )}
                </div>
              </div>
              <div className="card__footer">
                <span className="tiny muted">Next: {cls.nextSession}</span>
                <a className="card-link" href="#/teacher/attendance">
                  Start attendance <Icon name="arrowRight" size={12} />
                </a>
              </div>
            </section>

            <section className="card">
              <div className="card__header card__header--bordered">
                <div>
                  <h3 className="card__title">Students needing attention</h3>
                  <p className="card__sub">Below 75% attendance in this class</p>
                </div>
                <Badge tone={riskCount > 0 ? 'red' : 'green'}>{riskCount}</Badge>
              </div>
              <div className="card__body" style={{ paddingTop: 8, paddingBottom: 8 }}>
                <div className="risk-list">
                  {roster
                    .filter((student) => student.risk === 'at_risk' || student.risk === 'critical')
                    .slice(0, 4)
                    .map((student) => (
                      <div className="risk-item" key={student.id}>
                        <Avatar name={student.name} size="sm" color={student.color} />
                        <div className="risk-item__meta">
                          <div className="risk-item__name">{student.name}</div>
                          <div className="risk-item__sub">{student.absences} absences · {student.late} late</div>
                        </div>
                        <span className="risk-item__rate">{formatPct(student.attendance)}</span>
                      </div>
                    ))}
                  {riskCount === 0 && (
                    <div className="tiny muted" style={{ padding: '10px 0' }}>
                      All students are above the attendance threshold. Nice work.
                    </div>
                  )}
                </div>
              </div>
              <div className="card__footer">
                <span className="tiny muted">Threshold: 75%</span>
                <button
                  type="button"
                  className="card-link"
                  style={{ border: 0, background: 'none' }}
                  onClick={() => setTab('students')}
                >
                  View roster <Icon name="arrowRight" size={12} />
                </button>
              </div>
            </section>
          </div>
        </>
      )}

      {tab === 'students' && (
        <section className="card mt-20">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Class roster</h3>
              <p className="card__sub">{roster.length} students · {cls.program ?? 'Computer Science'}</p>
            </div>
            <Button
              size="sm"
              icon="upload"
              onClick={() => toast({ type: 'info', title: 'Roster import', text: 'Open Students → Import to upload a file.' })}
            >
              Import
            </Button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Attendance</th>
                  <th>Absences</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {roster.slice(0, 12).map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="user-cell">
                        <Avatar name={student.name} size="sm" color={student.color} />
                        <div>
                          <div className="user-cell__name">{student.name}</div>
                          <div className="user-cell__sub">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono cell-muted">{student.number}</td>
                    <td><RateCell value={student.attendance} /></td>
                    <td>{student.absences}</td>
                    <td>
                      <Badge tone={riskMeta[student.risk].tone} dot>
                        {riskMeta[student.risk].label}
                      </Badge>
                    </td>
                    <td>
                      <div className="table-actions">
                        <IconButtonView />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {Math.min(12, roster.length)} of {cls.students} students</span>
            <a className="card-link" href="#/teacher/students">
              Open full roster <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>
      )}

      {tab === 'sessions' && (
        <section className="card mt-20">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Session history</h3>
              <p className="card__sub">Recent sessions and attendance outcomes</p>
            </div>
            <Button size="sm" icon="plus" variant="primary" onClick={() => navigate('/teacher/attendance')}>
              New session
            </Button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessionHistory.map((session) => (
                  <tr key={session.id}>
                    <td className="cell-strong">{session.date}</td>
                    <td className="cell-muted">{session.time}</td>
                    <td>{session.present}</td>
                    <td>{session.late}</td>
                    <td>{session.absent}</td>
                    <td>
                      {session.rate === null ? (
                        <span className="muted">—</span>
                      ) : (
                        <div className="row" style={{ gap: 8 }}>
                          <Progress value={session.rate} tone={session.rate >= 90 ? 'green' : 'amber'} style={{ width: 56 }} />
                          <span className="strong">{session.rate}%</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <SessionStatusBadge status={session.status} />
                      {session.note && <div className="cell-muted mt-4">{session.note}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>{cls.sessions} sessions held this term</span>
            <span className="tiny muted">Cancelled sessions excluded from attendance rate</span>
          </div>
        </section>
      )}
    </>
  )
}

function IconButtonView() {
  return (
    <a
      href="#/teacher/students"
      className="icon-btn"
      aria-label="View student"
      style={{ width: 30, height: 30 }}
    >
      <Icon name="chevronRight" size={15} />
    </a>
  )
}
