import assert from 'node:assert/strict'
import { normalizeAcademicData } from './academicoStore.js'
import { deriveAcademicAlerts } from './academicInsights.js'

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
console.log('4 verificações de normalização e 3 verificações de alertas concluídas.')
