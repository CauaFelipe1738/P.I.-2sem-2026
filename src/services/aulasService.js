import { request } from './apiClient.js'

export function listAulas(query, signal) {
  return request('/aulas', { query, signal })
}

export function createAula(body) {
  return request('/aulas', { method: 'POST', body })
}

export function updateAula(id, body) {
  return request(`/aulas/${id}`, { method: 'PUT', body })
}

export function realizarAula(id, conteudo) {
  return request(`/aulas/${id}/realizar`, { method: 'PATCH', body: { conteudo } })
}

export function cancelarAula(id) {
  return request(`/aulas/${id}/cancelar`, { method: 'PATCH' })
}

export function listFrequenciasByAula(aulaId, signal) {
  return request(`/aulas/${aulaId}/frequencias`, { signal })
}

export function saveFrequenciasEmLote(aulaId, itens) {
  return request(`/aulas/${aulaId}/frequencias`, {
    method: 'POST',
    body: { itens },
  })
}

export function updateFrequencia(id, body) {
  return request(`/frequencias/${id}`, { method: 'PUT', body })
}
