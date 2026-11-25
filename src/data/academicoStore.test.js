import assert from 'node:assert/strict'
import { normalizeAcademicData } from './academicoStore.js'
import { deriveAcademicAlerts } from './academicInsights.js'
import { filterStudentAttendance, summarizeStudentAttendance } from './studentInsights.js'

assert.deepEqual(normalizeAcademicData('{'), { attendance: [], learning: [] })
assert.deepEqual(normalizeAcademicData('null'), { attendance: [], learning: [] })
assert.deepEqual(normalizeAcademicData({ attendance: {}, learning: null }), { attendance: [], learning: [] })

const attendance = [{ id: 'a1' }]
assert.deepEqual(normalizeAcademicData({ attendance, learning: false }), { attendance, learning: [] })

const student = { id: '0-0', nome: 'Lucas Almeida', curso: 'Desenvolvimento Web' }
const attendanceRows = [
  { studentId: student.id, status: 'Presente', date: '2026-10-01' },
  { studentId: student.id, status: 'Ausente', date: '2026-10-08' },
]
const learningRows = [
  { id: 'l1', studentId: student.id, category: 'Dificuldade', date: '2026-10-02' },
  { id: 'l2', studentId: student.id, category: 'Dificuldade', date: '2026-10-09' },
  { id: 'l3', studentId: student.id, category: 'Plano de acompanhamento', date: '2026-10-09', plan: { goal: 'Revisar os exercícios', status: 'Pendente' } },
]
const alerts = deriveAcademicAlerts([student], attendanceRows, learningRows)
assert.deepEqual(alerts.map((alert) => alert.priority), ['Alta', 'Média', 'Baixa'])
assert.match(alerts[0].message, /50%/)
assert.equal(deriveAcademicAlerts([student], attendanceRows.slice(0, 1), []).length, 0)

const studentAttendance = [
  { date: '2026-02-10', subject: 'Matemática', status: 'Presente', sessionId: 's1' },
  { date: '2026-05-10', subject: 'Matemática', status: 'Falta justificada', sessionId: 's2' },
  { date: '2026-08-10', subject: 'Matemática', status: 'Ausente', sessionId: 's3' },
  { date: '2025-11-10', subject: 'História', status: 'Atraso', sessionId: 's4' },
]
assert.equal(filterStudentAttendance(studentAttendance, { year: 2026, semester: '1' }).length, 2)
assert.equal(filterStudentAttendance(studentAttendance, { year: 2026, semester: '1', subject: 'Matemática' }).length, 2)
assert.deepEqual(summarizeStudentAttendance(studentAttendance.slice(0, 2)), { records: 2, lessons: 2, presences: 1, absences: 1, justified: 1, attendanceRate: 50 })
assert.equal(summarizeStudentAttendance([]).attendanceRate, null)
console.log('4 verificações de normalização, 3 de alertas e 4 de filtros/frequência do aluno concluídas.')
