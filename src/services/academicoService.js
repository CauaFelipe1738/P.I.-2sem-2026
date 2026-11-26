import { request } from './apiClient.js'

export function listCursos(query, signal) {
  return request('/cursos', { query, signal })
}

export function listPeriodos(signal) {
  return request('/periodos', { signal })
}

export function listTurmasByCurso(cursoId, query, signal) {
  return request(`/cursos/${cursoId}/turmas`, { query, signal })
}

export function listDisciplinasByTurma(turmaId, signal) {
  return request(`/turmas/${turmaId}/disciplinas`, { signal })
}

export function listAlunosByTurma(turmaId, query, signal) {
  return request(`/turmas/${turmaId}/alunos`, { query, signal })
}

export function listAlunos(query, signal) {
  return request('/alunos', { query, signal })
}
