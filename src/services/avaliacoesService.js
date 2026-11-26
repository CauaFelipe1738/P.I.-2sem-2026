import { request } from './apiClient.js'

export function listAvaliacoes(query, signal) {
  return request('/avaliacoes', { query, signal })
}

export function createAvaliacao(body) {
  return request('/avaliacoes', { method: 'POST', body })
}

export function updateAvaliacao(id, body) {
  return request(`/avaliacoes/${id}`, { method: 'PUT', body })
}

export function corrigirAvaliacao(id) {
  return request(`/avaliacoes/${id}/corrigir`, { method: 'PATCH' })
}

export function listNotasByAvaliacao(avaliacaoId, signal) {
  return request(`/avaliacoes/${avaliacaoId}/notas`, { signal })
}

export function upsertNotaAluno(avaliacaoId, alunoId, body) {
  return request(`/avaliacoes/${avaliacaoId}/notas/${alunoId}`, {
    method: 'PUT',
    body,
  })
}
