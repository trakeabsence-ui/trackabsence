import { useState } from 'react'
import { Icon } from '../../components/Icons'
import { Badge, Button, Field, Modal, useToast } from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { classes, currentUser } from '../../data/mockData'
import { cn } from '../../lib/utils'

function ClassRing({ value, color }) {
  const size = 54
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (value / 100) * circumference

  return (
    <div className="class-progress-ring" title={`${value}% attendance`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="class-progress-ring__text">{value === 0 ? '—' : `${Math.round(value)}%`}</span>
    </div>
  )
}

const emptyForm = {
  code: '',
  title: '',
  room: '',
  day: 'Mon',
  start: '09:00',
  end: '10:30',
  expected: '30',
}

export default function TeacherClasses() {
  const toast = useToast()
  const [items, setItems] = useState(classes)
  const [filter, setFilter] = useState('active')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const counts = {
    all: items.length,
    active: items.filter((item) => item.status === 'active').length,
    archived: items.filter((item) => item.status === 'archived').length,
  }

  const visible = items
    .filter((item) => (filter === 'all' ? true : item.status === filter))
    .filter((item) =>
      `${item.code} ${item.title} ${item.room}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title)
      if (sort === 'attendance') return b.attendance - a.attendance
      if (sort === 'students') return b.students - a.students
      return 0
    })

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const createClass = (event) => {
    event.preventDefault()
    if (!form.code.trim() || !form.title.trim()) return
    const newClass = {
      id: `class-${Date.now()}`,
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      description: 'Newly created class.',
      teacher: currentUser.name,
      teacherId: currentUser.id,
      department: 'Computer Science',
      term: 'Fall 2026',
      room: form.room || 'TBD',
      days: [form.day],
      schedule: `${form.day} · ${form.start} – ${form.end}`,
      time: form.start,
      students: Number(form.expected) || 0,
      sessions: 0,
      attendance: 0,
      nextSession: 'Schedule pending',
      color: '#2563EB',
      tint: '#EFF6FF',
      status: 'active',
    }
    setItems((current) => [newClass, ...current])
    setFilter('active')
    setForm(emptyForm)
    setModalOpen(false)
    toast({
      title: 'Class created',
      text: `${newClass.code} · ${newClass.title} is ready. Sessions can now be scheduled.`,
    })
  }

  return (
    <>
      <PageHeader
        eyebrow="Teaching workspace"
        title="Classes"
        subtitle="Manage your courses, rosters and weekly schedules for Fall 2026."
        actions={
          <>
            <Button icon="download" onClick={() => toast({ type: 'info', title: 'Class list exported' })}>
              Export
            </Button>
            <Button variant="primary" icon="plus" onClick={() => setModalOpen(true)}>
              New class
            </Button>
          </>
        }
      />

      <div className="row row--between row--wrap" style={{ marginBottom: 18 }}>
        <div className="filter-tabs">
          {[
            ['active', 'Active', counts.active],
            ['archived', 'Archived', counts.archived],
            ['all', 'All classes', counts.all],
          ].map(([key, label, count]) => (
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

        <div className="toolbar">
          <div className="search-field" style={{ width: 240 }}>
            <Icon name="search" size={15} />
            <input
              className="input"
              placeholder="Search classes…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select className="select" style={{ width: 150 }} value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recent">Recently active</option>
            <option value="name">Name A–Z</option>
            <option value="attendance">Highest attendance</option>
            <option value="students">Largest class</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icon name="book" size={22} />
            </div>
            <h3>No classes found</h3>
            <p>Try a different filter or create a new class.</p>
          </div>
        </div>
      ) : (
        <div className="class-grid">
          {visible.map((item) => (
            <a
              className="class-card"
              key={item.id}
              href={`#/teacher/classes/${item.id}`}
              style={{ '--class-color': item.color, '--class-tint': item.tint }}
            >
              <div className="class-card__top">
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <span className="class-code">{item.code}</span>
                    {item.status === 'archived' && <Badge tone="slate">Archived</Badge>}
                  </div>
                  <h3 className="mt-8">{item.title}</h3>
                </div>
                <ClassRing value={item.attendance} color={item.color} />
              </div>

              <div className="class-card__meta">
                <span>
                  <Icon name="calendar" size={12} />
                  {item.schedule}
                </span>
                <span>
                  <Icon name="mapPin" size={12} />
                  {item.room} · {item.term}
                </span>
              </div>

              <div className="class-card__stats">
                <div>
                  <div className="class-stat__label">Students</div>
                  <div className="class-stat__value">{item.students}</div>
                </div>
                <div>
                  <div className="class-stat__label">Sessions</div>
                  <div className="class-stat__value">{item.sessions}</div>
                </div>
              </div>

              <div className="class-card__foot">
                <span className="row" style={{ gap: 5 }}>
                  <span
                    className="status-dot"
                    style={{
                      background:
                        item.status === 'archived'
                          ? '#94A3B8'
                          : item.attendance >= 90
                            ? '#16A34A'
                            : item.attendance >= 85
                              ? '#D97706'
                              : '#DC2626',
                    }}
                  />
                  {item.nextSession}
                </span>
                <span className="card-link">
                  Open <Icon name="arrowRight" size={12} />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create a class"
        subtitle="Set up the course structure. You can add the full timetable and roster afterwards."
        icon="book"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="plus" onClick={createClass}>
              Create class
            </Button>
          </>
        }
      >
        <form onSubmit={createClass}>
          <div className="form-grid">
            <Field label="Class code">
              <input
                className="input"
                placeholder="CS-320"
                value={form.code}
                onChange={(event) => update('code', event.target.value)}
                required
              />
            </Field>
            <Field label="Room">
              <input
                className="input"
                placeholder="B-204"
                value={form.room}
                onChange={(event) => update('room', event.target.value)}
              />
            </Field>
            <Field label="Class title" full>
              <input
                className="input"
                placeholder="Distributed Systems"
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                required
              />
            </Field>
            <Field label="Day">
              <select className="select" value={form.day} onChange={(event) => update('day', event.target.value)}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </Field>
            <Field label="Expected students">
              <input
                className="input"
                type="number"
                min="1"
                value={form.expected}
                onChange={(event) => update('expected', event.target.value)}
              />
            </Field>
            <Field label="Starts">
              <input
                className="input"
                type="time"
                value={form.start}
                onChange={(event) => update('start', event.target.value)}
              />
            </Field>
            <Field label="Ends">
              <input
                className="input"
                type="time"
                value={form.end}
                onChange={(event) => update('end', event.target.value)}
              />
            </Field>
            <div className="field--full">
              <div className="info-banner">
                <Icon name="info" size={15} className="info-banner__icon" />
                Sessions will be generated from this schedule for the active term. You can import a
                full timetable later.
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
