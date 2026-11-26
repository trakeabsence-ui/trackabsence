import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icons'
import { Badge, Button, Field, Modal, useToast } from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { classes, timetable, weekdays } from '../../data/mockData'
import { cn } from '../../lib/utils'

const START_MIN = 8 * 60
const END_MIN = 18 * 60
const ROW_MIN = 30
const TOTAL_ROWS = (END_MIN - START_MIN) / ROW_MIN

const weeks = [
  { label: 'Nov 16 – 20, 2026', dates: [16, 17, 18, 19, 20], today: false },
  { label: 'Nov 23 – 27, 2026', dates: [23, 24, 25, 26, 27], today: true },
  { label: 'Nov 30 – Dec 4, 2026', dates: [30, 1, 2, 3, 4], today: false },
]

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function rowFor(minutes) {
  return (minutes - START_MIN) / ROW_MIN + 2
}

const extractedRows = [
  { code: 'CS-305', title: 'Database Systems', day: 'Mon', time: '11:00 – 12:30', room: 'Lab C-112', confidence: 98 },
  { code: 'CS-220', title: 'Web Engineering', day: 'Mon', time: '14:00 – 15:30', room: 'Lab C-105', confidence: 96 },
  { code: 'CS-301', title: 'Advanced Data Structures', day: 'Tue', time: '09:00 – 10:30', room: 'B-204', confidence: 91 },
  { code: 'CS-410', title: 'Human-Computer Interaction', day: 'Wed', time: '14:00 – 15:30', room: 'A-310', confidence: 74 },
]

const manualDefaults = { classId: 'cs301', day: 'Mon', start: '09:00', end: '10:30', room: 'B-204' }

