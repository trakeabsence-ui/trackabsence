import { useEffect, useState } from 'react'
import { AppShell } from './components/Layout'
import { navigate, pageTitles } from './lib/navigation'
import { LogoMark } from './components/Icons'
import { Button, EmptyState, ToastProvider } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
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
  const hashRoute = window.location.hash.replace(/^#/, '')
  const search = new URLSearchParams(window.location.search)
  const queryRoute = search.get('route')
  const raw = hashRoute.startsWith('/')
    ? hashRoute
    : queryRoute
      ? queryRoute
      : '/login'
  const [pathPart, queryPart] = raw.split('?')
  const query = queryRoute && raw === queryRoute ? search : new URLSearchParams(queryPart ?? '')
  if (queryRoute && raw === queryRoute) query.delete('route')
  return {
    path: pathPart || '/login',
    query,
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

function AccountUnavailable({ profile, profileError, signOut }) {
  const [error, setError] = useState('')
  const handleSignOut = async () => {
    setError('')
    try {
      const { error: signOutError } = await signOut()
      if (signOutError) setError(signOutError.message)
    } catch (signOutError) {
      setError(signOutError.message || 'Unable to sign out.')
    }
  }

  const message =
    profile?.status === 'invited'
      ? 'Your account is awaiting activation by your institution.'
      : profile?.status === 'suspended'
        ? 'This account has been suspended. Contact your institution for help.'
        : profileError || 'An active account profile could not be found.'

  return (
    <div className="auth">
      <main className="auth__main">
        <div className="auth-form">
          <h2 className="auth-form__title">Account access unavailable</h2>
          <p className="auth-form__sub" role="status">{message}</p>
          {error && <p role="alert" style={{ color: '#DC2626', marginTop: 12 }}>{error}</p>}
          <Button variant="primary" size="lg" className="btn--block" onClick={handleSignOut} style={{ marginTop: 16 }}>
            Sign out
          </Button>
        </div>
      </main>
    </div>
  )
}

function Workspace() {
  const { session, profile, role, loading, profileError, signOut } = useAuth()
  const [route, setRoute] = useState(parseRoute)
  const { path } = route

  useEffect(() => {
    if (loading) return
    if (!session && path !== '/login' && path !== '/register' && path !== '/checkin' && path !== '/reset') {
      navigate('/login')
    }
    if (session && role && (path === '/login' || path === '/register')) {
      navigate(role === 'admin' ? '/admin/dashboard' : role === 'teacher' ? '/teacher/dashboard' : '/checkin')
    }
    if (session && role === 'student' && (path.startsWith('/teacher') || path.startsWith('/admin'))) {
      navigate('/checkin')
    }
    if (session && role === 'teacher' && path.startsWith('/admin')) {
      navigate('/teacher/dashboard')
    }
    if (session && role === 'admin' && path.startsWith('/teacher')) {
      navigate('/admin/dashboard')
    }
  }, [loading, session, role, path])

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${documentTitle(path)} · ClassTrack`
  }, [path])

  if (loading) {
    return (
      <div className="auth" role="status">
        <main className="auth__main">
          <p className="auth-form__sub">Checking your account…</p>
        </main>
      </div>
    )
  }

  if (session && (!profile || profile.status !== 'active')) {
    return <AccountUnavailable profile={profile} profileError={profileError} signOut={signOut} />
  }

  if (path === '/login') return <Login />
  if (path === '/register') return <Register />
  if (path === '/reset') return <ResetPassword />
  if (path === '/checkin') return <CheckIn initialCode={route.query.get('code') ?? ''} />

  const isTeacher = path === '/teacher' || path.startsWith('/teacher/')
  const isAdmin = path === '/admin' || path.startsWith('/admin/')
  if (!isTeacher && !isAdmin) return <StandaloneNotFound />

  const viewRole = isAdmin ? 'admin' : 'teacher'
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
  else page = <NotFound role={viewRole} />

  return (
    <AppShell role={viewRole} route={path === base ? `${base}/dashboard` : path}>
      {page}
    </AppShell>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Workspace />
      </AuthProvider>
    </ToastProvider>
  )
}
