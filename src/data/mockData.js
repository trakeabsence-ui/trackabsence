// ============================================================================
// ClassTrack — demo dataset (fictional)
// Replaced by Supabase queries in production.
// ============================================================================

export const institution = {
  name: 'Northbridge University',
  short: 'Northbridge',
  faculty: 'Faculty of Computing & Engineering',
  term: 'Fall 2026',
  timezone: 'Africa/Casablanca',
  students: 2418,
  teachers: 84,
  classes: 142,
  attendanceRate: 91.8,
}

export const currentUser = {
  id: 'u-teacher-1',
  name: 'Amina El Fassi',
  firstName: 'Amina',
  lastName: 'El Fassi',
  initials: 'AE',
  title: 'Associate Professor',
  department: 'Computer Science',
  email: 'amina.elfassi@northbridge.edu',
  phone: '+212 6 61 24 88 10',
  office: 'B-210, Bennett Hall',
  joined: 'September 2019',
  employeeId: 'NB-FAC-0184',
  bio: 'Associate Professor of Computer Science. Research in distributed systems and learning analytics. Teaching data structures, database systems and capstone projects.',
  color: '#2563EB',
}

export const adminUser = {
  id: 'u-admin-1',
  name: 'Karim Bennis',
  firstName: 'Karim',
  lastName: 'Bennis',
  initials: 'KB',
  title: 'Academic Operations Administrator',
  department: 'Registrar Office',
  email: 'karim.bennis@northbridge.edu',
  phone: '+212 6 62 90 14 32',
  office: 'A-100, Administration Building',
  joined: 'March 2017',
  employeeId: 'NB-ADM-0042',
  bio: 'Leads academic operations, attendance compliance and institutional reporting across Northbridge University.',
  color: '#7C3AED',
}

export const classes = [
  {
    id: 'cs301',
    code: 'CS-301',
    title: 'Advanced Data Structures',
    description:
      'Trees, graphs, heaps and advanced algorithmic analysis with weekly laboratory work.',
    teacher: 'Dr. Amina El Fassi',
    teacherId: 'u-teacher-1',
    department: 'Computer Science',
    term: 'Fall 2026',
    room: 'B-204',
    days: ['Tue', 'Thu'],
    schedule: 'Tue & Thu · 09:00 – 10:30',
    time: '09:00',
    students: 42,
    sessions: 18,
    attendance: 92.4,
    nextSession: 'Today · 09:00',
    color: '#2563EB',
    tint: '#EFF6FF',
    status: 'active',
  },
  {
    id: 'cs305',
    code: 'CS-305',
    title: 'Database Systems',
    description:
      'Relational modelling, SQL, indexing, transactions and query optimization.',
    teacher: 'Dr. Amina El Fassi',
    teacherId: 'u-teacher-1',
    department: 'Computer Science',
    term: 'Fall 2026',
    room: 'Lab C-112',
    days: ['Mon', 'Wed'],
    schedule: 'Mon & Wed · 11:00 – 12:30',
    time: '11:00',
    students: 38,
    sessions: 18,
    attendance: 88.1,
    nextSession: 'Mon, Nov 30 · 11:00',
    color: '#7C3AED',
    tint: '#F5F3FF',
    status: 'active',
  },
  {
    id: 'cs410',
    code: 'CS-410',
    title: 'Human-Computer Interaction',
    description:
      'Interaction design, usability evaluation, accessibility and prototyping methods.',
    teacher: 'Dr. Amina El Fassi',
    teacherId: 'u-teacher-1',
    department: 'Computer Science',
    term: 'Fall 2026',
    room: 'A-310',
    days: ['Wed'],
    schedule: 'Wed · 14:00 – 15:30',
    time: '14:00',
    students: 31,
    sessions: 16,
    attendance: 95.2,
    nextSession: 'Wed, Dec 2 · 14:00',
    color: '#0D9488',
    tint: '#F0FDFA',
    status: 'active',
  },
  {
    id: 'cs220',
    code: 'CS-220',
    title: 'Web Engineering',
    description:
      'Modern web architecture, APIs, accessibility and production front-end practices.',
    teacher: 'Dr. Amina El Fassi',
    teacherId: 'u-teacher-1',
    department: 'Computer Science',
    term: 'Fall 2026',
    room: 'Lab C-105',
    days: ['Mon', 'Fri'],
    schedule: 'Mon & Fri · 10:00 – 11:30',
    time: '10:00',
    students: 45,
    sessions: 17,
    attendance: 84.7,
    nextSession: 'Fri, Nov 27 · 10:00',
    color: '#D97706',
    tint: '#FFFBEB',
    status: 'active',
  },
  {
    id: 'cs499',
    code: 'CS-499',
    title: 'Capstone Project',
    description:
      'Year-long team project with industry mentors, design reviews and final defence.',
    teacher: 'Dr. Amina El Fassi',
    teacherId: 'u-teacher-1',
    department: 'Computer Science',
    term: 'Fall 2026',
    room: 'Studio D-201',
    days: ['Thu'],
    schedule: 'Thu · 16:00 – 17:30',
    time: '16:00',
    students: 24,
    sessions: 12,
    attendance: 90.3,
    nextSession: 'Today · 16:00',
    color: '#DB2777',
    tint: '#FDF2F8',
    status: 'active',
  },
  {
    id: 'cs480',
    code: 'CS-480',
    title: 'Machine Learning Foundations',
    description:
      'Supervised learning, model evaluation and responsible ML practice.',
    teacher: 'Dr. Amina El Fassi',
    teacherId: 'u-teacher-1',
    department: 'Computer Science',
    term: 'Spring 2026',
    room: 'B-118',
    days: ['Tue', 'Thu'],
    schedule: 'Tue & Thu · 13:00 – 14:30',
    time: '13:00',
    students: 36,
    sessions: 24,
    attendance: 89.1,
    nextSession: 'Archived',
    color: '#64748B',
    tint: '#F1F5F9',
    status: 'archived',
  },
]

