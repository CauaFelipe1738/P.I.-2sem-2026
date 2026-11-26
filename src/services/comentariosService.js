import { request } from './apiClient.js'

export function listComentarios(query, signal) {
  return request('/comentarios', { query, signal })
}

export function createComentario(body) {
  return request('/comentarios', { method: 'POST', body })
}

export function updateComentario(id, body) {
  return request(`/comentarios/${id}`, { method: 'PUT', body })
}

export function listPlanos(query, signal) {
  return request('/planos-acompanhamento', { query, signal })
}

export function createPlano(body) {
  return request('/planos-acompanhamento', { method: 'POST', body })
}

export function updatePlano(id, body) {
  return request(`/planos-acompanhamento/${id}`, { method: 'PUT', body })
}
