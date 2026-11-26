import { handleMockRequest } from './mockApiServer.js'

const TOKEN_KEY = 'edulytics.access-token'
const TRANSPORT_KEY = 'edulytics.transport-override'

let memoryToken = null
let runtimeTransportOverride = null

export class ApiError extends Error {
  constructor({
    status = 500,
    title = 'Erro na requisição',
    detail = 'Não foi possível concluir a operação.',
    errors = null,
    type = 'about:blank',
    instance = '',
  }) {
    super(detail || title)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.detail = detail
    this.errors = errors
    this.type = type
    this.instance = instance
  }
}

function readEnv() {
  try {
    return import.meta.env || {}
  } catch {
    return {}
  }
}

export function getApiBaseUrl() {
  const env = readEnv()
  const raw = env.VITE_API_URL || globalThis.process?.env?.VITE_API_URL || ''
  return String(raw).replace(/\/+$/, '')
}

export function getApiMode() {
  if (runtimeTransportOverride === 'http' || runtimeTransportOverride === 'mock') {
    return runtimeTransportOverride
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(TRANSPORT_KEY)
      if (stored === 'http' || stored === 'mock') return stored
    }
  } catch {
    // Ignora indisponibilidade de sessionStorage
  }

  const env = readEnv()
  const modeEnv = env.VITE_API_MODE || globalThis.process?.env?.VITE_API_MODE
  if (modeEnv === 'mock') return 'mock'
  if (modeEnv === 'http' && getApiBaseUrl()) return 'http'
  if (getApiBaseUrl()) return 'http'
  return 'mock'
}

export function setRuntimeTransport(mode) {
  runtimeTransportOverride = mode || null
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (mode) sessionStorage.setItem(TRANSPORT_KEY, mode)
      else sessionStorage.removeItem(TRANSPORT_KEY)
    }
  } catch {
    // Ignora indisponibilidade de sessionStorage
  }
}

export function getStoredToken() {
  if (memoryToken) return memoryToken
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY)
    }
  } catch {
    // Ignora indisponibilidade de sessionStorage
  }
  return null
}

export function setStoredToken(token) {
  memoryToken = token || null
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (token) sessionStorage.setItem(TOKEN_KEY, token)
      else sessionStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Ignora indisponibilidade de sessionStorage
  }
}

function notifyUnauthorized() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('edulytics:unauthorized'))
  }
}

function buildUrl(path, query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const base = getApiBaseUrl()
  const prefix = `${base}/api/v1${normalizedPath}`
  if (!query) return prefix

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${prefix}?${qs}` : prefix
}

async function parseErrorResponse(response, fallbackPath) {
  const contentType = response.headers?.get?.('content-type') || ''
  if (contentType.includes('json')) {
    try {
      const payload = await response.json()
      return new ApiError({
        status: payload.status ?? response.status,
        title: payload.title || `Erro ${response.status}`,
        detail: payload.detail || payload.message || 'Falha ao processar solicitação.',
        errors: payload.errors || null,
        type: payload.type || 'about:blank',
        instance: payload.instance || fallbackPath,
      })
    } catch {
      // Fallback caso corpo JSON seja inválido
    }
  }

  return new ApiError({
    status: response.status,
    title: `Erro HTTP ${response.status}`,
    detail: response.statusText || 'Não foi possível se comunicar com o servidor.',
    instance: fallbackPath,
  })
}

/**
 * Executa requisição REST contra /api/v1 (via fetch HTTP ou adaptador Mock compatível).
 */
export async function request(
  path,
  { method = 'GET', body, query, signal, token, auth = true } = {},
) {
  const effectiveToken = auth ? (token ?? getStoredToken()) : null
  const mode = getApiMode()

  if (mode === 'mock') {
    try {
      return await handleMockRequest({
        method,
        path,
        query,
        body,
        token: effectiveToken,
        signal,
      })
    } catch (error) {
      if (error?.status === 401 && auth) {
        notifyUnauthorized()
      }
      if (error instanceof ApiError) throw error
      throw new ApiError({
        status: error?.status || 500,
        title: error?.title || 'Erro na simulação da API',
        detail: error?.detail || error?.message || 'Falha interna.',
        errors: error?.errors || null,
        instance: `/api/v1${path}`,
      })
    }
  }

  const url = buildUrl(path, query)
  const headers = {
    Accept: 'application/json, application/problem+json',
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`
  }

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (networkError) {
    if (networkError?.name === 'AbortError') throw networkError
    throw new ApiError({
      status: 0,
      title: 'Falha de conexão',
      detail: 'Não foi possível conectar à API do EDULYTICS. Verifique a URL configurada ou a conexão de rede.',
      instance: `/api/v1${path}`,
    })
  }

  if (response.status === 401 && auth) {
    notifyUnauthorized()
  }

  if (!response.ok) {
    throw await parseErrorResponse(response, `/api/v1${path}`)
  }

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