// ---------------------------------------------------------------------------
// Students — 180 total, matching class sizes exactly.
// ---------------------------------------------------------------------------
const classRosters = {
  cs301: {
    size: 42,
    curated: [
      ['Yasmine', 'Ait Ali', 96.2],
      ['Omar', 'Benjelloun', 72.4],
      ['Fatima Zahra', 'Idrissi', 94.6],
      ['Karim', 'Ouazzani', 89.3],
      ['Ines', 'Bouzid', 87.4],
      ['Rayan', 'El Khattabi', 90.1],
      ['Chloe', 'Bernard', 86.7],
      ['Ilyas', 'Amrani', 79.3],
      ['Sara', 'Cohen', 95.8],
      ['Mehdi', 'Alaoui', 83.2],
      ['Anais', 'Petit', 92.0],
      ['Yousef', 'Naciri', 77.5],
    ],
  },
  cs305: {
    size: 38,
    curated: [
      ['Sofia', 'Mansouri', 91.8],
      ['Lina', 'Haddad', 97.1],
      ['Emma', 'Laurent', 93.4],
      ['Elias', 'Fischer', 74.1],
      ['Hiba', 'Rachidi', 88.9],
      ['Nathan', 'Roy', 90.6],
      ['Aya', 'Kabbaj', 95.3],
    ],
  },
  cs410: {
    size: 31,
    curated: [
      ['Lucas', 'Moreau', 88.0],
      ['Noah', 'Dubois', 84.5],
      ['Aya', 'Benali', 99.0],
      ['Thomas', 'Nguyen', 91.3],
      ['Mariam', 'Sekkat', 93.7],
      ['Leo', 'Fontaine', 87.1],
    ],
  },
  cs220: {
    size: 45,
    curated: [
      ['Adam', 'Berrada', 61.2],
      ['Salma', 'El Amrani', 78.9],
      ['Mehdi', 'Tazi', 68.7],
      ['Malak', 'Sbai', 90.5],
      ['Jade', 'Rousseau', 86.4],
      ['Yassine', 'Kadiri', 82.6],
      ['Clara', 'Meyer', 94.2],
      ['Ayoub', 'Fassi', 76.8],
    ],
  },
  cs499: {
    size: 24,
    curated: [
      ['Ryan', 'Carter', 86.2],
      ['Nour', 'Cherkaoui', 92.7],
      ['Hugo', 'Martin', 82.0],
      ['Salma', 'Bennani', 95.4],
      ['Theo', 'Girard', 89.8],
    ],
  },
}

