import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'edulytics.registros-academicos.v1'
const listeners = new Set()

function read() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"attendance":[],"learning":[]}') }
  catch { return { attendance: [], learning: [] } }
}

let state = typeof localStorage === 'undefined' ? { attendance: [], learning: [] } : read()
const notify = () => listeners.forEach((listener) => listener())

export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function getSnapshot() { return state }
export function useAcademicData() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) }
export function saveAcademicData(next) {
  state = next
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* Storage may be disabled by browser policy. */ }
  notify()
}
export function addAttendance(session) { saveAcademicData({ ...state, attendance: [session, ...state.attendance] }) }
export function updateAttendance(id, updates) { saveAcademicData({ ...state, attendance: state.attendance.map((row) => row.id === id ? { ...row, ...updates, history: [...(row.history || []), { at: new Date().toISOString(), previous: row.students }], updatedAt: new Date().toISOString() } : row) }) }
export function addLearning(record) { saveAcademicData({ ...state, learning: [record, ...state.learning] }) }
export function updateLearning(id, updates) { saveAcademicData({ ...state, learning: state.learning.map((row) => row.id === id ? { ...row, ...updates, history: [...(row.history || []), { at: new Date().toISOString(), previous: row }], updatedAt: new Date().toISOString() } : row) }) }

export const turmas = ['Turma A', 'Turma B']
export const disciplinas = ['Desenvolvimento Web', 'Lógica de Programação', 'Banco de Dados']
export const checklistAprendizagem = ['Compreendeu o conteúdo', 'Realizou atividades sozinho', 'Necessitou de auxílio', 'Demonstrou evolução', 'Participou das atividades', 'Apresentou dificuldade', 'Desenvolveu habilidade esperada']
export const checklistAula = ['Participou da aula', 'Realizou as atividades propostas', 'Participou em grupo', 'Apresentou dificuldade', 'Necessitou de acompanhamento', 'Entregou atividade solicitada']

export function optionsForCourse(courseName, students) {
  const courseStudents = students.filter((student) => student.curso === courseName)
  return { students: courseStudents, classes: turmas, subjects: disciplinas }
}
