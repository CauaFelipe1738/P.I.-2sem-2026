import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import test from 'node:test'

const ROOT = process.cwd()

const SCAN_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yml',
  '.yaml',
  '.md',
  '.conf',
  '.properties',
  '.gradle',
  '.java',
  '.sql',
  '.sh',
])

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'dist-ssr',
  '.gradle',
  'build',
])

function walkRepoFiles(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkRepoFiles(fullPath, result)
    } else if (
      SCAN_EXTENSIONS.has(path.extname(entry.name)) ||
      entry.name.startsWith('Dockerfile') ||
      entry.name === '.env.example' ||
      entry.name === 'docker-compose.yml'
    ) {
      result.push(fullPath)
    }
  }
  return result
}

const SECRET_PATTERNS = [
  { name: 'AWS Access Key ID', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { name: 'RDS URL com credenciais hardcoded', regex: /jdbc:postgresql:\/\/[^/\s]*rds\.amazonaws\.com[^"\s]*password=[^&\s$]+/gi },
  { name: 'GitHub PAT Token', regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { name: 'JWT hardcoded em configuração', regex: /JWT_SECRET=(?!\s*$|\$\{)[A-Za-z0-9+/=_-]{24,}/g },
]

test('DevOps Gate 1: nenhum segredo ou credencial real está exposto no repositório (#40)', () => {
  assert.equal(fs.existsSync(path.join(ROOT, '.env')), false, 'Arquivo .env real não deve existir versionado na raiz')

  const files = walkRepoFiles(ROOT)
  assert.ok(files.length > 10)

  const findings = []
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern.regex)
      if (matches?.length) {
        findings.push(`${path.relative(ROOT, file)} -> ${pattern.name}`)
      }
    }
  }

  assert.deepEqual(findings, [], `Possíveis segredos detectados: ${findings.join('; ')}`)
})

test('DevOps Gate 2: contrato .env.example e regras de proteção no .gitignore estão presentes', () => {
  const envExample = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8')
  assert.match(envExample, /^VITE_API_URL=/m)
  assert.match(envExample, /^VITE_API_MODE=/m)

  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')
  assert.match(gitignore, /^\.env$/m)
  assert.match(gitignore, /^!\.env\.example$/m)
  assert.match(gitignore, /^node_modules$/m)
  assert.match(gitignore, /^dist$/m)
})

test('DevOps Gate 3: pipeline CI/CD GitHub Actions (.github/workflows/ci.yml) define lint, testes e build (#45)', () => {
  const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml')
  assert.equal(fs.existsSync(ciPath), true, 'Workflow .github/workflows/ci.yml deve existir')

  const ci = fs.readFileSync(ciPath, 'utf8')
  assert.match(ci, /pull_request:/)
  assert.match(ci, /branches:\s*\[.*develop.*main.*\]/s)
  assert.match(ci, /npm ci/)
  assert.match(ci, /npm run lint/)
  assert.match(ci, /npm run test:unit/)
  assert.match(ci, /npm run test:integration/)
  assert.match(ci, /npm run build/)
  assert.match(ci, /npm run test:devops/)
})

test('DevOps Gate 4: manifestos Dockerfile.frontend, infra/nginx.conf e docker-compose.yml são válidos', () => {
  const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile.frontend'), 'utf8')
  assert.match(dockerfile, /FROM node:22-alpine AS build/)
  assert.match(dockerfile, /FROM nginx:1\.27-alpine/)
  assert.match(dockerfile, /npm ci/)
  assert.match(dockerfile, /npm run build/)
  assert.match(dockerfile, /HEALTHCHECK/)

  const nginxConf = fs.readFileSync(path.join(ROOT, 'infra', 'nginx.conf'), 'utf8')
  assert.match(nginxConf, /try_files \$uri \$uri\/ \/index\.html/)
  assert.match(nginxConf, /location \/api\//)
  assert.match(nginxConf, /location \/actuator\//)
  assert.match(nginxConf, /X-Content-Type-Options/)
  assert.match(nginxConf, /location = \/healthz/)

  const compose = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf8')
  assert.match(compose, /^\s*db:/m)
  assert.match(compose, /^\s*backend:/m)
  assert.match(compose, /^\s*frontend:/m)
  assert.match(compose, /postgres:17-alpine/)
  assert.match(compose, /healthcheck:/m)
  assert.match(compose, /\$\{JWT_SECRET:-/)
})

test('DevOps Gate 5 (E2E Smoke): bundle dist/ serve rotas SPA e assets compilados com HTTP 200 (#57)', async (t) => {
  const distDir = path.join(ROOT, 'dist')
  const indexHtmlPath = path.join(distDir, 'index.html')

  if (!fs.existsSync(indexHtmlPath)) {
    t.skip('dist/index.html ausente antes de npm run build (obrigatório em CI pós-build)')
    return
  }

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')
  assert.match(indexHtml, /<div id="root"><\/div>/)
  const assetRefs = [...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
  assert.ok(assetRefs.length >= 1, 'dist/index.html deve referenciar assets compilados')

  for (const ref of assetRefs) {
    const assetFile = path.join(distDir, ref.replace(/^\//, ''))
    assert.equal(fs.existsSync(assetFile), true, `Asset referenciado ausente: ${ref}`)
  }

  const staticServer = http.createServer((req, res) => {
    const urlPath = (req.url || '/').split('?')[0]
    const candidate = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, ''))
    const targetFile = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : indexHtmlPath
    const ext = path.extname(targetFile)
    const contentType =
      ext === '.js'
        ? 'application/javascript; charset=utf-8'
        : ext === '.css'
          ? 'text/css; charset=utf-8'
          : 'text/html; charset=utf-8'
    res.writeHead(200, { 'Content-Type': contentType })
    fs.createReadStream(targetFile).pipe(res)
  })

  await new Promise((resolve) => staticServer.listen(0, '127.0.0.1', resolve))
  const port = staticServer.address().port

  try {
    for (const spaRoute of ['/', '/login', '/professor/frequencia', '/aluno']) {
      const resp = await fetch(`http://127.0.0.1:${port}${spaRoute}`)
      assert.equal(resp.status, 200, `Rota SPA ${spaRoute} deve responder 200`)
      const html = await resp.text()
      assert.match(html, /<div id="root"><\/div>/)
    }

    const assetResp = await fetch(`http://127.0.0.1:${port}${assetRefs[0]}`)
    assert.equal(assetResp.status, 200)
    const assetText = await assetResp.text()
    assert.ok(assetText.length > 100)
  } finally {
    await new Promise((resolve) => staticServer.close(resolve))
  }
})
