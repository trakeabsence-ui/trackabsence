import { useMemo, useState } from 'react'
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
  RateCell,
  StatCard,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { classes, students as seedStudents } from '../../data/mockData'
import { downloadCsv, formatPct, riskMeta } from '../../lib/utils'
import { cn } from '../../lib/utils'

const PAGE_SIZE = 10

const emptyStudent = {
  first: '',
  last: '',
  email: '',
  number: '',
  classId: 'cs301',
  program: 'BSc Computer Science',
  year: '2',
}

export default function TeacherStudents() {
  const toast = useToast()
  const [roster, setRoster] = useState(seedStudents)
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importStep, setImportStep] = useState('idle')
  const [form, setForm] = useState(emptyStudent)

  const filtered = useMemo(() => {
    const list = roster
      .filter((student) => (classFilter === 'all' ? true : student.classId === classFilter))
      .filter((student) => (riskFilter === 'all' ? true : student.risk === riskFilter))
      .filter((student) =>
        `${student.name} ${student.email} ${student.number} ${student.classCode}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )

    return [...list].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      if (sort.key === 'attendance') return (a.attendance - b.attendance) * dir
      if (sort.key === 'class') return a.classCode.localeCompare(b.classCode) * dir
      return a.name.localeCompare(b.name) * dir
    })
  }, [roster, classFilter, riskFilter, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const stats = useMemo(() => {
    const average = roster.reduce((sum, student) => sum + student.attendance, 0) / roster.length
    return {
      total: roster.length,
      average: average.toFixed(1),
      atRisk: roster.filter((student) => student.risk === 'at_risk' || student.risk === 'critical').length,
      perfect: roster.filter((student) => student.attendance >= 98).length,
    }
  }, [roster])

  const resetFilters = (setter, value) => {
    setter(value)
    setPage(1)
  }

  const toggleSort = (key) => {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  const toggleRow = (id) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePage = () => {
    const pageIds = rows.map((row) => row.id)
    const allSelected = pageIds.every((id) => selected.has(id))
    setSelected((current) => {
      const next = new Set(current)
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const exportRows = (list = filtered) => {
    downloadCsv(
      'classtrack-students.csv',
      list.map((student) => ({
        Student: student.name,
        Email: student.email,
        'Student ID': student.number,
        Class: student.classCode,
        Program: student.program,
        Year: student.year,
        Attendance: formatPct(student.attendance),
        Absences: student.absences,
        Status: riskMeta[student.risk].label,
      })),
    )
    toast({ title: 'Export ready', text: `${list.length} student records downloaded.` })
  }

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const addStudent = (event) => {
    event.preventDefault()
    const cls = classes.find((item) => item.id === form.classId)
    const newStudent = {
      id: `st-new-${Date.now()}`,
      number: form.number || `NB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: form.first,
      lastName: form.last,
      name: `${form.first} ${form.last}`.trim(),
      email: form.email || `${form.first}.${form.last}@student.northbridge.edu`.toLowerCase(),
      classId: form.classId,
      classCode: cls.code,
      className: cls.title,
      program: form.program,
      year: Number(form.year),
      attendance: 100,
      absences: 0,
      late: 0,
      sessions: cls.sessions,
      risk: 'healthy',
      lastSeen: 'Just now',
      phone: '—',
      color: '#2563EB',
    }
    setRoster((current) => [newStudent, ...current])
    setForm(emptyStudent)
    setAddOpen(false)
    setPage(1)
    toast({
      title: 'Student added',
      text: `${newStudent.name} was enrolled in ${cls.code}.`,
    })
  }

  const pageNumbers = useMemo(() => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, index) => index + 1)
    const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
    return Array.from({ length: 5 }, (_, index) => start + index)
  }, [safePage, totalPages])

  return (
    <>
      <PageHeader
        eyebrow="Roster management"
        title="Students"
        subtitle="Search, import and manage students across all your classes. 180 enrolled this term."
        actions={
          <>
            <Button icon="download" onClick={() => exportRows()}>
              Export
            </Button>
            <Button icon="upload" onClick={() => { setImportOpen(true); setImportStep('idle') }}>
              Import
            </Button>
            <Button variant="primary" icon="userPlus" onClick={() => setAddOpen(true)}>
              Add student
            </Button>
          </>
        }
      />

      <div className="grid grid-4">
        <StatCard label="Total students" value={stats.total} icon="users" tone="blue" trend="+12" sub="this term" />
        <StatCard label="Average attendance" value={stats.average} suffix="%" icon="chart" tone="green" trend="+1.8 pts" sub="vs. October" />
        <StatCard label="At-risk students" value={stats.atRisk} icon="alertTriangle" tone="red" sub="below 75%" />
        <StatCard label="Perfect attendance" value={stats.perfect} icon="checkCircle" tone="purple" sub="98% and above" />
      </div>

      <section className="card mt-20">
        <div className="card__body--tight" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="toolbar">
            <div className="search-field" style={{ maxWidth: 300 }}>
              <Icon name="search" size={15} />
              <input
                className="input"
                placeholder="Search name, email or student ID…"
                value={query}
                onChange={(event) => resetFilters(setQuery, event.target.value)}
              />
            </div>
            <select
              className="select"
              style={{ width: 170 }}
              value={classFilter}
              onChange={(event) => resetFilters(setClassFilter, event.target.value)}
              aria-label="Filter by class"
            >
              <option value="all">All classes</option>
              {classes.filter((item) => item.status === 'active').map((item) => (
                <option key={item.id} value={item.id}>{item.code} · {item.title}</option>
              ))}
            </select>
            <select
              className="select"
              style={{ width: 150 }}
              value={riskFilter}
              onChange={(event) => resetFilters(setRiskFilter, event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="healthy">Healthy</option>
              <option value="watch">Watch</option>
              <option value="at_risk">At risk</option>
              <option value="critical">Critical</option>
            </select>
            <span className="toolbar__spacer" />
            <span className="tiny muted">{filtered.length} results</span>
            <Button
              size="sm"
              variant="ghost"
              icon="filter"
              onClick={() => {
                setQuery('')
                setClassFilter('all')
                setRiskFilter('all')
                setPage(1)
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {selected.size > 0 && (
          <div style={{ padding: '10px 16px', background: 'var(--blue-50)', borderBottom: '1px solid var(--blue-100)' }}>
            <div className="row row--between row--wrap">
              <span className="small strong" style={{ color: 'var(--blue-700)' }}>
                {selected.size} student{selected.size > 1 ? 's' : ''} selected
              </span>
              <div className="row" style={{ gap: 6 }}>
                <Button
                  size="sm"
                  variant="soft"
                  icon="download"
                  onClick={() => exportRows(roster.filter((student) => selected.has(student.id)))}
                >
                  Export selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="checkbox"
                    aria-label="Select page"
                    checked={rows.length > 0 && rows.every((row) => selected.has(row.id))}
                    onChange={togglePage}
                  />
                </th>
                <th className="sortable" onClick={() => toggleSort('name')}>
                  <span className="th-inner">
                    Student
                    <Icon name={sort.key === 'name' && sort.dir === 'desc' ? 'chevronDown' : 'chevronUp'} size={12} />
                  </span>
                </th>
                <th>Student ID</th>
                <th className="sortable" onClick={() => toggleSort('class')}>
                  <span className="th-inner">
                    Class
                    <Icon name={sort.key === 'class' && sort.dir === 'desc' ? 'chevronDown' : 'chevronUp'} size={12} />
                  </span>
                </th>
                <th>Program</th>
                <th className="sortable" onClick={() => toggleSort('attendance')}>
                  <span className="th-inner">
                    Attendance
                    <Icon name={sort.key === 'attendance' && sort.dir === 'desc' ? 'chevronDown' : 'chevronUp'} size={12} />
                  </span>
                </th>
                <th>Absences</th>
                <th>Status</th>
                <th>Last activity</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((student) => (
                <tr key={student.id} className={selected.has(student.id) ? 'is-selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox"
                      aria-label={`Select ${student.name}`}
                      checked={selected.has(student.id)}
                      onChange={() => toggleRow(student.id)}
                    />
                  </td>
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
                  <td>
                    <span className="class-code" style={{ background: 'var(--surface-2)', color: 'var(--slate-600)' }}>
                      {student.classCode}
                    </span>
                  </td>
                  <td>
                    <div className="cell-strong" style={{ fontWeight: 550 }}>{student.program}</div>
                    <div className="cell-muted">Year {student.year}</div>
                  </td>
                  <td><RateCell value={student.attendance} /></td>
                  <td>
                    <span className={student.absences > 4 ? 'strong' : ''} style={{ color: student.absences > 4 ? 'var(--red)' : undefined }}>
                      {student.absences}
                    </span>
                  </td>
                  <td>
                    <Badge tone={riskMeta[student.risk].tone} dot>
                      {riskMeta[student.risk].label}
                    </Badge>
                  </td>
                  <td className="cell-muted">{student.lastSeen}</td>
                  <td>
                    <div className="table-actions">
                      <IconButton
                        icon="eye"
                        label={`View ${student.name}`}
                        onClick={() =>
                          toast({ type: 'info', title: student.name, text: `${student.classCode} · ${formatPct(student.attendance)} attendance` })
                        }
                      />
                      <Dropdown
                        trigger={<IconButton icon="more" label="Student actions" />}
                      >
                        <MenuItem icon="eye" onClick={() => toast({ type: 'info', title: 'Opening student profile' })}>
                          View profile
                        </MenuItem>
                        <MenuItem icon="edit" onClick={() => toast({ type: 'info', title: 'Edit student' })}>
                          Edit details
                        </MenuItem>
                        <MenuItem icon="mail" onClick={() => toast({ title: 'Reminder sent', text: `A nudge was sent to ${student.email}.` })}>
                          Send reminder
                        </MenuItem>
                        <div className="menu-sep" />
                        <MenuItem icon="trash" danger onClick={() => toast({ type: 'error', title: 'Enrollment removal requires confirmation' })}>
                          Remove from class
                        </MenuItem>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="10">
                    <div className="empty-state" style={{ padding: '34px 20px' }}>
                      <div className="empty-state__icon">
                        <Icon name="search" size={22} />
                      </div>
                      <h3>No students match your filters</h3>
                      <p>Try another search term or reset the filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} students
          </span>
          <div className="pagination">
            <button
              type="button"
              className="page-btn"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous page"
            >
              <Icon name="chevronLeft" size={14} />
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                type="button"
                className={cn('page-btn', number === safePage && 'is-active')}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              className="page-btn"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next page"
            >
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
        </div>
      </section>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a student"
        subtitle="Create a student record and enroll them in one of your classes."
        icon="userPlus"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" icon="plus" onClick={addStudent}>Add student</Button>
          </>
        }
      >
        <form onSubmit={addStudent}>
          <div className="form-grid">
            <Field label="First name">
              <input className="input" value={form.first} onChange={(event) => updateForm('first', event.target.value)} required />
            </Field>
            <Field label="Last name">
              <input className="input" value={form.last} onChange={(event) => updateForm('last', event.target.value)} required />
            </Field>
            <Field label="Institutional email" full>
              <input className="input" type="email" placeholder="first.last@student.northbridge.edu" value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
            </Field>
            <Field label="Student number" hint="Leave blank to auto-generate.">
              <input className="input" placeholder="NB-2026-1234" value={form.number} onChange={(event) => updateForm('number', event.target.value)} />
            </Field>
            <Field label="Year level">
              <select className="select" value={form.year} onChange={(event) => updateForm('year', event.target.value)}>
                {[1, 2, 3, 4, 5].map((year) => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </Field>
            <Field label="Class" full>
              <select className="select" value={form.classId} onChange={(event) => updateForm('classId', event.target.value)}>
                {classes.filter((item) => item.status === 'active').map((item) => (
                  <option key={item.id} value={item.id}>{item.code} · {item.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Program" full>
              <select className="select" value={form.program} onChange={(event) => updateForm('program', event.target.value)}>
                {['BSc Computer Science', 'BSc Software Engineering', 'BSc Information Systems', 'BSc Data Science'].map((program) => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import students"
        subtitle="Upload an Excel or CSV file, review the results, then commit the roster."
        icon="upload"
        width="wide"
        footer={
          importStep === 'preview' ? (
            <>
              <Button variant="ghost" onClick={() => setImportStep('idle')}>Back</Button>
              <Button
                variant="primary"
                icon="check"
                onClick={() => {
                  setImportOpen(false)
                  setImportStep('idle')
                  toast({
                    title: 'Roster imported',
                    text: '38 students added, 2 skipped as duplicates, 1 row needs attention.',
                  })
                }}
              >
                Import 38 students
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button>
              <Button
                variant="secondary"
                icon="download"
                onClick={() =>
                  downloadCsv('classtrack-roster-template.csv', [
                    {
                      first_name: 'Yasmine',
                      last_name: 'Ait Ali',
                      email: 'yasmine.aitali@student.northbridge.edu',
                      student_number: 'NB-2024-1001',
                      program: 'BSc Computer Science',
                      year: '2',
                    },
                  ])
                }
              >
                Download template
              </Button>
            </>
          )
        }
      >
        {importStep === 'idle' ? (
          <>
            <button type="button" className="dropzone w-full" onClick={() => setImportStep('preview')}>
              <div className="dropzone__icon">
                <Icon name="upload" size={21} />
              </div>
              <div className="dropzone__title">Drop your roster file here, or browse</div>
              <div className="dropzone__text">Excel (.xlsx) or CSV up to 5 MB · 500 rows maximum</div>
              <div className="dropzone__formats">.XLSX · .CSV</div>
            </button>

            <div className="grid grid-3 mt-16" style={{ gap: 10 }}>
              {[
                ['1', 'Upload file', 'Use the template for best results.'],
                ['2', 'Review', 'We validate emails and duplicates.'],
                ['3', 'Commit', 'The roster updates atomically.'],
              ].map(([step, title, text]) => (
                <div key={step} className="chip" style={{ height: 'auto', padding: '10px 12px', alignItems: 'flex-start', flexDirection: 'column', gap: 3, whiteSpace: 'normal' }}>
                  <span className="strong" style={{ fontSize: 11.5 }}>{step}. {title}</span>
                  <span className="tiny muted">{text}</span>
                </div>
              ))}
            </div>

            <div className="info-banner mt-16">
              <Icon name="info" size={15} className="info-banner__icon" />
              Required columns: first name, last name, email. Duplicate emails and student numbers
              are skipped automatically.
            </div>
          </>
        ) : (
          <>
            <div className="row row--between" style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-3)' }}>
              <div className="row" style={{ gap: 9 }}>
                <span className="stat-card__icon stat-card__icon--green" style={{ width: 32, height: 32 }}>
                  <Icon name="sheet" size={16} />
                </span>
                <div>
                  <div className="small strong">fall-2026-roster.xlsx</div>
                  <div className="tiny muted">41 rows · 84 KB · uploaded just now</div>
                </div>
              </div>
              <Badge tone="green" dot>Validated</Badge>
            </div>

            <div className="grid grid-3 mt-16" style={{ gap: 10 }}>
              <div className="card" style={{ padding: 12 }}>
                <div className="mini-label">Valid</div>
                <div className="stat-card__value" style={{ fontSize: 21, color: 'var(--green)' }}>38</div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="mini-label">Warnings</div>
                <div className="stat-card__value" style={{ fontSize: 21, color: 'var(--amber)' }}>2</div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="mini-label">Errors</div>
                <div className="stat-card__value" style={{ fontSize: 21, color: 'var(--red)' }}>1</div>
              </div>
            </div>

            <div className="section-head" style={{ margin: '18px 0 8px' }}>
              <div>
                <h2 style={{ fontSize: 13 }}>Preview</h2>
                <p>First 3 of 41 rows</p>
              </div>
              <a className="card-link" href="#/teacher/students" onClick={(event) => event.preventDefault()}>
                Download error report <Icon name="download" size={12} />
              </a>
            </div>

            <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 10 }}>
              <table className="data-table" style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['12', 'Nour Cherkaoui', 'nour.cherkaoui@student.northbridge.edu', 'valid'],
                    ['13', 'Yassine Kadiri', 'yassine.kadiri@student.northbridge.edu', 'valid'],
                    ['14', 'Ayoub Fassi', 'ayoub.fassi@student.northbridge.edu', 'warning'],
                  ].map(([row, name, email, result]) => (
                    <tr key={row}>
                      <td className="mono cell-muted">{row}</td>
                      <td className="cell-strong">{name}</td>
                      <td className="cell-muted">{email}</td>
                      <td>
                        <Badge tone={result === 'valid' ? 'green' : 'amber'}>
                          {result === 'valid' ? 'Ready' : 'Duplicate email'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
