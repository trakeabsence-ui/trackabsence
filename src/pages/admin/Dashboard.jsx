import { useState } from 'react'
import { Icon } from '../../components/Icons'
import {
  Avatar,
  Badge,
  Button,
  Progress,
  StatCard,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { LineChart } from '../../components/Charts'
import {
  adminDistribution,
  adminTrend,
  alerts,
  departments,
  institution,
  kpis,
  liveSessions,
  teacherLeaderboard,
} from '../../data/mockData'
import { downloadCsv } from '../../lib/utils'
import { cn } from '../../lib/utils'

const severity = {
  high: { tone: 'red', icon: 'alertTriangle', bg: '#FEF2F2', color: '#DC2626' },
  medium: { tone: 'amber', icon: 'alertCircle', bg: '#FFFBEB', color: '#D97706' },
  low: { tone: 'blue', icon: 'info', bg: '#EFF6FF', color: '#2563EB' },
}

export default function AdminDashboard() {
  const toast = useToast()
  const [range, setRange] = useState('12w')

  const exportReport = () => {
    downloadCsv(
      'classtrack-institution-report.csv',
      departments.map((item) => ({
        Department: item.name,
        Students: item.students,
        Classes: item.classes,
        'Attendance rate': `${item.rate}%`,
        Trend: `${item.trend > 0 ? '+' : ''}${item.trend} pts`,
      })),
    )
    toast({ title: 'Institution report downloaded', text: 'Department attendance data exported as CSV.' })
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration · Fall 2026"
        title="Institution overview"
        subtitle={`${institution.name} · ${kpis.adminStudents.toLocaleString()} students · ${kpis.adminTeachers} teachers · ${kpis.adminClasses} classes`}
        actions={
          <>
            <select
              className="select"
              style={{ width: 150 }}
              value={range}
              onChange={(event) => setRange(event.target.value)}
              aria-label="Reporting period"
            >
              <option value="12w">Last 12 weeks</option>
              <option value="term">This term</option>
              <option value="month">Last 30 days</option>
            </select>
            <Button variant="primary" icon="download" onClick={exportReport}>
              Download report
            </Button>
          </>
        }
      />

      <div className="grid grid-4">
        <StatCard
          label="Total students"
          value={kpis.adminStudents.toLocaleString()}
          icon="users"
          tone="blue"
          trend="+4.2%"
          sub="vs. last term"
        />
        <StatCard
          label="Teaching staff"
          value={kpis.adminTeachers}
          icon="graduation"
          tone="purple"
          sub="76 active · 5 on leave"
        />
        <StatCard
          label="Average attendance"
          value={kpis.adminRate}
          suffix="%"
          icon="chart"
          tone="green"
          trend="+1.6 pts"
          sub="institution-wide"
        />
        <StatCard
          label="Live sessions now"
          value={kpis.liveNow}
          icon="activity"
          tone="red"
          sub={`${kpis.checkinsToday.toLocaleString()} check-ins today`}
        />
      </div>

      <div className="admin-hero mt-20">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Institution attendance trend</h3>
              <p className="card__sub">Weighted average across all departments</p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Badge tone="green" dot>+1.6 pts</Badge>
              <select className="select select--sm" style={{ width: 110 }} defaultValue="all" aria-label="Department">
                <option value="all">All depts</option>
                <option value="cs">CS</option>
                <option value="eng">Engineering</option>
              </select>
            </div>
          </div>
          <div className="card__body" style={{ paddingTop: 10 }}>
            <LineChart
              data={adminTrend}
              height={236}
              reference={{ value: 90, label: 'Target 90%' }}
              suffix="%"
            />
          </div>
          <div className="card__footer">
            <span className="chart-legend">
              <span className="chart-legend__item"><span className="legend-dot" style={{ background: '#2563EB' }} />Institution</span>
              <span className="chart-legend__item"><span className="legend-dot" style={{ background: '#CBD5E1' }} />Target</span>
            </span>
            <span className="tiny muted">Updated 2 minutes ago</span>
          </div>
        </section>

        <section className="insight-card">
          <div className="row row--between">
            <h3>Today at a glance</h3>
            <span className="live-badge">Live</span>
          </div>
          <div className="insight-card__big">
            {kpis.checkinsToday.toLocaleString()}
            <span>check-ins</span>
          </div>
          <div className="insight-card__sub">
            <span style={{ color: '#4ADE80', fontWeight: 600 }}>▲ 8.2%</span> vs. last Thursday · 96.4% QR success
          </div>
          <div className="insight-stats">
            <div className="insight-stat">
              <div className="insight-stat__label">Live sessions</div>
              <div className="insight-stat__value">18</div>
            </div>
            <div className="insight-stat">
              <div className="insight-stat__label">Avg. check-in</div>
              <div className="insight-stat__value">1.8s</div>
            </div>
            <div className="insight-stat">
              <div className="insight-stat__label">Open alerts</div>
              <div className="insight-stat__value" style={{ color: '#FCA5A5' }}>5</div>
            </div>
            <div className="insight-stat">
              <div className="insight-stat__label">Departments</div>
              <div className="insight-stat__value">6</div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Department performance</h3>
              <p className="card__sub">Attendance rate and enrollment by department</p>
            </div>
            <a className="card-link" href="#/admin/reports">Full report</a>
          </div>
          <div className="card__body">
            <div className="stack" style={{ gap: 14 }}>
              {departments.map((department) => (
                <div key={department.code}>
                  <div className="row row--between" style={{ marginBottom: 5 }}>
                    <span className="row" style={{ gap: 7 }}>
                      <span className="legend-dot" style={{ background: department.color }} />
                      <span className="small strong">{department.name}</span>
                      <span className="tiny muted">{department.students} students · {department.classes} classes</span>
                    </span>
                    <span className="row" style={{ gap: 8 }}>
                      <span className={cn('trend', department.trend >= 0 ? 'trend--up' : 'trend--down')}>
                        <Icon name={department.trend >= 0 ? 'arrowUpRight' : 'arrowDownRight'} size={11} />
                        {Math.abs(department.trend)}
                      </span>
                      <span className="small strong" style={{ width: 42, textAlign: 'right' }}>{department.rate}%</span>
                    </span>
                  </div>
                  <Progress
                    value={department.rate}
                    tone={department.rate >= 90 ? 'green' : department.rate >= 85 ? 'amber' : 'red'}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">Institution average: 91.8%</span>
            <span className="tiny muted">Target: 90%</span>
          </div>
        </section>

        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Top teachers</h3>
              <p className="card__sub">By attendance performance</p>
            </div>
            <a className="card-link" href="#/admin/teachers">All teachers</a>
          </div>
          <div className="card__body" style={{ paddingTop: 8, paddingBottom: 8 }}>
            {teacherLeaderboard.map((teacher, index) => (
              <div className="leader-row" key={teacher.id}>
                <span className="leader-rank">{index + 1}</span>
                <Avatar name={teacher.name} size="sm" color={teacher.color} />
                <div className="leader-meta">
                  <div className="leader-name">{teacher.name}</div>
                  <div className="leader-sub">{teacher.department} · {teacher.classes} classes</div>
                </div>
                <span className="leader-rate">{teacher.rate}%</span>
              </div>
            ))}
          </div>
          <div className="card__footer">
            <span className="tiny muted">Minimum 3 classes taught</span>
            <button
              type="button"
              className="card-link"
              style={{ border: 0, background: 'none' }}
              onClick={() => toast({ type: 'info', title: 'Leaderboard methodology', text: 'Weighted by class size and sessions held.' })}
            >
              How it works
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Live sessions</h3>
              <p className="card__sub">Across all departments right now</p>
            </div>
            <a className="card-link" href="#/admin/monitoring">Open monitoring</a>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Teacher</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {liveSessions.slice(0, 4).map((session) => {
                  const percent = Math.round((session.checked / session.expected) * 100)
                  return (
                    <tr key={session.id}>
                      <td>
                        <div className="cell-strong">{session.code}</div>
                        <div className="cell-muted">{session.title}</div>
                      </td>
                      <td>
                        <div className="teacher-cell">
                          <Avatar name={session.teacher} size="xs" color="#475569" />
                          <span className="small">{session.teacher}</span>
                        </div>
                      </td>
                      <td className="cell-muted">{session.room}</td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <Progress value={percent} tone={percent >= 85 ? 'green' : 'amber'} style={{ width: 52 }} />
                          <span className="small strong">{session.checked}/{session.expected}</span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={session.qr ? 'green' : 'slate'}>{session.qr ? 'On' : 'Off'}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="card__footer">
            <span className="tiny muted">4 of 18 sessions shown</span>
            <a className="card-link" href="#/admin/monitoring">
              View all 18 <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>

        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Attention required</h3>
              <p className="card__sub">Open institutional alerts</p>
            </div>
            <Badge tone="red">{alerts.length}</Badge>
          </div>
          <div className="card__body" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <div className="alert-list">
              {alerts.slice(0, 4).map((alert) => {
                const meta = severity[alert.severity]
                return (
                  <div className="alert-item" key={alert.id}>
                    <span className="alert-item__icon" style={{ background: meta.bg, color: meta.color }}>
                      <Icon name={meta.icon} size={14} />
                    </span>
                    <div>
                      <div className="alert-item__title">{alert.title}</div>
                      <div className="alert-item__text">{alert.text}</div>
                      <div className="alert-item__time">{alert.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">2 high priority</span>
            <button
              type="button"
              className="card-link"
              style={{ border: 0, background: 'none' }}
              onClick={() => toast({ title: 'Alerts acknowledged' })}
            >
              Acknowledge all
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-3 mt-20">
        <section className="card">
          <div className="card__body">
            <div className="row row--between">
              <div className="mini-label">Attendance distribution</div>
              <Icon name="pieChart" size={15} className="muted" />
            </div>
            <div className="mt-12">
              {adminDistribution.map((item) => (
                <div className="legend-row" key={item.label} style={{ marginBottom: 7 }}>
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-row__label">{item.label}</span>
                  <span className="legend-row__value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card__body">
            <div className="mini-label">At-risk population</div>
            <div className="stat-card__value mt-8">146 <span>students</span></div>
            <div className="tiny muted mt-4">6.0% of total enrollment</div>
            <Progress value={6} tone="red" className="mt-12" />
            <div className="row row--between mt-8">
              <span className="tiny muted">Last term: 172</span>
              <span className="trend trend--up"><Icon name="arrowDownRight" size={11} /> 15%</span>
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card__body">
            <div className="mini-label">Data quality</div>
            <div className="stat-card__value mt-8">98.2 <span>%</span></div>
            <div className="tiny muted mt-4">Sessions with complete attendance</div>
            <div className="row mt-12" style={{ gap: 6 }}>
              <Badge tone="green" dot>Healthy</Badge>
              <Badge tone="slate">1,946 sessions</Badge>
            </div>
            <a className="card-link mt-12" href="#/admin/reports" style={{ display: 'inline-flex' }}>
              Review data quality <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
