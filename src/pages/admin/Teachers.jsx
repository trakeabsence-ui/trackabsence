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
  Progress,
  StatCard,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { departments, teachers as seedTeachers } from '../../data/mockData'
import { downloadCsv } from '../../lib/utils'
import { cn } from '../../lib/utils'

const departmentColor = Object.fromEntries(departments.map((item) => [item.name, item.color]))

const statusMeta = {
  active: { label: 'Active', tone: 'green' },
  watch: { label: 'Watch', tone: 'amber' },
  leave: { label: 'On leave', tone: 'slate' },
}

const emptyInvite = {
  first: '',
  last: '',
  email: '',
  department: 'Computer Science',
  title: 'Lecturer',
  sendWelcome: true,
}

export default function AdminTeachers() {
  const toast = useToast()
  const [items, setItems] = useState(seedTeachers)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('rate')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState(emptyInvite)
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const list = items
      .filter((teacher) => (department === 'all' ? true : teacher.department === department))
      .filter((teacher) => (status === 'all' ? true : teacher.status === status))
      .filter((teacher) =>
        `${teacher.name} ${teacher.email} ${teacher.department}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )

    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'classes') return b.classes - a.classes
      if (sort === 'students') return b.students - a.students
      return b.rate - a.rate
    })
  }, [items, department, status, query, sort])

  const stats = useMemo(() => {
    const active = items.filter((teacher) => teacher.status === 'active')
    const average = active.reduce((sum, teacher) => sum + teacher.rate, 0) / Math.max(1, active.length)
    return {
      total: 84,
      active: 76,
      average: average.toFixed(1),
      watch: items.filter((teacher) => teacher.status === 'watch' || teacher.rate < 80).length,
    }
  }, [items])

  const updateInvite = (key, value) => setInvite((current) => ({ ...current, [key]: value }))

  const sendInvite = (event) => {
    event.preventDefault()
    if (!invite.first.trim() || !invite.last.trim() || !invite.email.trim()) return
    const teacher = {
      id: `t-${Date.now()}`,
      name: `${invite.first} ${invite.last}`.trim(),
      initials: `${invite.first[0] ?? ''}${invite.last[0] ?? ''}`.toUpperCase(),
      email: invite.email.trim().toLowerCase(),
      department: invite.department,
      title: invite.title,
      classes: 0,
      students: 0,
      rate: 0,
      lastActive: 'Invited just now',
      status: 'active',
      color: departmentColor[invite.department] ?? '#2563EB',
    }
    setItems((current) => [teacher, ...current])
    setInvite(emptyInvite)
    setInviteOpen(false)
    toast({
      title: 'Invitation sent',
      text: invite.sendWelcome
        ? `${teacher.name} received a welcome email and can now activate their account.`
        : `${teacher.name} was added to the faculty directory.`,
    })
  }

  const exportDirectory = () => {
    downloadCsv(
      'classtrack-faculty-directory.csv',
      filtered.map((teacher) => ({
        Name: teacher.name,
        Email: teacher.email,
        Department: teacher.department,
        Title: teacher.title,
        Classes: teacher.classes,
        Students: teacher.students,
        'Attendance rate': `${teacher.rate}%`,
        Status: statusMeta[teacher.status]?.label ?? teacher.status,
        'Last active': teacher.lastActive,
      })),
    )
    toast({ title: 'Faculty directory exported', text: `${filtered.length} records downloaded.` })
  }

  const resetFilters = () => {
    setQuery('')
    setDepartment('all')
    setStatus('all')
  }

  return (
    <>
      <PageHeader
        eyebrow="Faculty management"
        title="Teachers"
        subtitle="Manage faculty accounts, teaching loads and attendance performance across departments."
        actions={
          <>
            <Button icon="download" onClick={exportDirectory}>
              Export
            </Button>
            <Button variant="primary" icon="userPlus" onClick={() => setInviteOpen(true)}>
              Invite teacher
            </Button>
          </>
        }
      />

      <div className="grid grid-4">
        <StatCard
          label="Faculty accounts"
          value={stats.total}
          icon="graduation"
          tone="blue"
          trend="+3"
          sub="joined this term"
        />
        <StatCard
          label="Active teachers"
          value={stats.active}
          icon="checkCircle"
          tone="green"
          sub="5 on leave · 3 pending"
        />
        <StatCard
          label="Average attendance"
          value={stats.average}
          suffix="%"
          icon="chart"
          tone="purple"
          trend="+1.2 pts"
          sub="across active faculty"
        />
        <StatCard
          label="Need support"
          value={stats.watch}
          icon="alertTriangle"
          tone="red"
          sub="below 80% or flagged"
        />
      </div>

      <section className="card mt-20">
        <div className="card__body--tight" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="toolbar">
            <div className="search-field" style={{ maxWidth: 300 }}>
              <Icon name="search" size={15} />
              <input
                className="input"
                placeholder="Search name, email or department…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              className="select"
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
              className="select"
              style={{ width: 140 }}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="watch">Watch</option>
              <option value="leave">On leave</option>
            </select>
            <span className="toolbar__spacer" />
            <span className="tiny muted">{filtered.length} teachers</span>
            <select
              className="select select--sm"
              style={{ width: 160 }}
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort teachers"
            >
              <option value="rate">Highest attendance</option>
              <option value="name">Name A–Z</option>
              <option value="classes">Most classes</option>
              <option value="students">Most students</option>
            </select>
            <Button size="sm" variant="ghost" icon="refresh" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Department</th>
                <th>Classes</th>
                <th>Students</th>
                <th>Attendance</th>
                <th>Last active</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher) => (
                <tr key={teacher.id}>
                  <td>
                    <div className="user-cell">
                      <Avatar name={teacher.name} size="sm" color={teacher.color} />
                      <div>
                        <div className="user-cell__name">{teacher.name}</div>
                        <div className="user-cell__sub">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="dept-pill">
                      <span
                        className="dept-dot"
                        style={{ background: departmentColor[teacher.department] ?? '#64748B' }}
                      />
                      {teacher.department}
                    </span>
                    <div className="cell-muted">{teacher.title}</div>
                  </td>
                  <td className="cell-strong">{teacher.classes}</td>
                  <td>{teacher.students}</td>
                  <td>
                    {teacher.rate === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <div className="row" style={{ gap: 8 }}>
                        <Progress
                          value={teacher.rate}
                          tone={teacher.rate >= 90 ? 'green' : teacher.rate >= 80 ? 'amber' : 'red'}
                          style={{ width: 58 }}
                        />
                        <span className="strong" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {teacher.rate}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="cell-muted">{teacher.lastActive}</td>
                  <td>
                    <Badge tone={statusMeta[teacher.status]?.tone ?? 'slate'} dot>
                      {statusMeta[teacher.status]?.label ?? teacher.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="table-actions">
                      <IconButton
                        icon="eye"
                        label={`View ${teacher.name}`}
                        onClick={() => setSelected(teacher)}
                      />
                      <Dropdown trigger={<IconButton icon="more" label={`Actions for ${teacher.name}`} />}>
                        <MenuItem icon="eye" onClick={() => setSelected(teacher)}>
                          View profile
                        </MenuItem>
                        <MenuItem
                          icon="book"
                          onClick={() =>
                            toast({ type: 'info', title: 'Teaching load', text: `${teacher.classes} classes · ${teacher.students} students.` })
                          }
                        >
                          Manage classes
                        </MenuItem>
                        <MenuItem
                          icon="mail"
                          onClick={() => toast({ title: 'Message sent', text: `A message was delivered to ${teacher.email}.` })}
                        >
                          Send message
                        </MenuItem>
                        <div className="menu-sep" />
                        <MenuItem
                          icon="shield"
                          danger
                          onClick={() =>
                            toast({
                              type: 'info',
                              title: 'Account access',
                              text: 'Access changes require a second administrator in the demo.',
                            })
                          }
                        >
                          Manage access
                        </MenuItem>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state" style={{ padding: '36px 20px' }}>
                      <div className="empty-state__icon">
                        <Icon name="search" size={22} />
                      </div>
                      <h3>No teachers match your filters</h3>
                      <p>Try another department or reset the filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing {filtered.length} of {items.length} faculty records · 84 accounts institution-wide
          </span>
          <span className="tiny muted">Attendance excludes cancelled sessions</span>
        </div>
      </section>

      <div className="grid grid-2-1 mt-20">
        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Department coverage</h3>
              <p className="card__sub">Active teachers and attendance by department</p>
            </div>
            <a className="card-link" href="#/admin/reports">
              Reports <Icon name="arrowRight" size={12} />
            </a>
          </div>
          <div className="card__body">
            <div className="stack" style={{ gap: 14 }}>
              {departments.map((item) => {
                const count = items.filter((teacher) => teacher.department === item.name).length
                return (
                  <div key={item.code}>
                    <div className="row row--between" style={{ marginBottom: 5 }}>
                      <span className="row" style={{ gap: 7 }}>
                        <span className="legend-dot" style={{ background: item.color }} />
                        <span className="small strong">{item.name}</span>
                        <span className="tiny muted">{count} in directory · {item.classes} classes</span>
                      </span>
                      <span className="small strong">{item.rate}%</span>
                    </div>
                    <Progress
                      value={item.rate}
                      tone={item.rate >= 90 ? 'green' : item.rate >= 85 ? 'amber' : 'red'}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__header card__header--bordered">
            <div>
              <h3 className="card__title">Faculty actions</h3>
              <p className="card__sub">Common administration tasks</p>
            </div>
          </div>
          <div className="card__body">
            <div className="quick-actions">
              <button type="button" className="quick-action" onClick={() => setInviteOpen(true)}>
                <span className="quick-action__icon">
                  <Icon name="userPlus" size={15} />
                </span>
                Invite teacher
              </button>
              <button type="button" className="quick-action" onClick={exportDirectory}>
                <span className="quick-action__icon">
                  <Icon name="download" size={15} />
                </span>
                Export directory
              </button>
              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  toast({ type: 'info', title: 'Bulk import', text: 'Upload a CSV of faculty records from the HR system.' })
                }
              >
                <span className="quick-action__icon">
                  <Icon name="upload" size={15} />
                </span>
                Bulk import
              </button>
              <button
                type="button"
                className="quick-action"
                onClick={() =>
                  toast({ title: 'Audit log exported', text: 'Account and permission changes for the last 30 days.' })
                }
              >
                <span className="quick-action__icon">
                  <Icon name="fileText" size={15} />
                </span>
                Audit log
              </button>
            </div>
            <div className="info-banner mt-16">
              <Icon name="shield" size={15} className="info-banner__icon" />
              <span>
                <strong>Policy:</strong> teacher accounts are provisioned through SSO. Manual invites
                expire after 7 days.
              </span>
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a teacher"
        subtitle="Send an invitation to join the Northbridge workspace. They will set their own password."
        icon="userPlus"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="send" onClick={sendInvite}>
              Send invitation
            </Button>
          </>
        }
      >
        <form onSubmit={sendInvite}>
          <div className="form-grid">
            <Field label="First name">
              <input
                className="input"
                value={invite.first}
                onChange={(event) => updateInvite('first', event.target.value)}
                required
              />
            </Field>
            <Field label="Last name">
              <input
                className="input"
                value={invite.last}
                onChange={(event) => updateInvite('last', event.target.value)}
                required
              />
            </Field>
            <Field label="Institutional email" full>
              <input
                className="input"
                type="email"
                placeholder="first.last@northbridge.edu"
                value={invite.email}
                onChange={(event) => updateInvite('email', event.target.value)}
                required
              />
            </Field>
            <Field label="Department">
              <select
                className="select"
                value={invite.department}
                onChange={(event) => updateInvite('department', event.target.value)}
              >
                {departments.map((item) => (
                  <option key={item.code} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Academic title">
              <select
                className="select"
                value={invite.title}
                onChange={(event) => updateInvite('title', event.target.value)}
              >
                {['Lecturer', 'Senior Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'].map(
                  (title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <div className="field--full">
              <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={invite.sendWelcome}
                  onChange={(event) => updateInvite('sendWelcome', event.target.checked)}
                />
                <span className="small">Send a welcome email with onboarding instructions</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Teacher'}
        subtitle={selected ? `${selected.title} · ${selected.department}` : ''}
        icon="graduation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              icon="mail"
              onClick={() => {
                toast({ title: 'Message sent', text: `A message was delivered to ${selected?.email}.` })
                setSelected(null)
              }}
            >
              Send message
            </Button>
          </>
        }
      >
        {selected && (
          <div className="stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 12 }}>
              <Avatar name={selected.name} size="lg" color={selected.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="strong">{selected.email}</div>
                <div className="tiny muted">Last active {selected.lastActive}</div>
              </div>
              <Badge tone={statusMeta[selected.status]?.tone ?? 'slate'} dot>
                {statusMeta[selected.status]?.label ?? selected.status}
              </Badge>
            </div>

            <div className="grid grid-3" style={{ gap: 10 }}>
              {[
                ['Classes', selected.classes],
                ['Students', selected.students],
                ['Attendance', selected.rate ? `${selected.rate}%` : '—'],
              ].map(([label, value]) => (
                <div className="card" key={label} style={{ padding: 12, boxShadow: 'none' }}>
                  <div className="mini-label">{label}</div>
                  <div className="stat-card__value" style={{ fontSize: 20 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="mini-label" style={{ marginBottom: 7 }}>
                Attendance trend
              </div>
              <div className="row row--between" style={{ marginBottom: 5 }}>
                <span className="tiny muted">This term</span>
                <span className={cn('trend', selected.rate >= 90 ? 'trend--up' : 'trend--down')}>
                  <Icon name={selected.rate >= 90 ? 'arrowUpRight' : 'arrowDownRight'} size={11} />
                  {selected.rate >= 90 ? 'Above target' : 'Needs review'}
                </span>
              </div>
              <Progress
                value={selected.rate}
                tone={selected.rate >= 90 ? 'green' : selected.rate >= 80 ? 'amber' : 'red'}
                size="lg"
              />
            </div>

            <div className="info-banner">
              <Icon name="info" size={15} className="info-banner__icon" />
              Profile changes and access reviews are recorded in the institution audit log.
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
