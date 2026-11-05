import { useSyncExternalStore } from 'react'

// Persistência de protótipo limitada ao navegador atual, sem sincronização entre usuários.
const STORAGE_KEY = 'edulytics.registros-academicos.v1'
const listeners = new Set()
const emptyData = () => ({ attendance: [], learning: [] })

// Dados inválidos ou storage bloqueado resultam em um estado vazio seguro.
export function normalizeAcademicData(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyData()
    return {
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      learning: Array.isArray(parsed.learning) ? parsed.learning : [],
    }
  } catch { return emptyData() }
}

function read() {
  try { return normalizeAcademicData(localStorage.getItem(STORAGE_KEY)) }
  catch { return emptyData() }
}

let state = typeof localStorage === 'undefined' ? emptyData() : read()
const notify = () => listeners.forEach((listener) => listener())

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    state = event.key === null ? emptyData() : normalizeAcademicData(event.newValue)
    notify()
  })
}

export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function getSnapshot() { return state }
export function useAcademicData() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) }
// Todas as áreas escrevem pela mesma função para manter os módulos sincronizados.
export function saveAcademicData(next) {
  state = normalizeAcademicData(next)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* Storage may be disabled by browser policy. */ }
  notify()
}
export function addAttendance(session) { saveAcademicData({ ...state, attendance: [session, ...state.attendance] }) }
// Ao corrigir uma chamada, guarda a lista anterior para manter um histórico local da alteração.
export function updateAttendance(id, updates) { saveAcademicData({ ...state, attendance: state.attendance.map((row) => row.id === id ? { ...row, ...updates, history: [...(row.history || []), { at: new Date().toISOString(), previous: row.students }], updatedAt: new Date().toISOString() } : row) }) }
export function addLearning(record) { saveAcademicData({ ...state, learning: [record, ...state.learning] }) }
// Alterações pedagógicas preservam a versão anterior completa no histórico local.
export function updateLearning(id, updates) { saveAcademicData({ ...state, learning: state.learning.map((row) => row.id === id ? { ...row, ...updates, history: [...(row.history || []), { at: new Date().toISOString(), previous: row }], updatedAt: new Date().toISOString() } : row) }) }

// Checklists definem os valores canônicos usados por formulários e indicadores.
export const checklistAprendizagem = ['Compreendeu o conteúdo', 'Realizou atividades sozinho', 'Necessitou de auxílio', 'Demonstrou evolução', 'Participou das atividades', 'Apresentou dificuldade', 'Desenvolveu habilidade esperada']
export const checklistAula = ['Participou da aula', 'Realizou as atividades propostas', 'Participou em grupo', 'Apresentou dificuldade', 'Necessitou de acompanhamento', 'Entregou atividade solicitada']

export function optionsForCourse(courseName, students) {
  return students.filter((student) => student.curso === courseName)
}
