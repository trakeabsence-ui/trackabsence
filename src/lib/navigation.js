export const teacherNav = [
  { label: 'Dashboard', icon: 'dashboard', path: '/teacher/dashboard' },
  { label: 'Classes', icon: 'book', path: '/teacher/classes' },
  { label: 'Students', icon: 'users', path: '/teacher/students' },
  { label: 'Timetable', icon: 'calendar', path: '/teacher/timetable' },
  { label: 'Attendance', icon: 'clipboardCheck', path: '/teacher/attendance', badge: 'Live' },
  { label: 'Reports', icon: 'chart', path: '/teacher/reports' },
]

export const adminNav = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
  { label: 'Teachers', icon: 'graduation', path: '/admin/teachers' },
  { label: 'Monitoring', icon: 'activity', path: '/admin/monitoring', badge: '18' },
  { label: 'Reports', icon: 'chart', path: '/admin/reports' },
]

export const pageTitles = {
  '/teacher/dashboard': 'Dashboard',
  '/teacher/classes': 'Classes',
  '/teacher/students': 'Students',
  '/teacher/timetable': 'Timetable',
  '/teacher/attendance': 'Attendance',
  '/teacher/reports': 'Reports',
  '/teacher/profile': 'Profile',
  '/admin/dashboard': 'Dashboard',
  '/admin/teachers': 'Teachers',
  '/admin/monitoring': 'Monitoring',
  '/admin/reports': 'Reports',
  '/admin/profile': 'Profile',
}

export function navigate(path) {
  window.location.hash = path
}
