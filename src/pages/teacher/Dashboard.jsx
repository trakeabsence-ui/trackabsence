import { Icon } from '../../components/Icons'
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Progress,
  RateCell,
  StatCard,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { navigate } from '../../lib/navigation'
import { Donut, LineChart, ProgressRing } from '../../components/Charts'
import {
  atRiskStudents,
  currentSession,
  currentUser,
  students,
  teacherDistribution,
  teacherTrend,
  todaySchedule,
} from '../../data/mockData'
import { formatPct, rateTone } from '../../lib/utils'

const classStudents = students.filter((student) => student.classId === 'cs301')

export default function TeacherDashboard() {
  const toast = useToast()
  const checkedIn = currentSession.present + currentSession.late
  const progress = Math.round((checkedIn / currentSession.expected) * 100)

  return (
    <>
      <PageHeader
        eyebrow="Thursday, November 26 · Week 13"
        title={`Good morning, ${currentUser.firstName}`}
        subtitle="CS-301 is live and 33 of 42 students have checked in. You have one more session today at 16:00."
        actions={
          <>
            <Button
              icon="download"
              onClick={() =>
                toast({
                  type: 'info',
                  title: 'Daily summary exported',
                  text: 'The attendance summary for November 26 is downloading.',
                })
              }
            >
              Export day
            </Button>
            <Button variant="primary" icon="qr" onClick={() => navigate('/teacher/attendance')}>
              Open live session
            </Button>
          </>
        }
      />

      <section className="hero-session">
        <div className="hero-session__main">
          <div className="hero-session__kicker">
            <span className="live-badge">Live now</span>
            <span className="hero-session__code">{currentSession.code}</span>
            <span style={{ color: '#64748B', fontSize: 11 }}>·</span>
            <span style={{ color: '#94A3B8', fontSize: 11.5 }}>
              {currentSession.date} · {currentSession.start}–{currentSession.end}
            </span>
          </div>
          <h2>{currentSession.title}</h2>
          <div className="hero-session__meta">
            <span>
              <Icon name="mapPin" size={13} /> Room {currentSession.room}
            </span>
            <span>
              <Icon name="clock" size={13} /> {currentSession.elapsed} elapsed · {currentSession.remaining} left
            </span>
            <span>
              <Icon name="users" size={13} /> {currentSession.expected} enrolled
            </span>
          </div>

          <div className="hero-session__progress">
            <div className="hero-session__progress-top">
              <span>{checkedIn} students checked in</span>
              <span>{progress}% of roster</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="hero-session__attendees">
            <AvatarStack people={classStudents.slice(0, 6)} size="xs" max={6} />
            <span>
              {currentSession.present} present · {currentSession.late} late ·{' '}
              <span style={{ color: '#FCA5A5' }}>{currentSession.expected - checkedIn} not checked in</span>
            </span>
          </div>
        </div>

        <div className="hero-session__side">
          <ProgressRing value={progress} size={96} stroke={8} label={`${progress}%`} sub="checked in" />
          <div className="hero-session__actions">
            <Button variant="white" size="sm" iconRight="arrowRight" onClick={() => navigate('/teacher/attendance')}>
              Manage
            </Button>
            <Button variant="on-dark" size="sm" icon="qr" onClick={() => navigate('/teacher/attendance')}>
              QR
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-4 mt-20">
        <StatCard
          label="Total students"
          value="180"
          icon="users"
          tone="blue"
          trend="+12"
          trendTone="up"
          sub="across 5 classes"
        />
        <StatCard
          label="Average attendance"
          value="92.4"
          suffix="%"
          icon="chart"
          tone="green"
          trend="+2.1 pts"
          trendTone="up"
          sub="vs. October"
        />
        <StatCard
          label="Sessions this week"
          value="9"
          icon="calendar"
          tone="purple"
          sub="13.5 teaching hours"
        />
        <StatCard
          label="At-risk students"
          value={atRiskStudents.length}
          icon="alertTriangle"
          tone="red"
          sub="below the 75% threshold"
        />
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Attendance trend</h3>
              <p className="card__sub">Weighted average across all active classes</p>
            </div>
            <select className="select select--sm" style={{ width: 120 }} defaultValue="term" aria-label="Trend range">
              <option value="term">This term</option>
              <option value="month">Last month</option>
              <option value="week">This week</option>
            </select>
          </div>
          <div className="card__body" style={{ paddingTop: 12 }}>
            <LineChart data={teacherTrend} reference={{ value: 90, label: 'Target 90%' }} />
          </div>
          <div className="card__footer">
            <span className="chart-legend">
              <span className="chart-legend__item">
                <span className="legend-dot" style={{ background: '#2563EB' }} />
                Weighted attendance
              </span>
              <span className="chart-legend__item">
                <span className="legend-dot" style={{ background: '#CBD5E1' }} />
                Target 90%
              </span>
            </span>
            <span className="trend trend--up">
              <Icon name="arrowUpRight" size={13} />
              2.1 pts
            </span>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Status breakdown</h3>
              <p className="card__sub">This term · 1,842 records</p>
            </div>
            <Icon name="pieChart" size={17} className="muted" />
          </div>
          <div className="card__body">
            <div className="donut-wrap">
              <Donut data={teacherDistribution} size={152} thickness={19} centerValue="92.4%" centerLabel="Attendance" />
              <div className="legend-list">
                {teacherDistribution.map((item) => (
                  <div className="legend-row" key={item.label}>
                    <span className="legend-dot" style={{ background: item.color }} />
                    <span className="legend-row__label">{item.label}</span>
                    <span className="legend-row__value">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider mt-16 mb-12" />
            <div className="mini-label">Top absence reasons</div>
            <div className="stack" style={{ gap: 8, marginTop: 9 }}>
              {[
                ['Medical appointment', 38],
                ['Family emergency', 24],
                ['Academic conflict', 21],
                ['Unexcused', 17],
              ].map(([reason, share]) => (
                <div className="row row--between" key={reason}>
                  <span className="tiny muted">{reason}</span>
                  <span className="row" style={{ gap: 8 }}>
                    <Progress value={share} tone="amber" style={{ width: 64 }} />
                    <span className="tiny strong" style={{ width: 28, textAlign: 'right' }}>
                      {share}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">Excused absences excluded from rate</span>
            <a className="card-link" href="#/teacher/reports">
              Reports <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Today&apos;s schedule</h3>
              <p className="card__sub">Thursday, November 26 · 2 classes, 1 meeting</p>
            </div>
            <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => navigate('/teacher/timetable')}>
              Timetable
            </Button>
          </div>
          <div className="card__body">
            <div className="session-list">
              {todaySchedule.map((item) => (
                <div
                  className={`session-item ${item.status === 'live' ? 'is-live' : ''} ${
                    item.status === 'meeting' ? 'is-muted' : ''
                  }`}
                  key={item.id}
                >
                  <div className="session-time">
                    {item.time}
                    <span>{item.end}</span>
                  </div>
                  <div className="session-item__main">
                    <div className="session-item__title">
                      {item.code !== 'MEET' && <span className="mono muted" style={{ marginRight: 7 }}>{item.code}</span>}
                      {item.title}
                    </div>
                    <div className="session-item__meta">
                      <span className="row" style={{ gap: 4 }}>
                        <Icon name="mapPin" size={11} />
                        {item.room}
                      </span>
                      <span>{item.meta}</span>
                    </div>
                  </div>
                  {item.status === 'live' ? (
                    <span className="live-badge live-badge--light">Live</span>
                  ) : item.status === 'meeting' ? (
                    <Badge tone="slate">Meeting</Badge>
                  ) : (
                    <Badge tone="blue">Upcoming</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">
              <Icon name="clock" size={12} className="inline-icon" /> Next session starts in 6h 18m
            </span>
            <a className="card-link" href="#/teacher/attendance">
              Open attendance <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>

        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Students needing attention</h3>
              <p className="card__sub">Below 75% attendance</p>
            </div>
            <Badge tone="red">{atRiskStudents.length}</Badge>
          </div>
          <div className="card__body" style={{ paddingTop: 8, paddingBottom: 8 }}>
            <div className="risk-list">
              {atRiskStudents.slice(0, 4).map((student) => (
                <a className="risk-item" href="#/teacher/students" key={student.id}>
                  <Avatar name={student.name} size="sm" color={student.color} />
                  <div className="risk-item__meta">
                    <div className="risk-item__name">{student.name}</div>
                    <div className="risk-item__sub">
                      {student.classCode} · {student.absences} absences
                    </div>
                  </div>
                  <span className="risk-item__rate">{formatPct(student.attendance)}</span>
                  <Icon name="chevronRight" size={14} className="muted" />
                </a>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">Updated 4 minutes ago</span>
            <a className="card-link" href="#/teacher/students">
              View all <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Class performance</h3>
              <p className="card__sub">Attendance rate per active class</p>
            </div>
            <a className="card-link" href="#/teacher/reports">
              Full report <Icon name="arrowRight" size={12} />
            </a>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Students</th>
                  <th>Attendance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: 'CS-301', title: 'Advanced Data Structures', students: 42, rate: 92.4 },
                  { code: 'CS-305', title: 'Database Systems', students: 38, rate: 88.1 },
                  { code: 'CS-410', title: 'Human-Computer Interaction', students: 31, rate: 95.2 },
                  { code: 'CS-220', title: 'Web Engineering', students: 45, rate: 84.7 },
                  { code: 'CS-499', title: 'Capstone Project', students: 24, rate: 90.3 },
                ].map((item) => (
                  <tr key={item.code}>
                    <td>
                      <div className="cell-strong">{item.code}</div>
                      <div className="cell-muted">{item.title}</div>
                    </td>
                    <td>{item.students}</td>
                    <td>
                      <RateCell value={item.rate} />
                    </td>
                    <td>
                      <Badge tone={rateTone(item.rate)} dot>
                        {item.rate >= 90 ? 'On track' : item.rate >= 85 ? 'Stable' : 'Needs review'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Quick actions</h3>
              <p className="card__sub">Common teacher tasks</p>
            </div>
          </div>
          <div className="card__body">
            <div className="quick-actions">
              <button type="button" className="quick-action" onClick={() => navigate('/teacher/attendance')}>
                <span className="quick-action__icon">
                  <Icon name="clipboardCheck" size={15} />
                </span>
                Mark attendance
              </button>
              <button type="button" className="quick-action" onClick={() => navigate('/teacher/students')}>
                <span className="quick-action__icon">
                  <Icon name="upload" size={15} />
                </span>
                Import roster
              </button>
              <button type="button" className="quick-action" onClick={() => navigate('/teacher/timetable')}>
                <span className="quick-action__icon">
                  <Icon name="sparkles" size={15} />
                </span>
                AI timetable
              </button>
              <button type="button" className="quick-action" onClick={() => navigate('/teacher/reports')}>
                <span className="quick-action__icon">
                  <Icon name="download" size={15} />
                </span>
                Export report
              </button>
            </div>
            <div className="info-banner mt-16">
              <Icon name="sparkles" size={15} className="info-banner__icon" />
              <span>
                <strong>Insight:</strong> Friday CS-220 sessions average 8% lower attendance. Consider
                a short recap at the start.
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
