import assert from 'node:assert/strict'
import test, { after, before, beforeEach } from 'node:test'
import { createApiHttpServer } from '../scripts/mock-http-server.mjs'
import { resetMockDb } from '../src/services/mockApiServer.js'
import { setRuntimeTransport, setStoredToken } from '../src/services/apiClient.js'
import { checkApiHealth } from '../src/services/healthService.js'
import * as authService from '../src/services/authService.js'
import * as academicoService from '../src/services/academicoService.js'
import * as aulasService from '../src/services/aulasService.js'
import * as avaliacoesService from '../src/services/avaliacoesService.js'
import * as comentariosService from '../src/services/comentariosService.js'
import * as indicadoresService from '../src/services/indicadoresService.js'

let server
let baseUrl
let previousApiUrl
let previousApiMode

before(async () => {
  previousApiUrl = process.env.VITE_API_URL
  previousApiMode = process.env.VITE_API_MODE

  server = createApiHttpServer({ enableTestEndpoints: true })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`

  process.env.VITE_API_URL = baseUrl
  process.env.VITE_API_MODE = 'http'
})

after(async () => {
  setRuntimeTransport(null)
  setStoredToken(null)
  if (previousApiUrl === undefined) delete process.env.VITE_API_URL
  else process.env.VITE_API_URL = previousApiUrl
  if (previousApiMode === undefined) delete process.env.VITE_API_MODE
  else process.env.VITE_API_MODE = previousApiMode

  await new Promise((resolve) => server.close(resolve))
})

beforeEach(() => {
  resetMockDb()
  setStoredToken(null)
  setRuntimeTransport('http')
})

test('HTTP real: healthcheck (/actuator/health) e preflight CORS respondem corretamente', async () => {
  const health = await checkApiHealth()
  assert.equal(health.status, 'UP')
  assert.equal(health.mode, 'http')
  assert.equal(health.baseUrl, baseUrl)
  assert.ok(health.latencyMs >= 1)

  const preflight = await fetch(`${baseUrl}/api/v1/cursos`, { method: 'OPTIONS' })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*')
  assert.match(preflight.headers.get('access-control-allow-headers') || '', /Authorization/i)
})

test('HTTP real: login JWT Bearer, getMe, logout e RFC 7807 (401) trafegam via TCP', async () => {
  await assert.rejects(
    () => authService.login({ email: 'ana@exemplo.com', senha: 'errada' }),
    (err) => err.status === 401 && err.instance === '/api/v1/auth/login',
  )

  const session = await authService.login({ email: 'ana@exemplo.com', senha: '123456' })
  assert.ok(session.accessToken)
  assert.equal(session.usuario.cargo, 'Professor')

  const me = await authService.getMe()
  assert.equal(me.email, 'ana@exemplo.com')

  await authService.logout()
  await assert.rejects(() => authService.getMe(), (err) => err.status === 401)
})

test('HTTP real: fluxo docente completo (cursos, turmas, aulas, frequência 409, notas 422 e indicadores 75%)', async () => {
  await authService.login({ email: 'ana@exemplo.com', senha: '123456' })

  const cursosPage = await academicoService.listCursos({ page: 0, size: 10 })
  assert.ok(cursosPage.content.length >= 1)
  const cursoId = cursosPage.content[0].id

  const turmas = await academicoService.listTurmasByCurso(cursoId)
  assert.ok(turmas.length >= 1)
  const turmaId = turmas[0].id

  const disciplinas = await academicoService.listDisciplinasByTurma(turmaId)
  assert.ok(disciplinas.length >= 1)
  const disciplinaTurmaId = disciplinas[0].disciplinaTurmaId

  const aula = await aulasService.createAula({
    disciplinaTurmaId,
    dataAula: '2026-06-10',
    horarioInicio: '19:00',
    horarioFim: '20:40',
    conteudo: 'Integração HTTP Real',
  })
  assert.ok(aula.id)

  const realizada = await aulasService.realizarAula(aula.id, 'Integração HTTP Real concluída')
  assert.equal(realizada.status, 'REALIZADA')

  const aulaEditada = await aulasService.updateAula(aula.id, { conteudo: 'Integração HTTP Editada' })
  assert.equal(aulaEditada.conteudo, 'Integração HTTP Editada')

  await assert.rejects(
    () =>
      aulasService.saveFrequenciasEmLote(aula.id, [
        { alunoId: 1, statusPresenca: 'PRESENTE' },
        { alunoId: 1, statusPresenca: 'ATRASO' },
      ]),
    (err) => err.status === 409,
  )

  const freq = await aulasService.saveFrequenciasEmLote(aula.id, [
    { alunoId: 1, statusPresenca: 'PRESENTE' },
    { alunoId: 2, statusPresenca: 'ATRASO' },
  ])
  assert.equal(freq.length, 2)

  const freqEditada = await aulasService.updateFrequencia(freq[1].id, {
    statusPresenca: 'FALTA_JUSTIFICADA',
    justificativa: 'Comprovante via HTTP',
  })
  assert.equal(freqEditada.presente, false)

  const av = await avaliacoesService.createAvaliacao({
    disciplinaTurmaId,
    periodoId: 1,
    nomeAvaliacao: 'Avaliação Contrato HTTP',
    tipoAvaliacao: 'PROVA',
    dataAvaliacao: '2026-06-22',
    valorTotal: 10,
    peso: 2,
  })

  const avEditada = await avaliacoesService.updateAvaliacao(av.id, { nomeAvaliacao: 'Avaliação HTTP Editada' })
  assert.equal(avEditada.nomeAvaliacao, 'Avaliação HTTP Editada')

  const alunosTurmaTodos = await academicoService.listAlunosByTurma(turmaId, { status: 'TODOS' })
  assert.ok(alunosTurmaTodos.length >= 1)
  const matTarget = alunosTurmaTodos[alunosTurmaTodos.length - 1]
  const trancada = await academicoService.updateMatriculaStatus(matTarget.matriculaId, 'TRANCAR')
  assert.equal(trancada.status, 'TRANCADA')
  await assert.rejects(
    () => academicoService.updateMatriculaStatus(matTarget.matriculaId, 'CONCLUIR'),
    (err) => err.status === 422,
  )

  await assert.rejects(
    () => avaliacoesService.upsertNotaAluno(av.id, 1, { nota: 12 }),
    (err) => err.status === 422,
  )

  const nota = await avaliacoesService.upsertNotaAluno(av.id, 1, { nota: 8.5 })
  assert.equal(nota.nota, 8.5)

  const indicadores = await indicadoresService.getIndicadoresDesempenho({ cursoId, turmaId })
  assert.equal(indicadores.limitePresencaPercentual, 75)
  assert.ok(indicadores.totalAulasRegistradas >= 1)
})

test('HTTP real: RBAC bloqueia aluno (403) em rotas docentes e LGPD oculta visivelAluno=false', async () => {
  await authService.login({ email: 'ana@exemplo.com', senha: '123456' })
  await comentariosService.createComentario({
    alunoId: 3,
    disciplinaTurmaId: 1,
    titulo: 'Registro sigiloso HTTP',
    tipo: 'SAUDE',
    classificacao: 'NEUTRO',
    descricao: 'Privado do corpo docente.',
    visivelAluno: false,
  })

  await authService.login({ email: 'carla@exemplo.com', senha: '123456' })
  await assert.rejects(() => academicoService.listAlunos(), (err) => err.status === 403)

  const meu = await indicadoresService.getMeuDesempenho()
  assert.equal(meu.aluno.nomeCompleto, 'Carla Souza')
  assert.ok(meu.comentarios.every((c) => c.visivelAluno === true))
  assert.equal(meu.comentarios.some((c) => c.titulo === 'Registro sigiloso HTTP'), false)
})

test('HTTP real: healthService reporta DOWN quando backend está inacessível', async () => {
  const closedServer = createApiHttpServer()
  await new Promise((resolve) => closedServer.listen(0, '127.0.0.1', resolve))
  const deadPort = closedServer.address().port
  await new Promise((resolve) => closedServer.close(resolve))

  process.env.VITE_API_URL = `http://127.0.0.1:${deadPort}`
  try {
    const health = await checkApiHealth()
    assert.equal(health.status, 'DOWN')
    assert.equal(health.mode, 'http')
  } finally {
    process.env.VITE_API_URL = baseUrl
  }
})
