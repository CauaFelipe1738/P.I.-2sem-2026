import { useSyncExternalStore } from 'react'
import { alunos, cursos } from './dadosAcademicos.js'

const STORAGE_KEY = 'edulytics.cursos.v1'
const NEXT_ID_KEY = 'edulytics.cursos.next-id.v1'
const listeners = new Set()

function defaultCatalog() {
  return cursos.map((course) => normalizeCourse({
    ...course,
    cargaHoraria: course.cargaHoraria ?? Number.parseFloat(course.carga),
    studentIds: alunos.filter((student) => student.curso === course.nome).map((student) => student.id),
  }))
}

function normalizeCourse(course) {
  const cargaHoraria = Number(course.cargaHoraria ?? Number.parseFloat(course.carga))
  const studentIds = [...new Set((Array.isArray(course.studentIds) ? course.studentIds : []).map(String))]

  return {
    ...course,
    id: Number(course.id),
    nome: String(course.nome || '').trim(),
    descricao: String(course.descricao || '').trim(),
    cargaHoraria,
    carga: `${cargaHoraria}h`,
    studentIds,
    alunos: studentIds.length,
    status: course.status || 'Em andamento',
    professor: course.professor || '',
  }
}

export function normalizeCourseCatalog(value) {
  let parsed = value
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value) } catch { return defaultCatalog() }
  }
  if (!Array.isArray(parsed)) return defaultCatalog()

  const seenIds = new Set()
  const normalized = parsed
    .filter((course) => course && Number.isSafeInteger(Number(course.id)) && String(course.nome || '').trim())
    .map(normalizeCourse)
    .filter((course) => {
      if (seenIds.has(course.id)) return false
      seenIds.add(course.id)
      return Number.isFinite(course.cargaHoraria) && course.cargaHoraria > 0
    })

  return parsed.length > 0 && normalized.length === 0 ? defaultCatalog() : normalized
}

export function getStudentsForCourse(course, students = alunos) {
  if (!course) return []
  const ids = Array.isArray(course.studentIds)
    ? new Set(course.studentIds.map(String))
    : new Set(students.filter((student) => student.curso === course.nome).map((student) => String(student.id)))

  return students
    .filter((student) => ids.has(String(student.id)))
    .map((student) => ({ ...student, cursoOrigem: student.curso, curso: course.nome }))
}

export function getAvailableStudents(selectedIds = [], students = alunos) {
  const selected = new Set(selectedIds.map(String))
  return students.filter((student) => !selected.has(String(student.id)))
}

export function validateCourseDraft(draft, courses, students = alunos, editingId = null) {
  const name = String(draft.nome || '').trim()
  const hours = Number(draft.cargaHoraria)
  const studentIds = Array.isArray(draft.studentIds) ? draft.studentIds.map(String) : []

  if (!name) return 'Informe o nome do curso.'
  if (!Number.isFinite(hours) || hours <= 0) return 'Informe uma carga horária numérica maior que zero.'
  const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  if (courses.some((course) => course.id !== editingId && course.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR') === normalizedName)) return 'Já existe um curso com esse nome.'
  if (new Set(studentIds).size !== studentIds.length) return 'Remova alunos duplicados da seleção.'

  const selectedStudents = students.filter((student) => studentIds.includes(String(student.id)))
  if (selectedStudents.length !== studentIds.length) return 'A seleção contém um aluno que não está mais disponível.'
  return ''
}

export function buildCourseRecord(draft, id, existingCourse = null) {
  const cargaHoraria = Number(draft.cargaHoraria)
  const studentIds = [...new Set((draft.studentIds || []).map(String))]
  return normalizeCourse({
    ...existingCourse,
    id,
    nome: String(draft.nome || '').trim(),
    descricao: String(draft.descricao || '').trim(),
    cargaHoraria,
    carga: `${cargaHoraria}h`,
    status: existingCourse?.status || 'Em andamento',
    professor: existingCourse?.professor || '',
    studentIds,
  })
}

function readCatalog() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? defaultCatalog() : normalizeCourseCatalog(stored)
  } catch {
    return defaultCatalog()
  }
}

let catalog = typeof localStorage === 'undefined' ? defaultCatalog() : readCatalog()
let nextId = Math.max(
  ...catalog.map((course) => course.id + 1),
  ...cursos.map((course) => course.id + 1),
  1,
)

try {
  nextId = Math.max(nextId, Number(localStorage.getItem(NEXT_ID_KEY)) || 1)
} catch { /* A sequência também funciona em memória quando o storage está bloqueado. */ }

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== NEXT_ID_KEY && event.key !== null) return
    catalog = event.key === null ? defaultCatalog() : event.key === STORAGE_KEY ? normalizeCourseCatalog(event.newValue) : readCatalog()
    nextId = Math.max(nextId, ...catalog.map((course) => course.id + 1), 1)
    try { nextId = Math.max(nextId, Number(localStorage.getItem(NEXT_ID_KEY)) || 1) } catch { /* Mantém a sequência em memória. */ }
    notifyListeners()
  })
}

export function useCourseCatalog() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, () => catalog, () => catalog)
}

export function allocateCourseId() {
  const id = nextId
  nextId += 1
  try { localStorage.setItem(NEXT_ID_KEY, String(nextId)) } catch { /* A criação continua possível nesta sessão. */ }
  return id
}

export function saveCourseCatalog(nextCatalog) {
  catalog = normalizeCourseCatalog(nextCatalog)
  nextId = Math.max(nextId, ...catalog.map((course) => course.id + 1), 1)
  let persisted = true

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
  } catch {
    persisted = false
  }
  try { localStorage.setItem(NEXT_ID_KEY, String(nextId)) } catch { /* O próximo ID pode ser recomposto do catálogo salvo. */ }

  notifyListeners()
  return persisted
}