const firstNames = [
  'Sara', 'Adam', 'Nour', 'Youssef', 'Maya', 'Liam', 'Amina', 'Rania', 'Omar', 'Elena',
  'Zakaria', 'Julia', 'Hamza', 'Layla', 'Gabriel', 'Imane', 'Noah', 'Sofia', 'Ilyas', 'Mila',
  'Walid', 'Hana', 'Rayan', 'Camille', 'Ismail', 'Lina', 'Yanis', 'Aya', 'Samir', 'Emma',
  'Amine', 'Chloe', 'Mehdi', 'Leila', 'Nassim', 'Ines', 'Karim', 'Manon', 'Bilal', 'Sarah',
  'Rachid', 'Nadia', 'Tarik', 'Salima', 'Anas', 'Farah', 'Reda', 'Kenza', 'Adil', 'Sanaa',
  'Ilyass', 'Hajar', 'Mounir', 'Asmae', 'Yassir', 'Dounia', 'Achraf', 'Ghita', 'Soufiane', 'Nisrine',
]
const lastNames = [
  'Alaoui', 'Benali', 'El Fassi', 'Mansouri', 'Bennani', 'Tazi', 'Kadiri', 'Berrada', 'Idrissi', 'Naciri',
  'Bouzid', 'Cherkaoui', 'Amrani', 'Sbai', 'Rachidi', 'Sekkat', 'Kabbaj', 'Ouazzani', 'Benjelloun', 'El Khattabi',
  'Martin', 'Bernard', 'Dubois', 'Laurent', 'Moreau', 'Petit', 'Rousseau', 'Fontaine', 'Girard', 'Meyer',
  'Nguyen', 'Carter', 'Fischer', 'Cohen', 'Rossi', 'Silva', 'Sato', 'Okafor', 'Adeyemi', 'Petrova',
]
const programs = ['BSc Computer Science', 'BSc Software Engineering', 'BSc Information Systems', 'BSc Data Science']

