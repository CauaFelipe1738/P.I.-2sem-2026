const PRESENT_STATUSES = new Set(['Presente', 'Atraso'])
const ABSENCE_STATUSES = new Set(['Ausente', 'Falta justificada'])

export function filterStudentAttendance(rows, { year, semester, subject = '' }) {
  return rows.filter((row) => {
    if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return false
    const [recordYear, month] = row.date.split('-').map(Number)
    const recordSemester = month <= 6 ? '1' : '2'
    return recordYear === Number(year) && recordSemester === String(semester) && (!subject || row.subject === subject)
  })
}

export function summarizeStudentAttendance(rows) {
  const presences = rows.filter((row) => PRESENT_STATUSES.has(row.status)).length
  const absences = rows.filter((row) => ABSENCE_STATUSES.has(row.status)).length
  return {
    records: rows.length,
    lessons: new Set(rows.map((row) => row.sessionId)).size,
    presences,
    absences,
    justified: rows.filter((row) => row.status === 'Falta justificada').length,
    attendanceRate: rows.length ? Math.round(100 * presences / rows.length) : null,
  }
}

export function isPresent(row) {
  return PRESENT_STATUSES.has(row.status)
}

export function isAbsence(row) {
  return ABSENCE_STATUSES.has(row.status)
}
