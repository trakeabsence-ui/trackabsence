import { useState } from 'react'
import { Icon } from '../../components/Icons'
import { Avatar, Badge, Button, Field, Toggle, useToast } from '../../components/ui'
import { PageHeader } from '../../components/Layout'
import { adminUser, classes, currentUser, institution } from '../../data/mockData'

export default function Profile({ role = 'teacher' }) {
  const toast = useToast()
  const user = role === 'admin' ? adminUser : currentUser
  const [prefs, setPrefs] = useState({
    sessions: true,
    weekly: true,
    risk: true,
    product: false,
  })
  const [mfa, setMfa] = useState(role === 'admin')

  const save = () => toast({ title: 'Profile updated', text: 'Your changes were saved successfully.' })

  return (
    <>
      <PageHeader
        eyebrow="Account settings"
        title="Profile"
        subtitle="Manage your personal information, teaching load and notification preferences."
        actions={
          <Button variant="primary" icon="check" onClick={save}>
            Save changes
          </Button>
        }
      />

      <section className="card" style={{ overflow: 'hidden' }}>
        <div className="profile-cover" />
        <div className="profile-head">
          <Avatar name={user.name} size="xl" color={user.color} />
          <div className="profile-head__info">
            <div className="profile-head__name">
              {user.name}
              <Badge tone="green" dot>Verified</Badge>
            </div>
            <div className="profile-head__sub">
              {user.title} · {user.department}
            </div>
          </div>
          <div className="row" style={{ gap: 8, paddingBottom: 4 }}>
            <Button size="sm" icon="camera" onClick={() => toast({ type: 'info', title: 'Upload a new photo', text: 'JPG or PNG, at least 400 × 400 px.' })}>
              Change photo
            </Button>
            <Button size="sm" variant="ghost" icon="settings" onClick={() => toast({ type: 'info', title: 'Account settings' })}>
              Settings
            </Button>
          </div>
        </div>
        <div className="profile-meta-grid" style={{ padding: '18px 24px 22px', marginTop: 6 }}>
          <div>
            <div className="profile-meta__label">Email</div>
            <div className="profile-meta__value">
              <Icon name="mail" size={13} className="muted" /> {user.email}
            </div>
          </div>
          <div>
            <div className="profile-meta__label">Office</div>
            <div className="profile-meta__value">
              <Icon name="mapPin" size={13} className="muted" /> {user.office}
            </div>
          </div>
          <div>
            <div className="profile-meta__label">Employee ID</div>
            <div className="profile-meta__value mono">{user.employeeId}</div>
          </div>
          <div>
            <div className="profile-meta__label">Member since</div>
            <div className="profile-meta__value">{user.joined}</div>
          </div>
        </div>
      </section>

      <div className="grid grid-1-2 mt-20">
        <div className="stack">
          <section className="card">
            <div className="card__header card__header--bordered">
              <div>
                <h3 className="card__title">About</h3>
                <p className="card__sub">Visible to your department</p>
              </div>
            </div>
            <div className="card__body">
              <p className="small" style={{ color: 'var(--slate-600)', lineHeight: 1.6 }}>
                {user.bio}
              </p>
              <div className="divider mt-16 mb-16" />
              <div className="stack--sm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="row" style={{ gap: 9 }}>
                  <Icon name="mail" size={14} className="muted" />
                  <span className="small">{user.email}</span>
                </div>
                <div className="row" style={{ gap: 9 }}>
                  <Icon name="phone" size={14} className="muted" />
                  <span className="small">{user.phone}</span>
                </div>
                <div className="row" style={{ gap: 9 }}>
                  <Icon name="building" size={14} className="muted" />
                  <span className="small">{user.department}</span>
                </div>
                <div className="row" style={{ gap: 9 }}>
                  <Icon name="clock" size={14} className="muted" />
                  <span className="small">Office hours: Tue & Thu, 14:00 – 15:30</span>
                </div>
              </div>
            </div>
          </section>

          {role === 'admin' ? (
            <section className="card">
              <div className="card__header card__header--bordered">
                <div>
                  <h3 className="card__title">Institution oversight</h3>
                  <p className="card__sub">Fall 2026</p>
                </div>
              </div>
              <div className="card__body">
                <div className="grid grid-3" style={{ gap: 10 }}>
                  {[
                    ['Students', institution.students.toLocaleString()],
                    ['Teachers', institution.teachers],
                    ['Classes', institution.classes],
                  ].map(([label, value]) => (
                    <div className="card" key={label} style={{ padding: 11, boxShadow: 'none' }}>
                      <div className="mini-label">{label}</div>
                      <div className="stat-card__value" style={{ fontSize: 18 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="divider mt-16 mb-8" />
                {['Computer Science', 'Engineering', 'Mathematics', 'Business'].map((department, index) => (
                  <div className="load-item" key={department}>
                    <span className="load-item__dot" style={{ background: ['#2563EB', '#0D9488', '#7C3AED', '#D97706'][index] }} />
                    <div className="load-item__main">
                      <div className="load-item__name">{department}</div>
                      <div className="load-item__sub">{['38', '31', '24', '27'][index]} classes</div>
                    </div>
                    <Badge tone="slate">Oversight</Badge>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="card">
              <div className="card__header card__header--bordered">
                <div>
                  <h3 className="card__title">Teaching load</h3>
                  <p className="card__sub">5 active classes · 180 students</p>
                </div>
                <a className="card-link" href="#/teacher/classes">View all</a>
              </div>
              <div className="card__body">
                {classes.filter((item) => item.status === 'active').map((item) => (
                  <div className="load-item" key={item.id}>
                    <span className="load-item__dot" style={{ background: item.color }} />
                    <div className="load-item__main">
                      <div className="load-item__name">{item.code} · {item.title}</div>
                      <div className="load-item__sub">{item.students} students · {item.schedule}</div>
                    </div>
                    <span className="small strong">{item.attendance}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">This term</h3>
                <p className="card__sub">Your teaching summary</p>
              </div>
            </div>
            <div className="card__body">
              <div className="grid grid-2" style={{ gap: 10 }}>
                <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
                  <div className="mini-label">Attendance</div>
                  <div className="stat-card__value" style={{ fontSize: 20, color: 'var(--green)' }}>92.4%</div>
                </div>
                <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
                  <div className="mini-label">Sessions</div>
                  <div className="stat-card__value" style={{ fontSize: 20 }}>81</div>
                </div>
                <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
                  <div className="mini-label">Students</div>
                  <div className="stat-card__value" style={{ fontSize: 20 }}>180</div>
                </div>
                <div className="card" style={{ padding: 12, boxShadow: 'none' }}>
                  <div className="mini-label">At risk</div>
                  <div className="stat-card__value" style={{ fontSize: 20, color: 'var(--red)' }}>4</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card__header card__header--bordered">
              <div>
                <h3 className="card__title">Personal information</h3>
                <p className="card__sub">Used across attendance records and reports</p>
              </div>
              <Badge tone="slate">Editable</Badge>
            </div>
            <div className="card__body">
              <div className="form-grid">
                <Field label="First name">
                  <input className="input" defaultValue={user.firstName} />
                </Field>
                <Field label="Last name">
                  <input className="input" defaultValue={user.lastName} />
                </Field>
                <Field label="Email" hint="Changing your email requires verification.">
                  <input className="input" type="email" defaultValue={user.email} />
                </Field>
                <Field label="Phone">
                  <input className="input" defaultValue={user.phone} />
                </Field>
                <Field label="Job title">
                  <input className="input" defaultValue={user.title} />
                </Field>
                <Field label="Department">
                  <input className="input" defaultValue={user.department} />
                </Field>
                <Field label="Office" full>
                  <input className="input" defaultValue={user.office} />
                </Field>
                <Field label="Bio" full>
                  <textarea className="textarea" defaultValue={user.bio} />
                </Field>
              </div>
              <div className="row row--between mt-16">
                <span className="tiny muted">Last updated on November 12, 2026</span>
                <Button variant="primary" size="sm" icon="check" onClick={save}>Save changes</Button>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__header card__header--bordered">
              <div>
                <h3 className="card__title">Notifications</h3>
                <p className="card__sub">Choose what reaches your inbox</p>
              </div>
              <Icon name="bell" size={17} className="muted" />
            </div>
            <div className="card__body">
              {[
                ['sessions', 'Session reminders', 'A reminder 30 minutes before each scheduled session.'],
                ['weekly', 'Weekly attendance digest', 'A Monday summary of attendance and at-risk students.'],
                ['risk', 'At-risk student alerts', 'Immediate alert when a student falls below 75%.'],
                ['product', 'Product updates', 'New features and improvements from ClassTrack.'],
              ].map(([key, title, text]) => (
                <div className="switch-row" key={key}>
                  <div>
                    <div className="switch-row__title">{title}</div>
                    <div className="switch-row__text">{text}</div>
                  </div>
                  <Toggle
                    checked={prefs[key]}
                    label={title}
                    onChange={(value) => setPrefs((current) => ({ ...current, [key]: value }))}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card__header card__header--bordered">
              <div>
                <h3 className="card__title">Security</h3>
                <p className="card__sub">Protect your account and data</p>
              </div>
              <Icon name="shield" size={17} className="muted" />
            </div>
            <div className="card__body">
              <div className="switch-row">
                <div>
                  <div className="switch-row__title">Password</div>
                  <div className="switch-row__text">Last changed 3 months ago.</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => toast({ type: 'info', title: 'Password reset email sent' })}>
                  Change
                </Button>
              </div>
              <div className="switch-row">
                <div>
                  <div className="switch-row__title">Two-factor authentication</div>
                  <div className="switch-row__text">Require a verification code when signing in.</div>
                </div>
                <Toggle checked={mfa} label="Two-factor authentication" onChange={setMfa} />
              </div>
              <div className="switch-row">
                <div>
                  <div className="switch-row__title">Active sessions</div>
                  <div className="switch-row__text">MacBook Pro · Chrome · Casablanca, MA (current)</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => toast({ type: 'error', title: 'Other sessions signed out' })}>
                  Sign out others
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