function seeded(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function riskFor(rate) {
  if (rate < 60) return 'critical'
  if (rate < 75) return 'at_risk'
  if (rate < 85) return 'watch'
  return 'healthy'
}

function buildStudents() {
  const result = []
  let counter = 0

  for (const [classId, config] of Object.entries(classRosters)) {
    const cls = classes.find((c) => c.id === classId)
    const usedNames = new Set(config.curated.map(([f, l]) => `${f} ${l}`))
    const entries = config.curated.map(([first, last, rate]) => ({ first, last, rate }))

    let n = 0
    while (entries.length < config.size) {
      const first = firstNames[(counter * 7 + n * 3) % firstNames.length]
      const last = lastNames[(counter * 5 + n * 11) % lastNames.length]
      const name = `${first} ${last}`
      n += 1
      if (usedNames.has(name)) continue
      usedNames.add(name)
      const roll = seeded(counter * 31 + n * 7)
      const rate = Math.round((82 + roll * 16.5) * 10) / 10
      entries.push({ first, last, rate })
    }

    entries.forEach((entry, i) => {
      counter += 1
      const rate = entry.rate
      const absences = Math.min(cls.sessions, Math.max(0, Math.round(((100 - rate) / 100) * cls.sessions)))
      const late = Math.round(absences * 0.35)
      const lastSeenPool = ['Today, 09:12', 'Today, 08:58', 'Yesterday, 11:04', '2 days ago', '3 days ago', 'Last week']
      result.push({
        id: `st-${classId}-${String(i + 1).padStart(2, '0')}`,
        number: `NB-2024-${String(1000 + counter).slice(1)}`,
        firstName: entry.first,
        lastName: entry.last,
        name: `${entry.first} ${entry.last}`,
        email: `${entry.first.toLowerCase().replace(/\s+/g, '')}.${entry.last.toLowerCase().replace(/\s+/g, '')}@student.northbridge.edu`,
        classId,
        classCode: cls.code,
        className: cls.title,
        program: programs[counter % programs.length],
        year: 2 + (counter % 3),
        attendance: rate,
        absences,
        late,
        sessions: cls.sessions,
        risk: riskFor(rate),
        lastSeen: lastSeenPool[counter % lastSeenPool.length],
        phone: `+212 6 ${String(10 + (counter % 80)).padStart(2, '0')} ${String(10 + (counter % 70)).padStart(2, '0')} ${String(10 + (counter % 80)).padStart(2, '0')} ${String(10 + (counter % 90)).padStart(2, '0')}`,
        color: ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#DB2777', '#475569', '#0EA5E9', '#8B5CF6'][counter % 8],
      })
    })
  }
  return result
}

export const students = buildStudents()

export const atRiskStudents = students
  .filter((s) => s.risk === 'at_risk' || s.risk === 'critical')
  .sort((a, b) => a.attendance - b.attendance)

// ---------------------------------------------------------------------------
// Timetable
// ---------------------------------------------------------------------------
export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export const timetable = [
  { id: 'tt-1', classId: 'cs305', day: 'Mon', start: '11:00', end: '12:30', room: 'Lab C-112' },
  { id: 'tt-2', classId: 'cs220', day: 'Mon', start: '14:00', end: '15:30', room: 'Lab C-105' },
  { id: 'tt-3', classId: 'cs301', day: 'Tue', start: '09:00', end: '10:30', room: 'B-204' },
  { id: 'tt-4', classId: 'cs499', day: 'Tue', start: '16:00', end: '17:30', room: 'Studio D-201' },
  { id: 'tt-5', classId: 'cs305', day: 'Wed', start: '11:00', end: '12:30', room: 'Lab C-112' },
  { id: 'tt-6', classId: 'cs410', day: 'Wed', start: '14:00', end: '15:30', room: 'A-310' },
  { id: 'tt-7', classId: 'cs301', day: 'Thu', start: '09:00', end: '10:30', room: 'B-204' },
  { id: 'tt-8', classId: 'cs499', day: 'Thu', start: '16:00', end: '17:30', room: 'Studio D-201' },
  { id: 'tt-9', classId: 'cs220', day: 'Fri', start: '10:00', end: '11:30', room: 'Lab C-105' },
].map((entry) => {
  const cls = classes.find((c) => c.id === entry.classId)
  return { ...entry, code: cls.code, title: cls.title, color: cls.color, tint: cls.tint }
})

export const weekDates = [
  { day: 'Mon', date: 23 },
  { day: 'Tue', date: 24 },
  { day: 'Wed', date: 25 },
  { day: 'Thu', date: 26, today: true },
  { day: 'Fri', date: 27 },
]

// ---------------------------------------------------------------------------
// Today / live session
// ---------------------------------------------------------------------------
export const currentSession = {
  id: 'ses-cs301-18',
  classId: 'cs301',
  code: 'CS-301',
  title: 'Advanced Data Structures',
  date: 'Thursday, November 26',
  start: '09:00',
  end: '10:30',
  room: 'B-204',
  status: 'live',
  present: 31,
  late: 2,
  absent: 3,
  expected: 42,
  elapsed: '42 min',
  remaining: '48 min',
  qrToken: 'CT-8F2K-91QX',
  qrRotation: 20,
}

export const todaySchedule = [
  {
    id: 's1',
    time: '09:00',
    end: '10:30',
    code: 'CS-301',
    title: 'Advanced Data Structures',
    room: 'B-204',
    status: 'live',
    meta: '31 / 42 checked in',
  },
  {
    id: 's2',
    time: '13:00',
    end: '14:00',
    code: 'MEET',
    title: 'Department curriculum review',
    room: 'B-210',
    status: 'meeting',
    meta: 'Faculty meeting',
  },
  {
    id: 's3',
    time: '16:00',
    end: '17:30',
    code: 'CS-499',
    title: 'Capstone Project',
    room: 'Studio D-201',
    status: 'upcoming',
    meta: '24 students · QR enabled',
  },
]

export const sessionHistory = [
  { id: 'h1', date: 'Tue, Nov 24', time: '09:00 – 10:30', present: 38, late: 2, absent: 2, rate: 92.9, status: 'completed' },
  { id: 'h2', date: 'Thu, Nov 19', time: '09:00 – 10:30', present: 40, late: 1, absent: 1, rate: 96.4, status: 'completed' },
  { id: 'h3', date: 'Tue, Nov 17', time: '09:00 – 10:30', present: 37, late: 3, absent: 2, rate: 91.7, status: 'completed' },
  { id: 'h4', date: 'Thu, Nov 12', time: '09:00 – 10:30', present: 0, late: 0, absent: 0, rate: null, status: 'cancelled', note: 'Public holiday' },
  { id: 'h5', date: 'Tue, Nov 10', time: '09:00 – 10:30', present: 39, late: 2, absent: 1, rate: 95.2, status: 'completed' },
  { id: 'h6', date: 'Thu, Nov 5', time: '09:00 – 10:30', present: 36, late: 4, absent: 2, rate: 90.5, status: 'completed' },
  { id: 'h7', date: 'Tue, Nov 3', time: '09:00 – 10:30', present: 41, late: 1, absent: 0, rate: 98.8, status: 'completed' },
  { id: 'h8', date: 'Thu, Oct 29', time: '09:00 – 10:30', present: 0, late: 0, absent: 0, rate: null, status: 'rescheduled', note: 'Moved to Mon, Nov 2' },
]

export const checkinFeed = [
  { name: 'Sara Cohen', time: '09:41', late: false },
  { name: 'Yasmine Ait Ali', time: '09:38', late: false },
  { name: 'Rayan El Khattabi', time: '09:34', late: false },
  { name: 'Mehdi Alaoui', time: '09:22', late: true },
  { name: 'Anais Petit', time: '09:16', late: true },
  { name: 'Chloe Bernard', time: '09:12', late: true },
]

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------
export const teacherTrend = [
  { label: 'Oct 1', value: 88.2 },
  { label: 'Oct 8', value: 91.4 },
  { label: 'Oct 15', value: 89.6 },
  { label: 'Oct 22', value: 92.8 },
  { label: 'Oct 29', value: 90.1 },
  { label: 'Nov 5', value: 93.4 },
  { label: 'Nov 12', value: 91.7 },
  { label: 'Nov 19', value: 94.2 },
  { label: 'Nov 26', value: 92.4 },
]

export const adminTrend = [
  { label: 'Sep 7', value: 89.1 },
  { label: 'Sep 14', value: 90.4 },
  { label: 'Sep 21', value: 88.7 },
  { label: 'Sep 28', value: 91.2 },
  { label: 'Oct 5', value: 90.8 },
  { label: 'Oct 12', value: 92.1 },
  { label: 'Oct 19', value: 91.4 },
  { label: 'Oct 26', value: 90.2 },
  { label: 'Nov 2', value: 92.6 },
  { label: 'Nov 9', value: 93.1 },
  { label: 'Nov 16', value: 91.8 },
  { label: 'Nov 23', value: 92.3 },
]

export const teacherDistribution = [
  { label: 'Present', value: 86, color: '#2563EB' },
  { label: 'Late', value: 8, color: '#D97706' },
  { label: 'Absent', value: 5, color: '#DC2626' },
  { label: 'Excused', value: 1, color: '#7C3AED' },
]

export const adminDistribution = [
  { label: 'Present', value: 84, color: '#2563EB' },
  { label: 'Late', value: 7, color: '#D97706' },
  { label: 'Absent', value: 7, color: '#DC2626' },
  { label: 'Excused', value: 2, color: '#7C3AED' },
]

export const weeklyAttendance = [
  { label: 'Mon', present: 428, late: 31, absent: 26 },
  { label: 'Tue', present: 462, late: 24, absent: 18 },
  { label: 'Wed', present: 401, late: 38, absent: 31 },
  { label: 'Thu', present: 447, late: 27, absent: 22 },
  { label: 'Fri', present: 372, late: 42, absent: 39 },
]

export const classReports = [
  { classId: 'cs301', code: 'CS-301', title: 'Advanced Data Structures', students: 42, sessions: 18, present: 682, late: 31, absent: 25, rate: 92.4, trend: 2.1 },
  { classId: 'cs305', code: 'CS-305', title: 'Database Systems', students: 38, sessions: 18, present: 596, late: 28, absent: 60, rate: 88.1, trend: -1.4 },
  { classId: 'cs410', code: 'CS-410', title: 'Human-Computer Interaction', students: 31, sessions: 16, present: 482, late: 12, absent: 12, rate: 95.2, trend: 3.8 },
  { classId: 'cs220', code: 'CS-220', title: 'Web Engineering', students: 45, sessions: 17, present: 694, late: 39, absent: 85, rate: 84.7, trend: -2.7 },
  { classId: 'cs499', code: 'CS-499', title: 'Capstone Project', students: 24, sessions: 12, present: 264, late: 9, absent: 19, rate: 90.3, trend: 1.2 },
]

// ---------------------------------------------------------------------------
// Admin — teachers, departments, live sessions, alerts
// ---------------------------------------------------------------------------
export const departments = [
  { name: 'Computer Science', code: 'CS', rate: 92.4, students: 640, classes: 38, trend: 2.1, color: '#2563EB' },
  { name: 'Engineering', code: 'ENG', rate: 90.2, students: 512, classes: 31, trend: 1.4, color: '#0D9488' },
  { name: 'Mathematics', code: 'MTH', rate: 88.1, students: 386, classes: 24, trend: -0.6, color: '#7C3AED' },
  { name: 'Business', code: 'BUS', rate: 84.7, students: 448, classes: 27, trend: -2.3, color: '#D97706' },
  { name: 'Design', code: 'DSN', rate: 95.1, students: 196, classes: 12, trend: 3.2, color: '#DB2777' },
  { name: 'Medicine', code: 'MED', rate: 94.6, students: 236, classes: 10, trend: 0.8, color: '#16A34A' },
]

export const teachers = [
  { id: 't1', name: 'Amina El Fassi', initials: 'AE', email: 'amina.elfassi@northbridge.edu', department: 'Computer Science', title: 'Associate Professor', classes: 5, students: 180, rate: 92.4, lastActive: '2 min ago', status: 'active', color: '#2563EB' },
  { id: 't2', name: 'Daniel Okafor', initials: 'DO', email: 'daniel.okafor@northbridge.edu', department: 'Mathematics', title: 'Professor', classes: 4, students: 156, rate: 88.1, lastActive: '18 min ago', status: 'active', color: '#7C3AED' },
  { id: 't3', name: 'Claire Dubois', initials: 'CD', email: 'claire.dubois@northbridge.edu', department: 'Business', title: 'Senior Lecturer', classes: 6, students: 214, rate: 84.7, lastActive: '1 hour ago', status: 'active', color: '#D97706' },
  { id: 't4', name: 'Youssef Benali', initials: 'YB', email: 'youssef.benali@northbridge.edu', department: 'Engineering', title: 'Associate Professor', classes: 5, students: 168, rate: 90.2, lastActive: '24 min ago', status: 'active', color: '#0D9488' },
  { id: 't5', name: 'Hana Sato', initials: 'HS', email: 'hana.sato@northbridge.edu', department: 'Design', title: 'Assistant Professor', classes: 3, students: 96, rate: 95.1, lastActive: '8 min ago', status: 'active', color: '#DB2777' },
  { id: 't6', name: 'Marcus Reed', initials: 'MR', email: 'marcus.reed@northbridge.edu', department: 'Computer Science', title: 'Lecturer', classes: 4, students: 142, rate: 76.3, lastActive: 'Yesterday', status: 'watch', color: '#475569' },
  { id: 't7', name: 'Leila Mansour', initials: 'LM', email: 'leila.mansour@northbridge.edu', department: 'Mathematics', title: 'Senior Lecturer', classes: 5, students: 172, rate: 89.6, lastActive: '42 min ago', status: 'active', color: '#8B5CF6' },
  { id: 't8', name: 'Tomas Silva', initials: 'TS', email: 'tomas.silva@northbridge.edu', department: 'Business', title: 'Associate Professor', classes: 3, students: 118, rate: 81.4, lastActive: '3 hours ago', status: 'active', color: '#0EA5E9' },
  { id: 't9', name: 'Nina Petrova', initials: 'NP', email: 'nina.petrova@northbridge.edu', department: 'Engineering', title: 'Professor', classes: 4, students: 131, rate: 68.9, lastActive: '5 days ago', status: 'leave', color: '#64748B' },
  { id: 't10', name: 'Samuel Adeyemi', initials: 'SA', email: 'samuel.adeyemi@northbridge.edu', department: 'Computer Science', title: 'Assistant Professor', classes: 4, students: 149, rate: 93.8, lastActive: '11 min ago', status: 'active', color: '#16A34A' },
]

export const liveSessions = [
  { id: 'ls1', code: 'CS-301', title: 'Advanced Data Structures', teacher: 'Amina El Fassi', initials: 'AE', time: '09:00 – 10:30', room: 'B-204', checked: 33, expected: 42, qr: true, department: 'Computer Science' },
  { id: 'ls2', code: 'MTH-204', title: 'Linear Algebra II', teacher: 'Leila Mansour', initials: 'LM', time: '09:00 – 10:30', room: 'A-118', checked: 46, expected: 58, qr: true, department: 'Mathematics' },
  { id: 'ls3', code: 'ENG-320', title: 'Thermodynamics', teacher: 'Youssef Benali', initials: 'YB', time: '09:30 – 11:00', room: 'Lab E-04', checked: 29, expected: 36, qr: true, department: 'Engineering' },
  { id: 'ls4', code: 'BUS-110', title: 'Principles of Marketing', teacher: 'Claire Dubois', initials: 'CD', time: '09:00 – 10:00', room: 'C-220', checked: 61, expected: 74, qr: false, department: 'Business' },
  { id: 'ls5', code: 'DSN-201', title: 'Interaction Design Studio', teacher: 'Hana Sato', initials: 'HS', time: '10:00 – 12:00', room: 'Studio D-105', checked: 22, expected: 24, qr: true, department: 'Design' },
  { id: 'ls6', code: 'MED-140', title: 'Human Anatomy', teacher: 'Nina Petrova', initials: 'NP', time: '08:30 – 10:00', room: 'Lecture Hall M-1', checked: 88, expected: 96, qr: true, department: 'Medicine' },
]

export const alerts = [
  { id: 'a1', severity: 'high', title: 'CS-220 attendance below threshold', text: '3 consecutive sessions under 80%. Teacher: Dr. Amina El Fassi.', time: '12 min ago' },
  { id: 'a2', severity: 'high', title: 'QR check-in anomaly detected', text: '14 check-ins from the same IP range in CS-305 · Lab C-112.', time: '38 min ago' },
  { id: 'a3', severity: 'medium', title: 'Attendance not submitted', text: '2 teachers have unsubmitted sessions from yesterday.', time: '1 hour ago' },
  { id: 'a4', severity: 'medium', title: 'Room clash detected', text: 'Room B-204 is double-booked on Friday at 10:00.', time: '2 hours ago' },
  { id: 'a5', severity: 'low', title: 'Weekly report ready', text: 'Institution attendance report for week 47 is available.', time: '4 hours ago' },
]

export const notifications = [
  { id: 'n1', type: 'session', title: 'CS-499 starts at 16:00', text: 'Capstone Project · Studio D-201 · 24 students expected.', time: '25 min ago', unread: true },
  { id: 'n2', type: 'attendance', title: 'Omar Benjelloun is at risk', text: 'Attendance dropped to 72.4% after 3 consecutive absences.', time: '1 hour ago', unread: true },
  { id: 'n3', type: 'import', title: 'Timetable import completed', text: '11 sessions extracted from timetable-fall-2026.png. Review required.', time: '3 hours ago', unread: true },
  { id: 'n4', type: 'system', title: 'New student enrolled', text: 'Nour Cherkaoui was added to CS-499 Capstone Project.', time: 'Yesterday', unread: false },
  { id: 'n5', type: 'report', title: 'Weekly report is ready', text: 'Your class attendance summary for week 47 can be downloaded.', time: 'Yesterday', unread: false },
]

export const heatmap = {
  slots: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  values: [
    [91, 94, 89, 93, 87],
    [95, 96, 92, 94, 90],
    [84, 86, 81, 85, 79],
    [88, 91, 86, 90, 83],
    [82, 85, 78, 84, 76],
    [71, 74, 68, 72, 66],
  ],
}

export const teacherLeaderboard = [...teachers]
  .filter((t) => t.status === 'active')
  .sort((a, b) => b.rate - a.rate)
  .slice(0, 5)

export const teacherClasses = classes.filter((c) => c.status === 'active')

export const classById = (id) => classes.find((c) => c.id === id)
export const studentsByClass = (id) => students.filter((s) => s.classId === id)

export const kpis = {
  teacherStudents: 180,
  teacherAvg: 92.4,
  sessionsWeek: 9,
  atRisk: atRiskStudents.length,
  adminStudents: 2418,
  adminTeachers: 84,
  adminClasses: 142,
  adminRate: 91.8,
  liveNow: 18,
  checkinsToday: 1204,
}
