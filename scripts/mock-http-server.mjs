import http from 'node:http'
import { pathToFileURL } from 'node:url'
import { handleMockRequest, resetMockDb } from '../src/services/mockApiServer.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type,Accept',
  'Access-Control-Max-Age': '86400',
}

function sendJson(res, statusCode, payload, contentType = 'application/json; charset=utf-8') {
  const headers = { ...CORS_HEADERS }
  if (statusCode === 204 || payload === undefined || payload === null) {
    res.writeHead(statusCode, headers)
    res.end()
    return
  }
  const body = JSON.stringify(payload)
  headers['Content-Type'] = contentType
  headers['Content-Length'] = Buffer.byteLength(body)
  res.writeHead(statusCode, headers)
  res.end(body)
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      if (!chunks.length) {
        resolve(undefined)
        return
      }
      const raw = Buffer.concat(chunks).toString('utf8').trim()
      if (!raw) {
        resolve(undefined)
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(
          Object.assign(new Error('JSON inválido no corpo da requisição.'), {
            status: 400,
            title: 'JSON malformado',
            detail: 'O corpo da requisição não contém JSON válido.',
          }),
        )
      }
    })
    req.on('error', reject)
  })
}

export function createApiHttpServer({ enableTestEndpoints = false } = {}) {
  return http.createServer(async (req, res) => {
    const method = (req.method || 'GET').toUpperCase()
    const requestUrl = new URL(req.url || '/', 'http://127.0.0.1')
    const pathname = requestUrl.pathname

    if (method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS)
      res.end()
      return
    }

    if (method === 'GET' && pathname === '/actuator/health') {
      sendJson(res, 200, {
        status: 'UP',
        service: 'edulytics-api-contract',
        timestamp: new Date().toISOString(),
      })
      return
    }

    if (enableTestEndpoints && method === 'POST' && pathname === '/__test/reset') {
      resetMockDb()
      sendJson(res, 200, { reset: true })
      return
    }

    if (pathname.startsWith('/api/v1')) {
      const apiPath = pathname.slice('/api/v1'.length) || '/'
      const query = {}
      for (const [key, value] of requestUrl.searchParams.entries()) {
        query[key] = value
      }

      const authHeader = req.headers.authorization || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

      try {
        const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readJsonBody(req) : undefined
        const result = await handleMockRequest({
          method,
          path: apiPath,
          query,
          body,
          token,
        })
        if (result === null || result === undefined) {
          sendJson(res, 204, null)
          return
        }
        const statusCode = method === 'POST' && !apiPath.startsWith('/auth/') ? 201 : 200
        sendJson(res, statusCode, result)
      } catch (err) {
        const status = Number(err?.status) || 500
        sendJson(
          res,
          status,
          {
            type: err?.type || 'about:blank',
            title: err?.title || `Erro HTTP ${status}`,
            status,
            detail: err?.detail || err?.message || 'Erro interno no servidor.',
            errors: err?.errors || null,
            instance: pathname,
            timestamp: new Date().toISOString(),
          },
          'application/problem+json; charset=utf-8',
        )
      }
      return
    }

    sendJson(
      res,
      404,
      {
        type: 'about:blank',
        title: 'Recurso não encontrado',
        status: 404,
        detail: `Rota ${method} ${pathname} não encontrada.`,
        instance: pathname,
      },
      'application/problem+json; charset=utf-8',
    )
  })
}

const isCli =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isCli) {
  const port = Number(process.env.PORT || 8080)
  const host = process.env.HOST || '127.0.0.1'
  const server = createApiHttpServer({
    enableTestEndpoints: process.env.NODE_ENV === 'test',
  })
  server.listen(port, host, () => {
    console.log(`EDULYTICS HTTP contract server listening on http://${host}:${port}`)
  })
}
