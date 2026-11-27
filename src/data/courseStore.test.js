import assert from 'node:assert/strict'
import { alunos } from './dadosAcademicos.js'

const stored = new Map()
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, String(value)),
}

const {
  allocateCourseId,
  buildCourseRecord,
  getAvailableStudents,
  getStudentsForCourse,
  normalizeCourseCatalog,
  saveCourseCatalog,
  validateCourseDraft,
} = await import('./courseStore.js')

const courses = normalizeCourseCatalog()
const existingCourse = courses.find((course) => course.nome === 'Desenvolvimento Web')
assert.ok(existingCourse)
assert.equal(existingCourse.studentIds.length, existingCourse.alunos)
assert.equal(getStudentsForCourse(existingCourse, alunos).length, existingCourse.alunos)
assert.equal(getStudentsForCourse({ id: 100, nome: 'Curso sem alunos', studentIds: [] }, alunos).length, 0)

const available = getAvailableStudents([], alunos)
assert.equal(available.length, alunos.length)
assert.equal(getAvailableStudents([alunos[0].id], alunos).some((student) => student.id === alunos[0].id), false)

const validDraft = { nome: 'Curso Novo', descricao: '', cargaHoraria: '12', studentIds: [alunos[0].id] }
assert.equal(validateCourseDraft(validDraft, courses, alunos), '')
assert.match(validateCourseDraft({ ...validDraft, nome: ' ' }, courses, alunos), /nome/i)
assert.match(validateCourseDraft({ ...validDraft, cargaHoraria: '0' }, courses, alunos), /carga horária/i)
assert.match(validateCourseDraft({ ...validDraft, nome: 'desenvolvimento web' }, courses, alunos), /já existe/i)
assert.equal(validateCourseDraft({ ...validDraft, studentIds: [alunos[0].id, alunos[12].id] }, courses, alunos), '')
assert.match(validateCourseDraft({ ...validDraft, studentIds: [alunos[0].id, alunos[0].id] }, courses, alunos), /alunos duplicados/i)

const created = buildCourseRecord({ ...validDraft, cargaHoraria: '12.5', studentIds: [alunos[0].id, alunos[0].id] }, 100)
assert.deepEqual({ id: created.id, nome: created.nome, cargaHoraria: created.cargaHoraria, carga: created.carga, alunos: created.alunos }, {
  id: 100,
  nome: 'Curso Novo',
  cargaHoraria: 12.5,
  carga: '12.5h',
  alunos: 1,
})

const normalized = normalizeCourseCatalog([{ id: 101, nome: 'Curso Normalizado', cargaHoraria: 20, studentIds: ['aluno-1', 'aluno-1'] }])
assert.deepEqual(normalized[0].studentIds, ['aluno-1'])
assert.equal(normalized[0].alunos, 1)

const newId = allocateCourseId()
const createdCourse = buildCourseRecord(validDraft, newId)
assert.equal(saveCourseCatalog([...courses, createdCourse]), true)
const persistedAfterCreate = JSON.parse(stored.get('edulytics.cursos.v1'))
assert.ok(persistedAfterCreate.some((course) => course.id === newId))

const editedCourse = buildCourseRecord({ ...validDraft, nome: 'Curso Atualizado', cargaHoraria: '18' }, newId, createdCourse)
assert.equal(saveCourseCatalog(persistedAfterCreate.map((course) => course.id === newId ? editedCourse : course)), true)
const persistedAfterEdit = JSON.parse(stored.get('edulytics.cursos.v1'))
assert.equal(persistedAfterEdit.find((course) => course.id === newId).nome, 'Curso Atualizado')

assert.equal(saveCourseCatalog(persistedAfterEdit.filter((course) => course.id !== newId)), true)
assert.equal(JSON.parse(stored.get('edulytics.cursos.v1')).some((course) => course.id === newId), false)
assert.equal(alunos.some((student) => student.id === validDraft.studentIds[0]), true)

console.log('Verificações de catálogo, vínculos, validação, persistência, edição e exclusão de cursos concluídas.')
