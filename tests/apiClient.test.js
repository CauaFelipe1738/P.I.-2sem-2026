import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import {
  ApiError,
  getApiMode,
  request,
  setRuntimeTransport,
  setStoredToken,
} from '../src/services/apiClient.js'

const originalFetch = globalThis.fetch
const originalWindow = globalThis.window

afterEach(() => {
  globalThis.fetch = originalFetch
  globalThis.window = originalWindow
  setRuntimeTransport(null)
  setStoredToken(null)
})

test('apiClient envia header Bearer e query params no modo HTTP', async () => {
  setRuntimeTransport('http')
  setStoredToken('jwt-demo-123')

  let capturedUrl = ''
  let capturedInit = null
  globalThis.fetch = async (url, init) => {
    capturedUrl = url
    capturedInit = init
    return new Response(JSON.stringify({ content: [{ id: 1 }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const res = await request('/cursos', { query: { q: 'web', page: 0, empty: '' } })
  assert.equal(res.content.length, 1)
  assert.equal(capturedUrl, '/api/v1/cursos?q=web&page=0')
  assert.equal(capturedInit.headers.Authorization, 'Bearer jwt-demo-123')
})

test('apiClient trata 204 No Content retornando null', async () => {
  setRuntimeTransport('http')
  globalThis.fetch = async () => new Response(null, { status: 204 })

  const res = await request('/auth/logout', { method: 'POST' })
  assert.equal(res, null)
})

test('apiClient converte RFC 7807 ProblemDetail em ApiError e dispara evento no 401', async () => {
  setRuntimeTransport('http')
  let unauthorizedCount = 0
  globalThis.window = {
    dispatchEvent(evt) {
      if (evt.type === 'edulytics:unauthorized') unauthorizedCount += 1
    },
  }

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        status: 401,
        title: 'Não autenticado',
        detail: 'Token expirado.',
        errors: { token: 'Expirado' },
      }),
      {
        status: 401,
        headers: { 'content-type': 'application/problem+json' },
      },
    )

  await assert.rejects(
    () => request('/auth/me'),
    (err) => {
      assert.ok(err instanceof ApiError)
      assert.equal(err.status, 401)
      assert.equal(err.detail, 'Token expirado.')
      assert.equal(err.errors.token, 'Expirado')
      return true
    },
  )
  assert.equal(unauthorizedCount, 1)
  assert.equal(getApiMode(), 'http')
})
