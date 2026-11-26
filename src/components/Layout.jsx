import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon, LogoMark } from './Icons'
import { Avatar, Dropdown, IconButton, MenuItem } from './ui'
import {
  adminUser,
  classes,
  currentUser,
  institution,
  notifications as seedNotifications,
  teachers,
} from '../data/mockData'
import { cn } from '../lib/utils'
import { adminNav, navigate, pageTitles, teacherNav } from '../lib/navigation'

function currentTitle(route) {
  if (route.startsWith('/teacher/classes/')) {
    const id = route.split('/')[3]
    return classes.find((item) => item.id === id)?.code ?? 'Class'
  }
  return pageTitles[route] ?? 'ClassTrack'
}

/* --------------------------------------------------------------------------
   Sidebar
   -------------------------------------------------------------------------- */
function Sidebar({ role, route, open, onClose }) {
  const user = role === 'admin' ? adminUser : currentUser
  const nav = role === 'admin' ? adminNav : teacherNav
  const base = role === 'admin' ? '/admin' : '/teacher'

  return (
    <aside className={cn('sidebar', open && 'is-open')} aria-label="Main navigation">
      <a className="sidebar__brand" href={`#${base}/dashboard`} onClick={onClose}>
        <LogoMark />
        <span>
          <span className="brand-name">
            Class<span>Track</span>
          </span>
          <span className="brand-sub">Attendance platform</span>
        </span>
      </a>

      <button type="button" className="workspace-switch" onClick={() => navigate(`${base}/profile`)}>
        <span className="workspace-avatar">NU</span>
        <span className="workspace-meta">
          <span className="workspace-name">{institution.name}</span>
          <span className="workspace-role">
            {role === 'admin' ? 'Administrator console' : 'Faculty workspace'}
          </span>
        </span>
        <Icon name="chevronDown" size={14} className="muted" />
      </button>

      <div className="role-toggle" role="tablist" aria-label="Workspace role">
        <button
          type="button"
          role="tab"
          aria-selected={role !== 'admin'}
          className={cn(role !== 'admin' && 'is-active')}
          onClick={() => navigate('/teacher/dashboard')}
        >
          <Icon name="graduation" size={13} />
          Teacher
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === 'admin'}
          className={cn(role === 'admin' && 'is-active')}
          onClick={() => navigate('/admin/dashboard')}
        >
          <Icon name="shield" size={13} />
          Admin
        </button>
      </div>

      <nav className="sidebar__nav">
        <div className="nav-group">
          <div className="nav-label">{role === 'admin' ? 'Administration' : 'Workspace'}</div>
          {nav.map((item) => {
            const active =
              route === item.path ||
              (item.path !== `${base}/dashboard` && route.startsWith(`${item.path}/`))
            return (
              <a
                key={item.path}
                href={`#${item.path}`}
                className={cn('nav-item', active && 'is-active')}
                onClick={onClose}
              >
                <Icon name={item.icon} size={17} className="nav-icon" />
                {item.label}
                {item.badge && (
                  <span className={cn('nav-badge', item.badge === 'Live' && 'nav-badge--soft')}>
                    {item.badge}
                  </span>
                )}
              </a>
            )
          })}
        </div>

        <div className="nav-group">
          <div className="nav-label">Account</div>
          <a
            href={`#${base}/profile`}
            className={cn('nav-item', route === `${base}/profile` && 'is-active')}
            onClick={onClose}
          >
            <Icon name="user" size={17} className="nav-icon" />
            Profile
          </a>
          <a
            href="#/login"
            className="nav-item"
            onClick={onClose}
          >
            <Icon name="help" size={17} className="nav-icon" />
            Help & support
          </a>
        </div>
      </nav>

      <div className="sidebar__bottom">
        <div className="help-card">
          <div className="help-card__title">
            <Icon name="sparkles" size={14} color="#2563EB" />
            {role === 'admin' ? 'Compliance toolkit' : 'AI timetable import'}
          </div>
          <div className="help-card__text">
            {role === 'admin'
              ? 'Export accreditation-ready attendance reports in seconds.'
              : 'Turn a photo of your timetable into sessions automatically.'}
          </div>
          <a href={role === 'admin' ? '#/admin/reports' : '#/teacher/timetable'}>
            {role === 'admin' ? 'Open reports' : 'Try it now'}
            <Icon name="arrowRight" size={12} />
          </a>
        </div>

        <a href={`#${base}/profile`} className="user-chip" onClick={onClose}>
          <Avatar name={user.name} size="sm" color={user.color} />
          <span className="user-chip__meta">
            <span className="user-chip__name">{user.name}</span>
            <span className="user-chip__role">
              {role === 'admin' ? 'Administrator' : 'Teacher'}
            </span>
          </span>
          <Icon name="chevronRight" size={14} className="muted" />
        </a>
      </div>
    </aside>
  )
}

