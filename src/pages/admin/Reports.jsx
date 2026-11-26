import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icons'
import { Badge, Button, Progress, RateCell, useToast } from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { BarChart, ChartLegend, Donut, LineChart } from '../../components/Charts'
import {
  adminDistribution,
  adminTrend,
  atRiskStudents,
  classReports,
  departments,
  kpis,
  weeklyAttendance,
} from '../../data/mockData'
import { downloadCsv } from '../../lib/utils'
import { cn } from '../../lib/utils'

const reportCards = [
  {
    id: 'accreditation',
    icon: 'shield',
    tone: 'blue',
    title: 'Accreditation report',
    text: 'Institution-wide attendance evidence with department breakdowns and term comparisons.',
    meta: 'PDF · 18 pages · Fall 2026',
  },
  {
    id: 'department',
    icon: 'building',
    tone: 'green',
    title: 'Department summary',
    text: 'Attendance rates, session counts and at-risk populations for each department.',
    meta: 'CSV · 6 departments · updated today',
  },
  {
    id: 'risk',
    icon: 'alertTriangle',
    tone: 'red',
    title: 'At-risk register',
    text: 'Students below the institutional threshold, with advisor and intervention status.',
    meta: 'CSV · 146 students · 75% threshold',
  },
]

export default function AdminReports() {
  const toast = useToast()
  const [term, setTerm] = useState('fall')
  const [range, setRange] = useState('term')
  const [department, setDepartment] = useState('all')

  const visibleDepartments = useMemo(
    () => (department === 'all' ? departments : departments.filter((item) => item.name === department)),
    [department],
  )

  const totals = useMemo(
    () =>
      visibleDepartments.reduce(
        (accumulator, item) => ({
          students: accumulator.students + item.students,
          classes: accumulator.classes + item.classes,
        }),
        { students: 0, classes: 0 },
      ),
    [visibleDepartments],
  )

  const weightedRate = useMemo(() => {
    if (visibleDepartments.length === 0) return 0
    const total = visibleDepartments.reduce((sum, item) => sum + item.rate * item.students, 0)
    return (total / totals.students).toFixed(1)
  }, [visibleDepartments, totals.students])

  const exportDepartmentReport = () => {
    downloadCsv(
      'classtrack-department-report.csv',
      visibleDepartments.map((item) => ({
        Department: item.name,
        Code: item.code,
        Students: item.students,
        Classes: item.classes,
        'Attendance rate': `${item.rate}%`,
        'Trend (pts)': item.trend,
        'At-risk students': Math.round((item.students * (100 - item.rate)) / 100),
      })),
    )
    toast({ title: 'Department report exported', text: `${visibleDepartments.length} departments downloaded as CSV.` })
  }

  const exportClassReport = () => {
    downloadCsv(
      'classtrack-class-report.csv',
      classReports.map((item) => ({
        Class: item.code,
        Course: item.title,
        Students: item.students,
        Sessions: item.sessions,
        Present: item.present,
        Late: item.late,
        Absent: item.absent,
        'Attendance rate': `${item.rate}%`,
        Trend: `${item.trend > 0 ? '+' : ''}${item.trend} pts`,
      })),
    )
    toast({ title: 'Class report exported', text: 'Attendance data for all demo classes downloaded.' })
  }

  const runReport = (id) => {
    if (id === 'department') {
      exportDepartmentReport()
      return
    }
    if (id === 'risk') {
      downloadCsv(
        'classtrack-at-risk-register.csv',
        atRiskStudents.map((student) => ({
          Student: student.name,
          'Student ID': student.number,
          Class: student.classCode,
          Program: student.program,
          'Attendance rate': `${student.attendance}%`,
          Absences: student.absences,
          'Late arrivals': student.late,
        })),
      )
      toast({ title: 'At-risk register exported', text: `${atRiskStudents.length} students downloaded.` })
      return
    }
    toast({
      type: 'info',
      title: 'Generating accreditation report',
      text: 'A formatted PDF with charts and appendices will download in a few seconds.',
    })
  }

  const termLabel = term === 'fall' ? 'Fall 2026' : term === 'spring' ? 'Spring 2026' : 'Fall 2025'
  const rangeLabel =
    range === 'term' ? 'Aug 31 – Dec 18, 2026' : range === 'month' ? 'Last 30 days' : 'Last 7 days'

  return (
    <>
      <PageHeader
        eyebrow="Institution analytics"
        title="Reports & compliance"
        subtitle="Accreditation-ready attendance reporting across departments, classes and terms."
        actions={
          <>
            <Button icon="download" onClick={exportDepartmentReport}>
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon="fileText"
              onClick={() =>
                toast({
                  type: 'info',
                  title: 'Generating report package',
                  text: 'The full institution report is being prepared for download.',
                })
              }
            >
              Download report
            </Button>
          </>
        }
      />

      <div className="filter-bar mb-20">
        <span className="filter-bar__label">
          <Icon name="filter" size={14} /> Reporting period
        </span>
        <select
          className="select select--sm"
          style={{ width: 130 }}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          aria-label="Term"
        >
          <option value="fall">Fall 2026</option>
          <option value="spring">Spring 2026</option>
          <option value="fall25">Fall 2025</option>
        </select>
        <select
          className="select select--sm"
          style={{ width: 180 }}
          value={range}
          onChange={(event) => setRange(event.target.value)}
          aria-label="Date range"
        >
          <option value="term">Aug 31 – Dec 18, 2026</option>
          <option value="month">Last 30 days</option>
          <option value="week">Last 7 days</option>
        </select>
        <select
          className="select select--sm"
          style={{ width: 190 }}
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          aria-label="Department"
        >
          <option value="all">All departments</option>
          {departments.map((item) => (
            <option key={item.code} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <span className="toolbar__spacer" />
        <span className="row tiny muted" style={{ gap: 5 }}>
          <span className="status-dot" /> Data refreshed 4 min ago
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
          <div className="kpi-cell__value">
            {weightedRate}
            <span>%</span>
          </div>
          <div className="kpi-cell__foot">
            <span className="trend trend--up">
              <Icon name="arrowUpRight" size={11} /> +1.6 pts
            </span>{' '}
            vs. last term
          </div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Students</div>
          <div className="kpi-cell__value">{totals.students.toLocaleString()}</div>
          <div className="kpi-cell__foot">{totals.classes} classes included</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Sessions held</div>
          <div className="kpi-cell__value">1,946</div>
          <div className="kpi-cell__foot">31 cancelled · excluded</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">At-risk students</div>
          <div className="kpi-cell__value" style={{ color: 'var(--red)' }}>
            146
          </div>
          <div className="kpi-cell__foot">6.0% of enrollment</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell__label">Data quality</div>
          <div className="kpi-cell__value">
            98.2<span>%</span>
          </div>
          <div className="kpi-cell__foot">complete attendance records</div>
        </div>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Attendance over time</h3>
              <p className="card__sub">
                {department === 'all' ? 'Institution-wide' : department} · {termLabel} · {rangeLabel}
              </p>
            </div>
            <Badge tone="green" dot>
              Above target
            </Badge>
          </div>
          <div className="card__body" style={{ paddingTop: 12 }}>
            <LineChart data={adminTrend} height={252} reference={{ value: 90, label: 'Target 90%' }} />
          </div>
          <div className="card__footer">
            <span className="chart-legend">
              <span className="chart-legend__item">
                <span className="legend-dot" style={{ background: '#2563EB' }} />
                Weighted attendance
              </span>
              <span className="chart-legend__item">
                <span className="legend-dot" style={{ background: '#CBD5E1' }} />
                Institutional target
              </span>
            </span>
            <span className="tiny muted">Excludes cancelled sessions and excused absences</span>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Record distribution</h3>
              <p className="card__sub">All attendance records this term</p>
            </div>
            <Icon name="pieChart" size={17} className="muted" />
          </div>
          <div className="card__body">
            <div className="donut-wrap" style={{ justifyContent: 'center' }}>
              <Donut
                data={adminDistribution}
                size={150}
                thickness={19}
                centerValue={`${kpis.adminRate}%`}
                centerLabel="Attendance"
              />
            </div>
            <div className="legend-list mt-16">
              {adminDistribution.map((item) => (
                <div className="legend-row" key={item.label}>
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-row__label">{item.label}</span>
                  <span className="legend-row__value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card__footer">
            <span className="tiny muted">1,842 records sampled</span>
            <a className="card-link" href="#/admin/monitoring">
              Live view <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </section>
      </div>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Department performance</h3>
              <p className="card__sub">Attendance rate, enrollment and term trend</p>
            </div>
            <Button size="sm" icon="download" onClick={exportDepartmentReport}>
              Export
            </Button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Students</th>
                  <th>Classes</th>
                  <th>Attendance</th>
                  <th>Trend</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleDepartments.map((item) => (
                  <tr key={item.code}>
                    <td>
                      <span className="dept-pill">
                        <span className="dept-dot" style={{ background: item.color }} />
                        {item.name}
                      </span>
                      <div className="cell-muted">{item.code}</div>
                    </td>
                    <td>{item.students.toLocaleString()}</td>
                    <td>{item.classes}</td>
                    <td>
                      <RateCell value={item.rate} />
                    </td>
                    <td>
                      <span className={item.trend >= 0 ? 'trend trend--up' : 'trend trend--down'}>
                        <Icon name={item.trend >= 0 ? 'arrowUpRight' : 'arrowDownRight'} size={12} />
                        {Math.abs(item.trend)} pts
                      </span>
                    </td>
                    <td>
                      <Badge tone={item.rate >= 90 ? 'green' : item.rate >= 85 ? 'amber' : 'red'} dot>
                        {item.rate >= 90 ? 'On track' : item.rate >= 85 ? 'Monitor' : 'Needs review'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              {visibleDepartments.length} departments · {totals.students.toLocaleString()} students ·{' '}
              {totals.classes} classes
            </span>
            <span className="tiny muted">Weighted institution rate: {weightedRate}%</span>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Attendance by weekday</h3>
              <p className="card__sub">Records this week</p>
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
            <span className="tiny muted">Friday sessions average 8% lower turnout.</span>
            <span className="trend trend--down">
              <Icon name="arrowDownRight" size={11} /> Fri
            </span>
          </div>
        </section>
      </div>

      <div className="grid grid-3 mt-20">
        <section className="card">
          <div className="card__body">
            <div className="row row--between">
              <div className="mini-label">At-risk population</div>
              <Badge tone="red">6.0%</Badge>
            </div>
            <div className="stat-card__value mt-8">
              146 <span>students</span>
            </div>
            <div className="tiny muted mt-4">Down 15% from last term (172)</div>
            <Progress value={6} tone="red" className="mt-12" />
            <div className="row row--between mt-8">
              <span className="tiny muted">Threshold 75%</span>
              <span className="trend trend--up">
                <Icon name="arrowDownRight" size={11} /> 26 resolved
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__body">
            <div className="row row--between">
              <div className="mini-label">QR check-in success</div>
              <Icon name="qr" size={15} className="muted" />
            </div>
            <div className="stat-card__value mt-8">
              96.4 <span>%</span>
            </div>
            <div className="tiny muted mt-4">2.1% invalid · 1.5% expired</div>
            <Progress value={96.4} tone="green" className="mt-12" />
            <div className="row row--between mt-8">
              <span className="tiny muted">1.8s average check-in</span>
              <span className="trend trend--up">
                <Icon name="arrowUpRight" size={11} /> 0.4s
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__body">
            <div className="row row--between">
              <div className="mini-label">Sessions missing attendance</div>
              <Badge tone="amber">Review</Badge>
            </div>
            <div className="stat-card__value mt-8">
              23 <span>sessions</span>
            </div>
            <div className="tiny muted mt-4">1.2% of all sessions this term</div>
            <div className="row mt-12" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge tone="slate">12 pending</Badge>
              <Badge tone="slate">8 unsubmitted</Badge>
              <Badge tone="slate">3 flagged</Badge>
            </div>
            <button
              type="button"
              className="card-link mt-12"
              style={{ border: 0, background: 'none', padding: 0 }}
              onClick={() =>
                toast({ type: 'info', title: 'Follow-up queue', text: '23 sessions added to the attendance follow-up queue.' })
              }
            >
              Open follow-up queue <Icon name="arrowRight" size={12} />
            </button>
          </div>
        </section>
      </div>

      <section className="card mt-20">
        <div className="card__header card__header--bordered">
          <div>
            <h3 className="card__title">Export center</h3>
            <p className="card__sub">Accreditation and compliance packages</p>
          </div>
          <Badge tone="green" dot>
            SOC 2 Type II
          </Badge>
        </div>
        <div className="card__body">
          <div className="grid grid-3" style={{ gap: 12 }}>
            {reportCards.map((report) => (
              <div
                key={report.id}
                className="card"
                style={{ padding: 14, boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <span className={cn('stat-card__icon', `stat-card__icon--${report.tone}`)}>
                  <Icon name={report.icon} size={17} />
                </span>
                <div className="strong" style={{ fontSize: 13 }}>
                  {report.title}
                </div>
                <p className="tiny muted" style={{ lineHeight: 1.5 }}>
                  {report.text}
                </p>
                <div className="tiny muted">{report.meta}</div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon="download"
                  className="mt-8"
                  onClick={() => runReport(report.id)}
                >
                  Generate
                </Button>
              </div>
            ))}
          </div>

          <div className="info-banner mt-16">
            <Icon name="shield" size={15} className="info-banner__icon" />
            <span>
              <strong>Audit trail:</strong> every export is logged with the requesting administrator,
              timestamp and report parameters. Reports reflect data as of {termLabel} · {rangeLabel}.
            </span>
          </div>
        </div>
      </section>

      <section className="card mt-20">
        <div className="card__header card__header--bordered">
          <div>
            <h3 className="card__title">Class-level detail</h3>
            <p className="card__sub">Demo classes · {termLabel}</p>
          </div>
          <Button size="sm" icon="download" onClick={exportClassReport}>
            Export table
          </Button>
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
                <th>Attendance</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {classReports.map((item) => (
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
                  <td>
                    <RateCell value={item.rate} />
                  </td>
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
          <span>{classReports.length} classes · 81 sessions · 3,038 records</span>
          <span className="tiny muted">Cancelled sessions and excused absences excluded from rate</span>
        </div>
      </section>
    </>
  )
}
