import { useSyncExternalStore } from 'react'

// O armazenamento local mantém o protótipo funcional sem pressupor uma API institucional.
const STORAGE_KEY = 'edulytics.registros-academicos.v1'
const listeners = new Set()

function createEmptyData() {
  return { attendance: [], learning: [] }
}

/**
 * Normaliza os dados carregados antes de disponibilizá-los aos componentes.
 * A validação por seção evita que JSON válido, mas incompleto, quebre as telas.
 */
export function normalizeAcademicData(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return createEmptyData()
    }

    return {
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      learning: Array.isArray(parsed.learning) ? parsed.learning : [],
    }
  } catch {
    return createEmptyData()
  }
}

function readStoredData() {
  try {
    return normalizeAcademicData(localStorage.getItem(STORAGE_KEY))
  } catch {
    // O protótipo continua abrindo mesmo quando o navegador bloqueia o storage.
    return createEmptyData()
  }
}

let state = typeof localStorage === 'undefined' ? createEmptyData() : readStoredData()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  // O evento storage é emitido nas outras abas, permitindo manter a leitura sincronizada.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return

    state = event.key === null ? createEmptyData() : normalizeAcademicData(event.newValue)
    notifyListeners()
  })
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return state
}

export function useAcademicData() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Atualiza o snapshot em memória e persiste a mesma estrutura para todas as áreas. */
export function saveAcademicData(next) {
  state = normalizeAcademicData(next)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // A atualização em memória ainda funciona quando a persistência está indisponível.
  }

  notifyListeners()
}

export function addAttendance(session) {
  saveAcademicData({ ...state, attendance: [session, ...state.attendance] })
}

/** Mantém uma cópia dos alunos anteriores para registrar alterações locais da chamada. */
export function updateAttendance(id, updates) {
  saveAcademicData({
    ...state,
    attendance: state.attendance.map((row) =>
      row.id === id
        ? {
            ...row,
            ...updates,
            history: [
              ...(row.history || []),
              { at: new Date().toISOString(), previous: row.students },
            ],
            updatedAt: new Date().toISOString(),
          }
        : row,
    ),
  })
}

export function addLearning(record) {
  saveAcademicData({ ...state, learning: [record, ...state.learning] })
}

/** Preserva a versão anterior do registro para manter o histórico de edição local. */
export function updateLearning(id, updates) {
  saveAcademicData({
    ...state,
    learning: state.learning.map((row) =>
      row.id === id
        ? {
            ...row,
            ...updates,
            history: [...(row.history || []), { at: new Date().toISOString(), previous: row }],
            updatedAt: new Date().toISOString(),
          }
        : row,
    ),
  })
}

// Valores canônicos compartilhados pelas listas de seleção e formulários acadêmicos.
export const checklistAprendizagem = [
  'Compreendeu o conteúdo',
  'Realizou atividades sozinho',
  'Necessitou de auxílio',
  'Demonstrou evolução',
  'Participou das atividades',
  'Apresentou dificuldade',
  'Desenvolveu habilidade esperada',
]

export const checklistAula = [
  'Participou da aula',
  'Realizou as atividades propostas',
  'Participou em grupo',
  'Apresentou dificuldade',
  'Necessitou de acompanhamento',
  'Entregou atividade solicitada',
]

/** Evita oferecer em cada formulário alunos vinculados a outros cursos do catálogo. */
export function optionsForCourse(courseName, students) {
  return students.filter((student) => student.curso === courseName)
}
