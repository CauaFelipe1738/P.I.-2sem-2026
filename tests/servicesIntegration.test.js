import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import { setRuntimeTransport, setStoredToken } from '../src/services/apiClient.js'
import { resetMockDb } from '../src/services/mockApiServer.js'
import * as authService from '../src/services/authService.js'
import * as academicoService from '../src/services/academicoService.js'
import * as aulasService from '../src/services/aulasService.js'
import * as avaliacoesService from '../src/services/avaliacoesService.js'
import * as comentariosService from '../src/services/comentariosService.js'
import * as indicadoresService from '../src/services/indicadoresService.js'

beforeEach(() => {
  setRuntimeTransport('mock')
  setStoredToken(null)
  resetMockDb()
})

test('Autenticação rejeita senha inválida com 401 e autentica Professor e Aluno', async () => {
  await assert.rejects(
    () => authService.login({ email: 'ana@exemplo.com', senha: 'errada' }),
    (err) => err.status === 401,
  )

  const loginProf = await authService.login({ email: 'ana@exemplo.com', senha: '123456' })
  assert.equal(loginProf.usuario.cargo, 'Professor')
  const me = await authService.getMe()
  assert.equal(me.email, 'ana@exemplo.com')

  await authService.logout()
  await assert.rejects(() => authService.getMe(), (err) => err.status === 401)
})

test('Fluxo de Aula e Frequência valida horários, conteúdo, duplicidade (409) e edição', async () => {
  await authService.login({ email: 'ana@exemplo.com', senha: '123456' })

  await assert.rejects(
    () =>
      aulasService.createAula({
        disciplinaTurmaId: 1,
        dataAula: '2026-06-01',
        horarioInicio: '20:00',
        horarioFim: '19:00',
      }),
    (err) => err.status === 422,
  )

  const aula = await aulasService.createAula({
    disciplinaTurmaId: 1,
    dataAula: '2026-06-01',
    horarioInicio: '19:00',
    horarioFim: '20:40',
    conteudo: '',
    status: 'PLANEJADA',
  })

  await assert.rejects(
    () => aulasService.realizarAula(aula.id, ''),
    (err) => err.status === 422,
  )

  const realizada = await aulasService.realizarAula(aula.id, 'Índices e Views no PostgreSQL')
  assert.equal(realizada.status, 'REALIZADA')

  await assert.rejects(
    () =>
      aulasService.saveFrequenciasEmLote(aula.id, [
        { alunoId: 1, statusPresenca: 'PRESENTE' },
        { alunoId: 1, statusPresenca: 'ATRASO' },
      ]),
    (err) => err.status === 409,
  )

  const salvos = await aulasService.saveFrequenciasEmLote(aula.id, [
    { alunoId: 1, statusPresenca: 'PRESENTE' },
    { alunoId: 2, statusPresenca: 'ATRASO', checklistAula: ['Participou da aula'] },
  ])
  assert.equal(salvos.length, 2)
  assert.equal(salvos[1].presente, true)

  const corrigido = await aulasService.updateFrequencia(salvos[1].id, {
    statusPresenca: 'FALTA_JUSTIFICADA',
    justificativa: 'Atestado',
  })
  assert.equal(corrigido.presente, false)
})

test('Avaliações e Notas validam intervalo 0..valorTotal e indicadores calculam corte de 75%', async () => {
  await authService.login({ email: 'ana@exemplo.com', senha: '123456' })

  const av = await avaliacoesService.createAvaliacao({
    disciplinaTurmaId: 1,
    periodoId: 1,
    nomeAvaliacao: 'Prova Final',
    tipoAvaliacao: 'PROVA',
    dataAvaliacao: '2026-06-20',
    valorTotal: 10,
    peso: 2,
  })

  await assert.rejects(
    () => avaliacoesService.upsertNotaAluno(av.id, 1, { nota: 11 }),
    (err) => err.status === 422,
  )

  const nota = await avaliacoesService.upsertNotaAluno(av.id, 1, { nota: 9.5, observacao: 'Excelente' })
  assert.equal(nota.nota, 9.5)

  const corrigida = await avaliacoesService.corrigirAvaliacao(av.id)
  assert.equal(corrigida.status, 'CORRIGIDA')

  const indicadores = await indicadoresService.getIndicadoresDesempenho({ cursoId: 1, turmaId: 1 })
  assert.equal(indicadores.limitePresencaPercentual, 75)
  assert.ok(indicadores.taxaFrequenciaMedia > 0)
  assert.ok(indicadores.mediaNotasPonderada > 0)

  const relatorio = await indicadoresService.getRelatorioAcademico({ cursoId: 1, turmaId: 1 })
  assert.ok(relatorio.frequencias.length >= 20)
  assert.ok(relatorio.notas.length >= 12)
})

test('Comentários LGPD ocultam visivelAluno=false do Painel do Aluno e isolam rotas docentes (403)', async () => {
  await authService.login({ email: 'ana@exemplo.com', senha: '123456' })
  await comentariosService.createComentario({
    alunoId: 3,
    disciplinaTurmaId: 1,
    titulo: 'Nota interna confidencial',
    tipo: 'SAUDE',
    classificacao: 'NEUTRO',
    descricao: 'Anotação interna docente.',
    visivelAluno: false,
  })

  await assert.rejects(
    () =>
      comentariosService.createPlano({
        alunoId: 3,
        dificuldade: 'Teste',
        objetivo: 'Teste',
        acaoProposta: 'Teste',
        dataInicio: '2026-05-10',
        prazo: '2026-05-01',
      }),
    (err) => err.status === 422,
  )

  await authService.login({ email: 'carla@exemplo.com', senha: '123456' })
  await assert.rejects(
    () => academicoService.listAlunos(),
    (err) => err.status === 403,
  )

  const meu = await indicadoresService.getMeuDesempenho()
  assert.equal(meu.aluno.nomeCompleto, 'Carla Souza')
  assert.ok(meu.comentarios.every((c) => c.visivelAluno === true))
  assert.equal(meu.comentarios.some((c) => c.tipo === 'SAUDE'), false)
})