export default function TeacherTimetable() {
  const toast = useToast()
  const [weekIndex, setWeekIndex] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState('choose')
  const [fileName, setFileName] = useState('')
  const [extracted, setExtracted] = useState(false)
  const [manual, setManual] = useState(manualDefaults)

  const week = weeks[weekIndex]
  const now = { hour: 9, minute: 42 }
  const nowMinutes = now.hour * 60 + now.minute
  const nowRow = Math.floor(rowFor(nowMinutes))
  const nowOffset = ((nowMinutes - START_MIN) % ROW_MIN) / ROW_MIN * 36

  const hours = useMemo(
    () => Array.from({ length: (END_MIN - START_MIN) / 60 }, (_, index) => 8 + index),
    [],
  )

  const openImport = (initialMode = 'choose') => {
    setMode(initialMode)
    setFileName('')
    setExtracted(false)
    setManual(manualDefaults)
    setModalOpen(true)
  }

  const primaryLabel =
    mode === 'manual'
      ? 'Add session'
      : mode === 'image'
        ? fileName
          ? 'Import 11 sessions'
          : 'Choose a file'
        : extracted
          ? 'Import 8 sessions'
          : 'Parse schedule'

  const handlePrimary = () => {
    if (mode === 'manual') {
      toast({ title: 'Session added', text: `${manual.day} ${manual.start}–${manual.end} · Room ${manual.room}` })
      setModalOpen(false)
      return
    }
    if (mode === 'image') {
      if (!fileName) {
        setFileName('timetable-fall-2026.png')
        return
      }
      toast({ title: 'Timetable imported', text: '11 sessions added. 2 low-confidence entries need review.' })
      setModalOpen(false)
      return
    }
    if (mode === 'structured') {
      if (!extracted) {
        setExtracted(true)
        return
      }
      toast({ title: 'Timetable imported', text: '8 sessions created from structured text.' })
      setModalOpen(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Timetable"
        subtitle="Your weekly teaching schedule. Import from a photo, paste structured text, or add sessions manually."
        actions={
          <>
            <Button icon="plus" onClick={() => openImport('manual')}>
              Add session
            </Button>
            <Button variant="primary" icon="upload" onClick={() => openImport('choose')}>
              Import timetable
            </Button>
          </>
        }
      />

      <section className="card card--flush">
        <div className="card__header card__header--bordered" style={{ alignItems: 'center' }}>
          <div className="row" style={{ gap: 10 }}>
            <div className="row" style={{ gap: 2 }}>
              <button
                type="button"
                className="icon-btn icon-btn--bordered"
                aria-label="Previous week"
                onClick={() => setWeekIndex(Math.max(0, weekIndex - 1))}
                disabled={weekIndex === 0}
              >
                <Icon name="chevronLeft" size={15} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--bordered"
                aria-label="Next week"
                onClick={() => setWeekIndex(Math.min(weeks.length - 1, weekIndex + 1))}
                disabled={weekIndex === weeks.length - 1}
              >
                <Icon name="chevronRight" size={15} />
              </button>
            </div>
            <div>
              <h3 className="card__title">{week.label}</h3>
              <p className="card__sub">
                {week.today ? 'Week 13 · Current week' : 'Week 12 / 14 · Fall 2026'}
              </p>
            </div>
            {week.today && <Badge tone="blue">This week</Badge>}
          </div>

          <div className="row" style={{ gap: 8 }}>
            <div className="tt-legend">
              {classes.filter((item) => item.status === 'active').map((item) => (
                <span key={item.id}>
                  <i style={{ background: item.color }} />
                  {item.code}
                </span>
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              icon="calendar"
              onClick={() => setWeekIndex(1)}
              disabled={weekIndex === 1}
            >
              Today
            </Button>
          </div>
        </div>

        <div
          className="timetable"
          style={{ gridTemplateRows: `48px repeat(${TOTAL_ROWS}, 36px)` }}
          aria-label="Weekly timetable"
        >
          <div className="tt-corner" />
          {weekdays.map((day, index) => (
            <div
              key={day}
              className={cn('tt-dayhead', week.today && day === 'Thu' && 'is-today')}
              style={{ gridColumn: index + 2, gridRow: 1 }}
            >
              <span className="tt-dayhead__name">{day}</span>
              <span className="tt-dayhead__date">{week.dates[index]}</span>
            </div>
          ))}

          {hours.map((hour) => (
            <div
              key={`time-${hour}`}
              className="tt-time"
              style={{ gridRow: (hour - 8) * 2 + 2, gridColumn: 1 }}
            >
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}

          {hours.map((hour) => (
            <div
              key={`line-${hour}`}
              className="tt-cell-line"
              style={{ gridRow: (hour - 8) * 2 + 2, gridColumn: '2 / -1' }}
            />
          ))}

          {weekdays.map((day, index) => (
            <div key={`col-${day}`} className="tt-col-line" style={{ gridColumn: index + 2 }} />
          ))}

          {timetable.map((entry) => {
            const dayIndex = weekdays.indexOf(entry.day)
            const startRow = rowFor(toMinutes(entry.start))
            const endRow = rowFor(toMinutes(entry.end))
            const isLive = week.today && entry.day === 'Thu' && entry.classId === 'cs301'
            return (
              <button
                key={entry.id}
                type="button"
                className={cn('tt-session', isLive && 'is-live')}
                style={{
                  gridColumn: dayIndex + 2,
                  gridRow: `${startRow} / ${endRow}`,
                  '--session-color': entry.color,
                  '--session-bg': entry.tint,
                }}
                onClick={() =>
                  isLive
                    ? (window.location.hash = '/teacher/attendance')
                    : toast({ type: 'info', title: `${entry.code} · ${entry.day}`, text: `${entry.start}–${entry.end} · ${entry.room}` })
                }
              >
                <div className="tt-session__code">{entry.code}</div>
                <div className="tt-session__title">{entry.title}</div>
                <div className="tt-session__meta">
                  {entry.start}–{entry.end} · {entry.room}
                </div>
              </button>
            )
          })}

          {week.today && (
            <div
              className="tt-nowline"
              style={{ gridRow: nowRow, gridColumn: '2 / -1', transform: `translateY(${nowOffset}px)` }}
            >
              <span className="tt-nowline__label">09:42</span>
            </div>
          )}
        </div>

        <div className="agenda-list">
          {weekdays.map((day, index) => {
            const daySessions = timetable.filter((entry) => entry.day === day)
            if (!daySessions.length) return null
            return (
              <div key={day}>
                <div className="agenda-day">
                  {day} · Nov {week.dates[index]}
                </div>
                {daySessions.map((entry) => (
                  <div className="agenda-item" key={entry.id}>
                    <div className="agenda-item__time">
                      {entry.start}
                      <br />
                      {entry.end}
                    </div>
                    <div className="agenda-item__main">
                      <div className="agenda-item__title">
                        <span style={{ color: entry.color }}>{entry.code}</span> · {entry.title}
                      </div>
                      <div className="agenda-item__meta">
                        Room {entry.room}
                      </div>
                    </div>
                    <Icon name="chevronRight" size={15} className="muted" />
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <div className="card__footer">
          <span className="tiny muted">
            <Icon name="clock" size={12} className="inline-icon" /> 9 sessions · 13.5 teaching hours this week
          </span>
          <span className="row tiny muted" style={{ gap: 6 }}>
            <span className="status-dot" /> All rooms confirmed
          </span>
        </div>
      </section>

      <div className="grid grid-3 mt-20">
        <section className="card">
          <div className="card__body">
            <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="stat-card__icon stat-card__icon--blue">
                <Icon name="camera" size={17} />
              </span>
              <div>
                <div className="strong" style={{ fontSize: 13 }}>Import from a photo</div>
                <p className="tiny muted mt-4">
                  Upload a scan or photo of your faculty timetable. Review AI-extracted entries before
                  anything is saved.
                </p>
                <button type="button" className="card-link mt-8" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => openImport('image')}>
                  Upload image <Icon name="arrowRight" size={12} />
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card__body">
            <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="stat-card__icon stat-card__icon--purple">
                <Icon name="sparkles" size={17} />
              </span>
              <div>
                <div className="strong" style={{ fontSize: 13 }}>Paste structured text</div>
                <p className="tiny muted mt-4">
                  Copy your schedule from an email or spreadsheet. We normalize days, times and rooms.
                </p>
                <button type="button" className="card-link mt-8" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => openImport('structured')}>
                  Paste schedule <Icon name="arrowRight" size={12} />
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card__body">
            <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="stat-card__icon stat-card__icon--green">
                <Icon name="calendarPlus" size={17} />
              </span>
              <div>
                <div className="strong" style={{ fontSize: 13 }}>Add manually</div>
                <p className="tiny muted mt-4">
                  Create a single recurring session with full control over the day, time and room.
                </p>
                <button type="button" className="card-link mt-8" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => openImport('manual')}>
                  Add session <Icon name="arrowRight" size={12} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'choose' ? 'Import timetable' : mode === 'manual' ? 'Add a session' : mode === 'image' ? 'Import from image' : 'Import structured text'}
        subtitle={
          mode === 'choose'
            ? 'Choose how you want to bring your schedule into ClassTrack.'
            : mode === 'manual'
              ? 'Create a recurring weekly session for one of your classes.'
              : mode === 'image'
                ? 'Upload a photo, scan or PDF. AI extracts entries for your review.'
                : 'Paste text from an email, document or spreadsheet.'
        }
        icon={mode === 'image' ? 'camera' : mode === 'structured' ? 'sparkles' : mode === 'manual' ? 'calendarPlus' : 'upload'}
        width="wide"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            {mode !== 'choose' && (
              <Button variant="primary" icon={mode === 'manual' ? 'plus' : 'check'} onClick={handlePrimary}>
                {primaryLabel}
              </Button>
            )}
          </>
        }
      >
        {mode === 'choose' && (
          <div className="stack" style={{ gap: 10 }}>
            <button type="button" className="import-option" onClick={() => setMode('image')}>
              <span className="import-option__icon"><Icon name="image" size={18} /></span>
              <span>
                <span className="import-option__title">
                  Image-based AI import <Badge tone="purple">AI</Badge>
                </span>
                <span className="import-option__text">
                  Photo, screenshot, scan or PDF. Best for the timetable poster on your office wall.
                </span>
              </span>
              <Icon name="chevronRight" size={16} className="muted" style={{ marginLeft: 'auto' }} />
            </button>

            <button type="button" className="import-option" onClick={() => setMode('structured')}>
              <span className="import-option__icon"><Icon name="sparkles" size={18} /></span>
              <span>
                <span className="import-option__title">
                  Structured AI import <Badge tone="purple">AI</Badge>
                </span>
                <span className="import-option__text">
                  Paste free text or JSON. We normalize weekdays, times and room codes automatically.
                </span>
              </span>
              <Icon name="chevronRight" size={16} className="muted" style={{ marginLeft: 'auto' }} />
            </button>

            <button type="button" className="import-option" onClick={() => setMode('manual')}>
              <span className="import-option__icon"><Icon name="calendarPlus" size={18} /></span>
              <span>
                <span className="import-option__title">Manual entry</span>
                <span className="import-option__text">
                  Add one session at a time with full control over the schedule.
                </span>
              </span>
              <Icon name="chevronRight" size={16} className="muted" style={{ marginLeft: 'auto' }} />
            </button>

            <div className="info-banner mt-8">
              <Icon name="shield" size={15} className="info-banner__icon" />
              AI never writes directly to your timetable. You review every entry and conflicts are
              flagged before import.
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div className="form-grid">
            <Field label="Class" full>
              <select
                className="select"
                value={manual.classId}
                onChange={(event) => setManual((current) => ({ ...current, classId: event.target.value }))}
              >
                {classes.filter((item) => item.status === 'active').map((item) => (
                  <option key={item.id} value={item.id}>{item.code} · {item.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Day">
              <select
                className="select"
                value={manual.day}
                onChange={(event) => setManual((current) => ({ ...current, day: event.target.value }))}
              >
                {weekdays.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </Field>
            <Field label="Room">
              <input
                className="input"
                value={manual.room}
                onChange={(event) => setManual((current) => ({ ...current, room: event.target.value }))}
              />
            </Field>
            <Field label="Starts">
              <input
                className="input"
                type="time"
                value={manual.start}
                onChange={(event) => setManual((current) => ({ ...current, start: event.target.value }))}
              />
            </Field>
            <Field label="Ends">
              <input
                className="input"
                type="time"
                value={manual.end}
                onChange={(event) => setManual((current) => ({ ...current, end: event.target.value }))}
              />
            </Field>
            <div className="field--full">
              <div className="info-banner">
                <Icon name="info" size={15} className="info-banner__icon" />
                This session will repeat weekly for the rest of Fall 2026. Existing sessions are not
                affected.
              </div>
            </div>
          </div>
        )}

        {mode === 'image' && (
          <>
            {!fileName ? (
              <button type="button" className="dropzone w-full" onClick={() => setFileName('timetable-fall-2026.png')}>
                <div className="dropzone__icon"><Icon name="image" size={22} /></div>
                <div className="dropzone__title">Drop a timetable image here, or browse</div>
                <div className="dropzone__text">PNG, JPG, WEBP or PDF · up to 10 MB</div>
                <div className="dropzone__formats">Max 10 pages per upload</div>
              </button>
            ) : (
              <>
                <div className="row row--between" style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-3)' }}>
                  <div className="row" style={{ gap: 9 }}>
                    <span className="stat-card__icon stat-card__icon--blue" style={{ width: 32, height: 32 }}>
                      <Icon name="image" size={16} />
                    </span>
                    <div>
                      <div className="small strong">{fileName}</div>
                      <div className="tiny muted">1.4 MB · extracted just now</div>
                    </div>
                  </div>
                  <Badge tone="green" dot>11 sessions found</Badge>
                </div>

                <div className="info-banner info-banner--amber mt-16">
                  <Icon name="alertTriangle" size={15} className="info-banner__icon" />
                  Two entries have low confidence. Review the highlighted rows before importing.
                </div>

                <div className="mt-16">
                  {extractedRows.map((row) => (
                    <div className="extract-row" key={`${row.code}-${row.day}`}>
                      <Badge tone="slate">{row.day}</Badge>
                      <div style={{ minWidth: 0 }}>
                        <div className="strong" style={{ fontSize: 12 }}>{row.code} · {row.title}</div>
                        <div className="tiny muted">{row.time} · {row.room}</div>
                      </div>
                      <span className={cn('confidence', row.confidence < 80 && 'confidence--mid')}>
                        {row.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {mode === 'structured' && (
          <>
            <Field
              label="Paste your schedule"
              hint="One entry per line. Natural language and JSON both work."
            >
              <textarea
                className="textarea"
                style={{ minHeight: 170, fontFamily: 'var(--mono)', fontSize: 11.5 }}
                defaultValue={`Mon 11:00-12:30  CS-305 Database Systems  Lab C-112\nMon 14:00-15:30  CS-220 Web Engineering  Lab C-105\nTue 09:00-10:30  CS-301 Advanced Data Structures  B-204\nWed 14:00-15:30  CS-410 Human-Computer Interaction  A-310\nThu 16:00-17:30  CS-499 Capstone Project  Studio D-201`}
              />
            </Field>

            {extracted && (
              <div className="mt-16">
                <div className="row row--between mb-8">
                  <span className="mini-label">8 sessions parsed</span>
                  <Badge tone="green" dot>No conflicts</Badge>
                </div>
                {extractedRows.slice(0, 3).map((row) => (
                  <div className="extract-row" key={`text-${row.code}`}>
                    <Badge tone="slate">{row.day}</Badge>
                    <div style={{ minWidth: 0 }}>
                      <div className="strong" style={{ fontSize: 12 }}>{row.code} · {row.title}</div>
                      <div className="tiny muted">{row.time} · {row.room}</div>
                    </div>
                    <span className="confidence">Reviewed</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
