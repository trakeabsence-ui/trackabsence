import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icons'
import { Avatar, Badge, Button, RateCell, useToast } from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { BarChart, ChartLegend, Donut, LineChart } from '../../components/Charts'
import {
  atRiskStudents,
  classReports,
  classes,
  teacherDistribution,
  teacherTrend,
  weeklyAttendance,
} from '../../data/mockData'
import { downloadCsv, formatPct } from '../../lib/utils'

export default function TeacherReports() {
  const toast = useToast()
  const [classFilter, setClassFilter] = useState('all')
  const [range, setRange] = useState('term')
  const [term, setTerm] = useState('fall')

  const filtered = useMemo(
    () => (classFilter === 'all' ? classReports : classReports.filter((item) => item.classId === classFilter)),
    [classFilter],
  )

  const totals = useMemo(
    () =>
      filtered.reduce(
        (accumulator, item) => ({
          present: accumulator.present + item.present,
          late: accumulator.late + item.late,
          absent: accumulator.absent + item.absent,
          sessions: accumulator.sessions + item.sessions,
        }),
        { present: 0, late: 0, absent: 0, sessions: 0 },
      ),
    [filtered],
  )

  const rate = totals.present + totals.late + totals.absent > 0
    ? (((totals.present + totals.late * 0.5) / (totals.present + totals.late + totals.absent)) * 100).toFixed(1)
    : '—'

  const exportCsv = () => {
    downloadCsv(
      'classtrack-attendance-report.csv',
      filtered.map((item) => ({
        Class: item.code,
        Course: item.title,
        Students: item.students,
        Sessions: item.sessions,
        Present: item.present,
        Late: item.late,
        Absent: item.absent,
        'Attendance rate': formatPct(item.rate),
        Trend: `${item.trend > 0 ? '+' : ''}${item.trend} pts`,
      })),
    )
    toast({ title: 'Report exported', text: `${filtered.length} class rows downloaded as CSV.` })
  }

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Attendance reports"
        subtitle="Understand attendance patterns, spot at-risk students and export accreditation-ready reports."
        actions={
          <>
            <Button icon="download" onClick={exportCsv}>
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon="fileText"
              onClick={() =>
                toast({
                  type: 'info',
                  title: 'Generating PDF report',
                  text: 'A formatted report with charts will download in a few seconds.',
                })
              }
            >
              Download PDF
            </Button>
          </>
        }
      />

      <div className="filter-bar mb-20">
        <span className="filter-bar__label">
          <Icon name="filter" size={14} /> Filters
        </span>
        <select className="select select--sm" style={{ width: 130 }} value={term} onChange={(event) => setTerm(event.target.value)} aria-label="Term">
          <option value="fall">Fall 2026</option>
          <option value="spring">Spring 2026</option>
          <option value="fall25">Fall 2025</option>
        </select>
        <select className="select select--sm" style={{ width: 170 }} value={range} onChange={(event) => setRange(event.target.value)} aria-label="Date range">
          <option value="term">Aug 31 – Dec 18, 2026</option>
          <option value="month">Last 30 days</option>
          <option value="week">Last 7 days</option>
          <option value="custom">Custom range…</option>
        </select>
        <select className="select select--sm" style={{ width: 190 }} value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Class">
          <option value="all">All classes</option>
          {classes.filter((item) => item.status === 'active').map((item) => (
            <option key={item.id} value={item.id}>{item.code} · {item.title}</option>
          ))}
        </select>
        <span className="toolbar__spacer" />
        <span className="row tiny muted" style={{ gap: 5 }}>
          <span className="status-dot" /> Data refreshed 2 min ago
        </span>
        <Button
          size="sm"
          variant="ghost"
          icon="refresh"
          onClick={() => toast({ title: 'Report refreshed', text: 'Latest attendance records loaded.' })}
        >
          Refresh
        </Button>
      </div>

      <div className="kpi-strip">
        <div className="kpi-cell">
          <div className="kpi-cell__label">Attendance rate</div>
          <div className="kpi-cell__value">{rate}<span>%</span></div>
          <div className="kpi-cell__foot"><span className="trend trend--up"><Icon name="arrowUpRight" size={11} /> +2.1 pts</span> vs. last month</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Sessions held</div>
          <div className="kpi-cell__value">{totals.sessions}</div>
          <div className="kpi-cell__foot">3 cancelled · excluded</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Present records</div>
          <div className="kpi-cell__value">{totals.present.toLocaleString()}</div>
          <div className="kpi-cell__foot">86.4% of all records</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Late records</div>
          <div className="kpi-cell__value">{totals.late}</div>
          <div className="kpi-cell__foot">Average 11 min late</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Absent records</div>
          <div className="kpi-cell__value">{totals.absent}</div>
          <div className="kpi-cell__foot">5.8% of all records</div>
        </div>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Attendance over time</h3>
              <p className="card__sub">
                {classFilter === 'all' ? 'All classes' : classes.find((item) => item.id === classFilter)?.code} ·{' '}
                {range === 'term' ? 'Fall 2026' : range === 'month' ? 'Last 30 days' : 'Last 7 days'}
              </p>
            </div>
            <Badge tone="green" dot>Above target</Badge>
          </div>
          <div className="card__body" style={{ paddingTop: 12 }}>
            <LineChart data={teacherTrend} reference={{ value: 90, label: 'Target 90%' }} height={250} />
          </div>
          <div className="card__footer">
            <span className="chart-legend">
              <span className="chart-legend__item"><span className="legend-dot" style={{ background: '#2563EB' }} />Attendance</span>
              <span className="chart-legend__item"><span className="legend-dot" style={{ background: '#CBD5E1' }} />Institutional target</span>
            </span>
            <span className="tiny muted">Excludes cancelled sessions</span>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Record distribution</h3>
              <p className="card__sub">{totals.present + totals.late + totals.absent} records</p>
            </div>
          </div>
          <div className="card__body">
            <div className="donut-wrap" style={{ justifyContent: 'center' }}>
              <Donut data={teacherDistribution} size={148} thickness={19} centerValue={`${rate}%`} centerLabel="Attendance" />
            </div>
            <div className="legend-list mt-16">
              {teacherDistribution.map((item) => (
                <div className="legend-row" key={item.label}>
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-row__label">{item.label}</span>
                  <span className="legend-row__value">{item.value}%</span>
                  <span className="legend-row__pct">
                    {Math.round(((totals.present + totals.late + totals.absent) * item.value) / 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Attendance by weekday</h3>
              <p className="card__sub">Present, late and absent records this week</p>
            </div>
            <ChartLegend
              items={[
                { label: 'Present', color: '#2563EB' },
                { label: 'Late', color: '#D97706' },
                { label: 'Absent', color: '#DC2626' },
              ]}
            />
          </div>
          <div className="card__body" style={{ paddingTop: 12 }}>
            <BarChart data={weeklyAttendance} height={230} />
          </div>
          <div className="card__footer">
            <span className="tiny muted">Friday sessions consistently show the lowest turnout.</span>
            <button
              type="button"
              className="card-link"
              style={{ border: 0, background: 'none' }}
              onClick={() => toast({ type: 'info', title: 'Insight saved to report notes' })}
            >
              Add note <Icon name="arrowRight" size={12} />
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Students at risk</h3>
              <p className="card__sub">Below 75% attendance</p>
            </div>
            <Badge tone="red">{atRiskStudents.length}</Badge>
          </div>
          <div className="card__body" style={{ paddingTop: 8, paddingBottom: 8 }}>
            <div className="risk-list">
              {atRiskStudents.slice(0, 5).map((student) => (
                <div className="risk-item" key={student.id}>
                  <Avatar name={student.name} size="sm" color={student.color} />
                  <div className="risk-item__meta">
                    <div className="risk-item__name">{student.name}</div>
                    <div className="risk-item__sub">{student.classCode} · {student.absences} absences</div>
                  </div>
                  <span className="risk-item__rate">{formatPct(student.attendance)}</span>
                  <IconButtonMail onClick={() => toast({ title: 'Reminder sent', text: `${student.name} received an attendance nudge.` })} />
                </div>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">Threshold: 75% · 4 consecutive absences</span>
            <a className="card-link" href="#/teacher/students">
              Manage <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>
      </div>

      <section className="card mt-20">
        <div className="card__header card__header--bordered">
          <div>
            <h3 className="card__title">Class performance</h3>
            <p className="card__sub">Attendance summary for {term === 'fall' ? 'Fall 2026' : term === 'spring' ? 'Spring 2026' : 'Fall 2025'}</p>
          </div>
          <Button size="sm" icon="download" onClick={exportCsv}>Export table</Button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Students</th>
                <th>Sessions</th>
                <th>Present</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Attendance rate</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.classId}>
                  <td>
                    <div className="cell-strong">{item.code}</div>
                    <div className="cell-muted">{item.title}</div>
                  </td>
                  <td>{item.students}</td>
                  <td>{item.sessions}</td>
                  <td>{item.present}</td>
                  <td>{item.late}</td>
                  <td>{item.absent}</td>
                  <td><RateCell value={item.rate} /></td>
                  <td>
                    <span className={item.trend >= 0 ? 'trend trend--up' : 'trend trend--down'}>
                      <Icon name={item.trend >= 0 ? 'arrowUpRight' : 'arrowDownRight'} size={12} />
                      {Math.abs(item.trend)} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>{filtered.length} classes · {totals.sessions} sessions · {totals.present + totals.late + totals.absent} records</span>
          <span className="tiny muted">Cancelled sessions and excused absences excluded from rate</span>
        </div>
      </section>

      <div className="grid grid-2 mt-20">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Key insights</h3>
              <p className="card__sub">Generated from the current filter selection</p>
            </div>
            <Icon name="sparkles" size={17} color="#7C3AED" />
          </div>
          <div className="card__body">
            <div className="stack" style={{ gap: 10 }}>
              <div className="info-banner info-banner--green">
                <Icon name="trendingUp" size={15} className="info-banner__icon" />
                CS-410 has the strongest attendance at 95.2%, up 3.8 points since October.
              </div>
              <div className="info-banner info-banner--amber">
                <Icon name="alertTriangle" size={15} className="info-banner__icon" />
                CS-220 is below the 85% threshold. Friday sessions are the main driver.
              </div>
              <div className="info-banner">
                <Icon name="clock" size={15} className="info-banner__icon" />
                41% of late arrivals occur in the first 10 minutes after the grace window closes.
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Report settings</h3>
              <p className="card__sub">What is included in exports</p>
            </div>
          </div>
          <div className="card__body">
            <div className="switch-row">
              <div>
                <div className="switch-row__title">Include student-level detail</div>
                <div className="switch-row__text">Adds a per-student appendix to PDF exports.</div>
              </div>
              <input type="checkbox" className="checkbox" defaultChecked />
            </div>
            <div className="switch-row">
              <div>
                <div className="switch-row__title">Show at-risk section</div>
                <div className="switch-row__text">Lists students below the institutional threshold.</div>
              </div>
              <input type="checkbox" className="checkbox" defaultChecked />
            </div>
            <div className="switch-row">
              <div>
                <div className="switch-row__title">Include cancelled sessions</div>
                <div className="switch-row__text">Adds a footnote with cancellation reasons.</div>
              </div>
              <input type="checkbox" className="checkbox" />
            </div>
            <Button
              variant="secondary"
              className="btn--block mt-16"
              icon="fileText"
              onClick={() => toast({ title: 'Report preferences saved' })}
            >
              Save preferences
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}

function IconButtonMail({ onClick }) {
  return (
    <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} aria-label="Send reminder" onClick={onClick}>
      <Icon name="mail" size={14} />
    </button>
  )
}