/* --------------------------------------------------------------------------
   Notifications
   -------------------------------------------------------------------------- */
const notificationTone = {
  session: { icon: 'calendar', bg: '#EFF6FF', color: '#2563EB' },
  attendance: { icon: 'alertTriangle', bg: '#FEF2F2', color: '#DC2626' },
  import: { icon: 'upload', bg: '#F0FDF4', color: '#16A34A' },
  report: { icon: 'fileText', bg: '#F5F3FF', color: '#7C3AED' },
  system: { icon: 'users', bg: '#F1F5F9', color: '#475569' },
}

function NotificationBell() {
  const [items, setItems] = useState(seedNotifications)
  const unread = items.filter((item) => item.unread).length

  return (
    <Dropdown
      panel
      closeOnClick={false}
      trigger={
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton icon="bell" label="Notifications" />
          {unread > 0 && (
            <span
              className="dot"
              style={{
                position: 'absolute',
                top: 6,
                right: 7,
                width: 7,
                height: 7,
                borderRadius: 99,
                background: '#DC2626',
                border: '1.5px solid #F8FAFC',
              }}
            />
          )}
        </span>
      }
    >
      <div className="popover__head">
        <span className="popover__title">
          Notifications {unread > 0 && <span className="muted">· {unread} new</span>}
        </span>
        <button
          type="button"
          className="card-link"
          onClick={() => setItems((current) => current.map((item) => ({ ...item, unread: false })))}
          style={{ border: 0, background: 'transparent', padding: 0 }}
        >
          Mark all read
        </button>
      </div>
      <div className="popover__list">
        {items.map((item) => {
          const tone = notificationTone[item.type] ?? notificationTone.system
          return (
            <div
              key={item.id}
              className={cn('notification', item.unread && 'is-unread')}
              onClick={() =>
                setItems((current) =>
                  current.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)),
                )
              }
            >
              <span
                className="notification__icon"
                style={{ background: tone.bg, color: tone.color }}
              >
                <Icon name={tone.icon} size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="notification__title">{item.title}</div>
                <div className="notification__text">{item.text}</div>
                <div className="notification__time">{item.time}</div>
              </div>
              {item.unread && <span className="notification__dot" />}
            </div>
          )
        })}
      </div>
      <div className="popover__foot">
        <a href="#/teacher/profile" className="card-link">
          Notification settings
          <Icon name="arrowRight" size={12} />
        </a>
      </div>
    </Dropdown>
  )
}

/* --------------------------------------------------------------------------
   Topbar
   -------------------------------------------------------------------------- */
function Topbar({ role, route, onOpenMenu, onOpenPalette }) {
  const user = role === 'admin' ? adminUser : currentUser
  const roleLabel = role === 'admin' ? 'Administration' : 'Teacher workspace'
  const title = currentTitle(route)

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn mobile-menu"
        aria-label="Open navigation"
        onClick={onOpenMenu}
      >
        <Icon name="menu" size={19} />
      </button>

      <div className="topbar__crumbs">
        <span className="crumb-hide">{roleLabel}</span>
        <Icon name="chevronRight" size={12} className="crumb-sep" />
        <strong>{title}</strong>
      </div>

      <div className="topbar__spacer" />

      <div className="topbar__search">
        <Icon name="search" size={15} className="search-icon" />
        <input
          readOnly
          placeholder="Search anything…"
          aria-label="Open quick search"
          onFocus={onOpenPalette}
          onClick={onOpenPalette}
        />
        <span className="kbd">⌘K</span>
      </div>

      <div className="topbar__actions">
        <IconButton icon="help" label="Help center" />
        <NotificationBell />
        <span className="topbar__divider" />
        <Dropdown
          trigger={
            <button type="button" className="avatar-btn" aria-label="Account menu">
              <Avatar name={user.name} size="sm" color={user.color} />
            </button>
          }
        >
          <div className="menu-header">
            <div className="strong" style={{ fontSize: 12.5 }}>{user.name}</div>
            <div className="tiny muted">{user.email}</div>
          </div>
          <MenuItem icon="user" onClick={() => navigate(`/${role}/profile`)}>
            View profile
          </MenuItem>
          <MenuItem icon="settings" onClick={() => navigate(`/${role}/profile`)}>
            Account settings
          </MenuItem>
          <div className="menu-sep" />
          <MenuItem
            icon={role === 'admin' ? 'graduation' : 'shield'}
            onClick={() => navigate(role === 'admin' ? '/teacher/dashboard' : '/admin/dashboard')}
          >
            Switch to {role === 'admin' ? 'teacher' : 'admin'} view
          </MenuItem>
          <div className="menu-sep" />
          <MenuItem icon="logout" danger onClick={() => navigate('/login')}>
            Sign out
          </MenuItem>
        </Dropdown>
      </div>
    </header>
  )
}

