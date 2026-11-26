import { useEffect, useState } from 'react'
import { AppShell } from './components/Layout'
import { navigate, pageTitles } from './lib/navigation'
import { LogoMark } from './components/Icons'
import { Button, EmptyState, ToastProvider } from './components/ui'
import Login from './pages/Login'
import CheckIn from './pages/CheckIn'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherClasses from './pages/teacher/Classes'
import ClassDetail from './pages/teacher/ClassDetail'
import TeacherStudents from './pages/teacher/Students'
import TeacherTimetable from './pages/teacher/Timetable'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherReports from './pages/teacher/Reports'
import Profile from './pages/teacher/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTeachers from './pages/admin/Teachers'
import AdminMonitoring from './pages/admin/Monitoring'
import AdminReports from './pages/admin/Reports'

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '') || '/login'
  const [pathPart, queryPart] = raw.split('?')
  return {
    path: pathPart || '/login',
    query: new URLSearchParams(queryPart ?? ''),
  }
}

function documentTitle(path) {
  if (path === '/login') return 'Sign in'
  if (path === '/checkin') return 'Student check-in'
  if (path.startsWith('/teacher/classes/')) return 'Class detail'
  return pageTitles[path] ?? 'ClassTrack'
}

function NotFound({ role }) {
  return (
    <div className="card">
      <EmptyState
        icon="compass"
        title="Page not found"
        text="The page you are looking for may have moved or no longer exists."
        action={
          <Button
            variant="primary"
            icon="arrowLeft"
            onClick={() => navigate(role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard')}
          >
            Back to dashboard
          </Button>
        }
      />
    </div>
  )
}

function StandaloneNotFound() {
  return (
    <div className="checkin-page">
      <a className="checkin-brand" href="#/login">
        <LogoMark size={32} />
        <span>
          <span className="brand-name">
            Class<span>Track</span>
          </span>
          <span className="brand-sub">Attendance platform</span>
        </span>
      </a>
      <div className="checkin-card">
        <div className="checkin-card__body">
          <EmptyState
            icon="compass"
            title="Page not found"
            text="This link is not valid. Return to the workspace to continue."
            action={
              <Button variant="primary" icon="arrowRight" onClick={() => navigate('/login')}>
                Go to sign in
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}

function Workspace() {
  const [route, setRoute] = useState(parseRoute)
  const { path } = route

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${documentTitle(path)} · ClassTrack`
  }, [path])

  if (path === '/login') return <Login />
  if (path === '/checkin') return <CheckIn initialCode={route.query.get('code') ?? ''} />

  const isTeacher = path === '/teacher' || path.startsWith('/teacher/')
  const isAdmin = path === '/admin' || path.startsWith('/admin/')
  if (!isTeacher && !isAdmin) return <StandaloneNotFound />

  const role = isAdmin ? 'admin' : 'teacher'
  const base = isAdmin ? '/admin' : '/teacher'

  let page
  if (path === '/teacher' || path === '/teacher/dashboard') page = <TeacherDashboard />
  else if (path === '/teacher/classes') page = <TeacherClasses />
  else if (path.startsWith('/teacher/classes/')) {
    page = <ClassDetail key={path} classId={path.split('/')[3]} />
  } else if (path === '/teacher/students') page = <TeacherStudents />
  else if (path === '/teacher/timetable') page = <TeacherTimetable />
  else if (path === '/teacher/attendance') page = <TeacherAttendance />
  else if (path === '/teacher/reports') page = <TeacherReports />
  else if (path === '/teacher/profile') page = <Profile role="teacher" />
  else if (path === '/admin' || path === '/admin/dashboard') page = <AdminDashboard />
  else if (path === '/admin/teachers') page = <AdminTeachers />
  else if (path === '/admin/monitoring') page = <AdminMonitoring />
  else if (path === '/admin/reports') page = <AdminReports />
  else if (path === '/admin/profile') page = <Profile role="admin" />
  else page = <NotFound role={role} />

  return (
    <AppShell role={role} route={path === base ? `${base}/dashboard` : path}>
      {page}
    </AppShell>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Workspace />
    </ToastProvider>
  )
}
