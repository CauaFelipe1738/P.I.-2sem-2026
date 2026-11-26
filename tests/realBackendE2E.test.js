import assert from 'node:assert/strict'
import test, { after, before } from 'node:test'
import { setRuntimeTransport, setStoredToken } from '../src/services/apiClient.js'
import { checkApiHealth } from '../src/services/healthService.js'
import * as authService from '../src/services/authService.js'
import * as academicoService from '../src/services/academicoService.js'
import * as aulasService from '../src/services/aulasService.js'
import * as avaliacoesService from '../src/services/avaliacoesService.js'
import * as comentariosService from '../src/services/comentariosService.js'
import * as indicadoresService from '../src/services/indicadoresService.js'

const BACKEND_URL = process.env.EDULYTICS_E2E_BACKEND_URL

let prevUrl
let prevMode

before(() => {
  prevUrl = process.env.VITE_API_URL
  prevMode = process.env.VITE_API_MODE
  if (BACKEND_URL) {
    process.env.VITE_API_URL = BACKEND_URL
    process.env.VITE_API_MODE = 'http'
    setRuntimeTransport('http')
    setStoredToken(null)
  }
})

after(() => {
  setRuntimeTransport(null)
  setStoredToken(null)
  if (prevUrl === undefined) delete process.env.VITE_API_URL
  else process.env.VITE_API_URL = prevUrl
  if (prevMode === undefined) delete process.env.VITE_API_MODE
  else process.env.VITE_API_MODE = prevMode
})

test('E2E Full-Stack: serviços React comunicam em HTTP real contra Spring Boot /api/v1', async (t) => {
  if (!BACKEND_URL) {
    t.skip('Defina EDULYTICS_E2E_BACKEND_URL (ex.: http://127.0.0.1:8080) para executar contra Spring Boot real.')
    return
  }

  // 1. Actuator Health
  const health = await checkApiHealth()
  assert.equal(health.status, 'UP')
  assert.equal(health.mode, 'http')

  // 2. Auth JWT real
  await assert.rejects(
    () => authService.login({ email: 'ana@exemplo.com', senha: 'errada' }),
    (err) => err.status === 401,
  )

  const profSession = await authService.login({ email: 'ana@exemplo.com', senha: '123456' })
  assert.equal(profSession.usuario.cargo, 'Professor')
  assert.ok(profSession.accessToken)

  const meProf = await authService.getMe()
  assert.equal(meProf.email, 'ana@exemplo.com')

  // 3. Catálogo Acadêmico real
  const cursos = await academicoService.listCursos({ somenteMeus: true })
  assert.ok(cursos.content.length >= 1)
  const cursoId = cursos.content[0].id

  const periodos = await academicoService.listPeriodos()
  assert.ok(periodos.length >= 1)
  const periodoId = periodos[0].id

  const turmas = await academicoService.listTurmasByCurso(cursoId)
  assert.ok(turmas.length >= 1)
  const turmaId = turmas[0].id

  const disciplinas = await academicoService.listDisciplinasByTurma(turmaId)
  assert.ok(disciplinas.length >= 1)
  const disciplinaTurmaId = disciplinas[0].disciplinaTurmaId

  const alunosTurma = await academicoService.listAlunosByTurma(turmaId)
  assert.ok(alunosTurma.length >= 1)
  const carlaId = alunosTurma.find((a) => a.nomeCompleto.includes('Carla'))?.alunoId || alunosTurma[0].alunoId

  // 4. Aulas e Frequência real
  const aula = await aulasService.createAula({
    disciplinaTurmaId,
    dataAula: '2026-06-25',
    horarioInicio: '19:00',
    horarioFim: '20:40',
    conteudo: 'Integração Real React + Spring Boot',
  })
  assert.ok(aula.id)

  const realizada = await aulasService.realizarAula(aula.id, 'Integração E2E concluída')
  assert.equal(realizada.status, 'REALIZADA')

  await assert.rejects(
    () =>
      aulasService.saveFrequenciasEmLote(aula.id, [
        { alunoId: carlaId, statusPresenca: 'PRESENTE' },
        { alunoId: carlaId, statusPresenca: 'ATRASO' },
      ]),
    (err) => err.status === 409,
  )

  const freqs = await aulasService.saveFrequenciasEmLote(aula.id, [
    { alunoId: carlaId, statusPresenca: 'ATRASO', checklistAula: ['Participou da aula'] },
  ])
  assert.equal(freqs.length, 1)
  assert.equal(freqs[0].presente, true)

  // 5. Avaliações e Notas real
  const av = await avaliacoesService.createAvaliacao({
    disciplinaTurmaId,
    periodoId,
    nomeAvaliacao: 'Avaliação E2E Spring',
    tipoAvaliacao: 'PROVA',
    dataAvaliacao: '2026-06-28',
    valorTotal: 10,
    peso: 2,
  })
  assert.ok(av.id)

  await assert.rejects(
    () => avaliacoesService.upsertNotaAluno(av.id, carlaId, { nota: 12 }),
    (err) => err.status === 422,
  )

  const nota = await avaliacoesService.upsertNotaAluno(av.id, carlaId, {
    nota: 9.0,
    observacao: 'E2E ok',
  })
  assert.equal(Number(nota.nota), 9)

  const corrigida = await avaliacoesService.corrigirAvaliacao(av.id)
  assert.equal(corrigida.status, 'CORRIGIDA')

  // 6. Comentários LGPD e Planos real
  const privadoTitulo = 'Nota privada E2E Spring'
  await comentariosService.createComentario({
    alunoId: carlaId,
    disciplinaTurmaId,
    titulo: privadoTitulo,
    tipo: 'SAUDE',
    classificacao: 'ATENCAO',
    descricao: 'Privado do docente.',
    visivelAluno: false,
  })

  await assert.rejects(
    () =>
      comentariosService.createPlano({
        alunoId: carlaId,
        dificuldade: 'Teste',
        objetivo: 'Teste',
        acaoProposta: 'Teste',
        dataInicio: '2026-06-20',
        prazo: '2026-06-10',
      }),
    (err) => err.status === 422,
  )

  // 7. Indicadores e Relatório real
  const indicadores = await indicadoresService.getIndicadoresDesempenho({ cursoId, turmaId })
  assert.equal(indicadores.limitePresencaPercentual, 75)
  assert.ok(indicadores.taxaFrequenciaMedia >= 0)
  assert.ok(indicadores.mediaNotasPonderada > 0)

  const relatorio = await indicadoresService.getRelatorioAcademico({ cursoId, turmaId })
  assert.ok(relatorio.emitidoEm)
  assert.ok(relatorio.frequencias.length >= 1)

  // 8. RBAC + LGPD no Painel do Aluno real
  await authService.login({ email: 'carla@exemplo.com', senha: '123456' })
  await assert.rejects(() => academicoService.listAlunos(), (err) => err.status === 403)
  await assert.rejects(
    () => indicadoresService.getIndicadoresDesempenho({ cursoId }),
    (err) => err.status === 403,
  )

  const meu = await indicadoresService.getMeuDesempenho()
  assert.equal(meu.aluno.nomeCompleto, 'Carla Souza')
  assert.ok(meu.comentarios.every((c) => c.visivelAluno === true))
  assert.equal(meu.comentarios.some((c) => c.titulo === privadoTitulo), false)
})