/* --------------------------------------------------------------------------
   Command palette
   -------------------------------------------------------------------------- */
function PaletteDialog({ onClose, role }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [])

  const pages = role === 'admin' ? adminNav : teacherNav
  const people = role === 'admin' ? teachers.map((teacher) => ({
    id: teacher.id,
    label: teacher.name,
    sub: teacher.department,
    path: '/admin/teachers',
    icon: 'graduation',
  })) : []

  const classResults = role === 'admin' ? [] : classes
    .filter((item) => item.status === 'active')
    .map((item) => ({
      id: item.id,
      label: `${item.code} · ${item.title}`,
      sub: item.schedule,
      path: `/teacher/classes/${item.id}`,
      icon: 'book',
    }))

  const normalized = query.trim().toLowerCase()
  const filter = (items) =>
    items.filter((item) => `${item.label} ${item.sub ?? ''}`.toLowerCase().includes(normalized))

  const pageResults = filter(pages.map((item) => ({ ...item, sub: 'Page', path: item.path })))
  const classMatches = filter(classResults)
  const peopleMatches = filter(people)
  const empty = pageResults.length + classMatches.length + peopleMatches.length === 0

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Quick search">
        <div className="palette__input">
          <Icon name="search" size={18} className="muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, classes, people…"
          />
          <span className="kbd" style={{ position: 'static', transform: 'none' }}>Esc</span>
        </div>
        <div className="palette__results">
          {pageResults.length > 0 && <div className="palette__group">Navigate</div>}
          {pageResults.map((item) => (
            <button
              type="button"
              key={item.path}
              className="palette__item"
              onClick={() => {
                navigate(item.path)
                onClose()
              }}
            >
              <Icon name={item.icon} size={16} className="muted" />
              {item.label}
              <span className="muted">Page</span>
            </button>
          ))}

          {classMatches.length > 0 && <div className="palette__group">Classes</div>}
          {classMatches.map((item) => (
            <button
              type="button"
              key={item.id}
              className="palette__item"
              onClick={() => {
                navigate(item.path)
                onClose()
              }}
            >
              <Icon name={item.icon} size={16} className="muted" />
              {item.label}
              <span className="muted">Class</span>
            </button>
          ))}

          {peopleMatches.length > 0 && <div className="palette__group">People</div>}
          {peopleMatches.slice(0, 5).map((item) => (
            <button
              type="button"
              key={item.id}
              className="palette__item"
              onClick={() => {
                navigate(item.path)
                onClose()
              }}
            >
              <Icon name={item.icon} size={16} className="muted" />
              {item.label}
              <span className="muted">{item.sub}</span>
            </button>
          ))}

          {empty && <div className="palette__empty">No results for “{query}”.</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function CommandPalette({ open, onClose, role }) {
  if (!open) return null
  return <PaletteDialog onClose={onClose} role={role} />
}

/* --------------------------------------------------------------------------
   Shell
   -------------------------------------------------------------------------- */
export function AppShell({ role, route, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [previousRoute, setPreviousRoute] = useState(route)

  if (previousRoute !== route) {
    setPreviousRoute(route)
    setSidebarOpen(false)
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((value) => !value)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="app-shell">
      <Sidebar role={role} route={route} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className={cn('sidebar-scrim', sidebarOpen && 'is-visible')}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <div className="shell-main">
        <Topbar
          role={role}
          route={route}
          onOpenMenu={() => setSidebarOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="page">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={role} />
    </div>
  )
}

/* --------------------------------------------------------------------------
   Page header
   -------------------------------------------------------------------------- */
export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="page-header__sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}

/* --------------------------------------------------------------------------
   Shared bits used across pages
   -------------------------------------------------------------------------- */
export function SessionStatusBadge({ status }) {
  const map = {
    live: { tone: 'red', label: 'Live', dot: true },
    scheduled: { tone: 'blue', label: 'Scheduled', dot: true },
    upcoming: { tone: 'slate', label: 'Upcoming', dot: false },
    completed: { tone: 'green', label: 'Completed', dot: true },
    cancelled: { tone: 'red', label: 'Cancelled', dot: false },
    rescheduled: { tone: 'amber', label: 'Rescheduled', dot: false },
    archived: { tone: 'slate', label: 'Archived', dot: false },
  }
  const meta = map[status] ?? map.scheduled
  return (
    <span className={cn('badge', `badge--${meta.tone}`)}>
      {meta.dot && <span className="badge__dot" />}
      {meta.label}
    </span>
  )
}
