import { request } from './apiClient.js'

export function getIndicadoresDesempenho(query, signal) {
  return request('/indicadores/desempenho', { query, signal })
}

export function getAnalyticsAvancado(query, signal) {
  return request('/indicadores/analytics', { query, signal })
}

export function getRelatorioAcademico(query, signal) {
  return request('/relatorios/academico', { query, signal })
}

export function getMeuDesempenho(query, signal) {
  return request('/me/desempenho', { query, signal })
}
