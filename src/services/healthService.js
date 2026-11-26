import { getApiBaseUrl, getApiMode, requestRoot } from './apiClient.js'

/**
 * Consulta a saúde da API configurada (modo HTTP real via /actuator/health ou modo mock).
 */
export async function checkApiHealth({ signal } = {}) {
  const mode = getApiMode()
  const baseUrl = getApiBaseUrl()

  if (mode === 'mock') {
    return {
      status: 'UP',
      mode: 'mock',
      baseUrl: 'mock://api/v1',
      latencyMs: 1,
      service: 'edulytics-mock-api',
    }
  }

  const start = Date.now()
  try {
    const data = await requestRoot('/actuator/health', { signal, timeoutMs: 4000 })
    return {
      status: String(data?.status || 'UP').toUpperCase(),
      mode: 'http',
      baseUrl: baseUrl || 'same-origin',
      latencyMs: Math.max(1, Date.now() - start),
      details: data || null,
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    return {
      status: 'DOWN',
      mode: 'http',
      baseUrl: baseUrl || 'same-origin',
      latencyMs: Math.max(1, Date.now() - start),
      error: err?.detail || err?.message || 'API indisponível',
    }
  }
}
