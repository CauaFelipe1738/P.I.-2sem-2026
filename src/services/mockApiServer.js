import {
  CORTE_PRESENCA_PERCENTUAL,
  STATUS_PRESENCA,
} from '../utils/checklists.js'
import {
  calcularMediaPonderada,
  calcularTaxaFrequencia,
  isPresencaContabilizada,
} from '../utils/academicMetrics.js'

const MOCK_STORAGE_KEY = 'edulytics.api-mock.v1'

function createSeedDatabase() {
  return {
    nextIds: {
      aula: 6,
      frequencia: 21,
      avaliacao: 4,
      alunoAvaliacao: 13,
      comentario: 4,
      plano: 2,
    },
    usuarios: [
      { id: 1, email: 'ana@exemplo.com', senha: '123456', cargo: 'Professor', ativo: true, professorId: 1, alunoId: null, nomeCompleto: 'Ana Martins' },
      { id: 2, email: 'bruno@exemplo.com', senha: '123456', cargo: 'Professor', ativo: true, professorId: 2, alunoId: null, nomeCompleto: 'Bruno Almeida' },
      { id: 3, email: 'carla@exemplo.com', senha: '123456', cargo: 'Aluno', ativo: true, professorId: null, alunoId: 1, nomeCompleto: 'Carla Souza' },
      { id: 4, email: 'diego@exemplo.com', senha: '123456', cargo: 'Aluno', ativo: true, professorId: null, alunoId: 2, nomeCompleto: 'Diego Lima' },
      { id: 5, email: 'elisa@exemplo.com', senha: '123456', cargo: 'Aluno', ativo: true, professorId: null, alunoId: 3, nomeCompleto: 'Elisa Costa' },
      { id: 6, email: 'felipe@exemplo.com', senha: '123456', cargo: 'Aluno', ativo: true, professorId: null, alunoId: 4, nomeCompleto: 'Felipe Rocha' },
    ],
    professores: [
      { id: 1, usuarioId: 1, nomeCompleto: 'Ana Martins', formacao: 'Mestrado em Computação' },
      { id: 2, usuarioId: 2, nomeCompleto: 'Bruno Almeida', formacao: 'Desenvolvimento Web' },
    ],
    alunos: [
      { id: 1, usuarioId: 3, nomeCompleto: 'Carla Souza', matriculaEscolar: '2026001', dataIngresso: '2026-02-02', dataNascimento: '2004-05-12' },
      { id: 2, usuarioId: 4, nomeCompleto: 'Diego Lima', matriculaEscolar: '2026002', dataIngresso: '2026-02-02', dataNascimento: '2003-09-21' },
      { id: 3, usuarioId: 5, nomeCompleto: 'Elisa Costa', matriculaEscolar: '2026003', dataIngresso: '2026-02-02', dataNascimento: '2004-11-03' },
      { id: 4, usuarioId: 6, nomeCompleto: 'Felipe Rocha', matriculaEscolar: '2026004', dataIngresso: '2026-02-02', dataNascimento: '2002-08-18' },
    ],
    periodos: [
      { id: 1, nomePeriodo: '1º Semestre', anoLetivo: 2026, dataInicio: '2026-02-02', dataFim: '2026-07-10' },
      { id: 2, nomePeriodo: '2º Semestre', anoLetivo: 2026, dataInicio: '2026-08-03', dataFim: '2026-12-18' },
    ],
    cursos: [
      {
        id: 1,
        nome: 'Tecnologia em Sistemas para Internet',
        descricao: 'Formação voltada ao desenvolvimento web full stack, banco de dados e arquitetura em nuvem.',
        cargaHoraria: 2000,
        status: 'ATIVO',
      },
      {
        id: 2,
        nome: 'Análise e Desenvolvimento de Sistemas',
        descricao: 'Projeto, implementação, testes e evolução de sistemas corporativos e APIs REST.',
        cargaHoraria: 2400,
        status: 'ATIVO',
      },
    ],
    turmas: [
      { id: 1, cursoId: 1, periodoId: 1, nomeTurma: 'TSI-2026-A', turno: 'NOITE' },
      { id: 2, cursoId: 2, periodoId: 2, nomeTurma: 'ADS-2026-B', turno: 'NOITE' },
    ],
    disciplinas: [
      { id: 1, nome: 'Banco de Dados', descricao: 'Modelagem relacional, normalização e SQL avançado.', cargaHoraria: 80 },
      { id: 2, nome: 'Desenvolvimento Web', descricao: 'Interfaces modernas com HTML, CSS, JavaScript e React.', cargaHoraria: 80 },
      { id: 3, nome: 'Engenharia de Software', descricao: 'Requisitos, UML, testes automatizados e entrega contínua.', cargaHoraria: 60 },
    ],
    disciplinasTurma: [
      { id: 1, disciplinaId: 1, turmaId: 1 },
      { id: 2, disciplinaId: 2, turmaId: 1 },
      { id: 3, disciplinaId: 3, turmaId: 2 },
    ],
    professorDisciplinasTurma: [
      { professorId: 1, disciplinaTurmaId: 1 },
      { professorId: 2, disciplinaTurmaId: 2 },
      { professorId: 1, disciplinaTurmaId: 3 },
    ],
    matriculas: [
      { id: 1, alunoId: 1, turmaId: 1, dataMatricula: '2026-02-02', status: 'ATIVA' },
      { id: 2, alunoId: 2, turmaId: 1, dataMatricula: '2026-02-02', status: 'ATIVA' },
      { id: 3, alunoId: 3, turmaId: 1, dataMatricula: '2026-02-02', status: 'ATIVA' },
      { id: 4, alunoId: 4, turmaId: 1, dataMatricula: '2026-02-02', status: 'ATIVA' },
      { id: 5, alunoId: 1, turmaId: 2, dataMatricula: '2026-08-03', status: 'ATIVA' },
      { id: 6, alunoId: 2, turmaId: 2, dataMatricula: '2026-08-03', status: 'ATIVA' },
    ],
    aulas: [
      { id: 1, disciplinaTurmaId: 1, professorId: 1, dataAula: '2026-03-02', horarioInicio: '19:00', horarioFim: '20:40', conteudo: 'Modelagem relacional', status: 'REALIZADA' },
      { id: 2, disciplinaTurmaId: 1, professorId: 1, dataAula: '2026-03-09', horarioInicio: '19:00', horarioFim: '20:40', conteudo: 'Chaves primárias e estrangeiras', status: 'REALIZADA' },
      { id: 3, disciplinaTurmaId: 1, professorId: 1, dataAula: '2026-03-16', horarioInicio: '19:00', horarioFim: '20:40', conteudo: 'Consultas SQL', status: 'REALIZADA' },
      { id: 4, disciplinaTurmaId: 2, professorId: 2, dataAula: '2026-03-03', horarioInicio: '19:00', horarioFim: '20:40', conteudo: 'HTML e CSS', status: 'REALIZADA' },
      { id: 5, disciplinaTurmaId: 2, professorId: 2, dataAula: '2026-03-10', horarioInicio: '19:00', horarioFim: '20:40', conteudo: 'JavaScript e DOM', status: 'REALIZADA' },
    ],
    frequencias: [
      { id: 1, aulaId: 1, alunoId: 1, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou da aula', 'Realizou as atividades propostas'], observacao: '' },
      { id: 2, aulaId: 1, alunoId: 2, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou da aula'], observacao: '' },
      { id: 3, aulaId: 1, alunoId: 3, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou da aula', 'Entregou atividade solicitada'], observacao: '' },
      { id: 4, aulaId: 1, alunoId: 4, statusPresenca: 'AUSENTE', presente: false, justificativa: 'Ausência não justificada', checklistAula: ['Apresentou dificuldade'], observacao: '' },
      { id: 5, aulaId: 2, alunoId: 1, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou da aula'], observacao: '' },
      { id: 6, aulaId: 2, alunoId: 2, statusPresenca: 'FALTA_JUSTIFICADA', presente: false, justificativa: 'Atestado médico', checklistAula: [], observacao: '' },
      { id: 7, aulaId: 2, alunoId: 3, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou em grupo'], observacao: '' },
      { id: 8, aulaId: 2, alunoId: 4, statusPresenca: 'ATRASO', presente: true, justificativa: '', checklistAula: ['Participou da aula'], observacao: 'Chegou 15 min após início' },
      { id: 9, aulaId: 3, alunoId: 1, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Entregou atividade solicitada'], observacao: '' },
      { id: 10, aulaId: 3, alunoId: 2, statusPresenca: 'AUSENTE', presente: false, justificativa: '', checklistAula: ['Necessitou de acompanhamento'], observacao: '' },
      { id: 11, aulaId: 3, alunoId: 3, statusPresenca: 'FALTA_JUSTIFICADA', presente: false, justificativa: 'Compromisso institucional', checklistAula: [], observacao: '' },
      { id: 12, aulaId: 3, alunoId: 4, statusPresenca: 'AUSENTE', presente: false, justificativa: '', checklistAula: ['Apresentou dificuldade'], observacao: '' },
      { id: 13, aulaId: 4, alunoId: 1, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou da aula'], observacao: '' },
      { id: 14, aulaId: 4, alunoId: 2, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou da aula'], observacao: '' },
      { id: 15, aulaId: 4, alunoId: 3, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Entregou atividade solicitada'], observacao: '' },
      { id: 16, aulaId: 4, alunoId: 4, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou da aula'], observacao: '' },
      { id: 17, aulaId: 5, alunoId: 1, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Realizou as atividades propostas'], observacao: '' },
      { id: 18, aulaId: 5, alunoId: 2, statusPresenca: 'PRESENTE', presente: true, justificativa: '', checklistAula: ['Participou da aula'], observacao: '' },
      { id: 19, aulaId: 5, alunoId: 3, statusPresenca: 'FALTA_JUSTIFICADA', presente: false, justificativa: 'Compromisso', checklistAula: [], observacao: '' },
      { id: 20, aulaId: 5, alunoId: 4, statusPresenca: 'AUSENTE', presente: false, justificativa: '', checklistAula: ['Apresentou dificuldade'], observacao: '' },
    ],
    avaliacoes: [
      { id: 1, disciplinaTurmaId: 1, professorId: 1, periodoId: 1, nomeAvaliacao: 'Prova 1 - Banco de Dados', tipoAvaliacao: 'PROVA', descricao: 'Modelagem ER, normalização e DDL.', dataAvaliacao: '2026-03-20', valorTotal: 10, peso: 1, status: 'CORRIGIDA' },
      { id: 2, disciplinaTurmaId: 1, professorId: 1, periodoId: 1, nomeAvaliacao: 'Trabalho SQL', tipoAvaliacao: 'TRABALHO', descricao: 'Consultas JOIN e agregações.', dataAvaliacao: '2026-04-24', valorTotal: 10, peso: 1, status: 'REALIZADA' },
      { id: 3, disciplinaTurmaId: 2, professorId: 2, periodoId: 1, nomeAvaliacao: 'Projeto Web', tipoAvaliacao: 'PROJETO', descricao: 'Aplicação responsiva em React.', dataAvaliacao: '2026-05-15', valorTotal: 10, peso: 2, status: 'CORRIGIDA' },
    ],
    alunoAvaliacoes: [
      { id: 1, alunoId: 1, avaliacaoId: 1, nota: 8.5, observacao: 'Ótima modelagem.' },
      { id: 2, alunoId: 2, avaliacaoId: 1, nota: 6.5, observacao: 'Revisar chaves compostas.' },
      { id: 3, alunoId: 3, avaliacaoId: 1, nota: 9.0, observacao: '' },
      { id: 4, alunoId: 4, avaliacaoId: 1, nota: 5.5, observacao: 'Necessita reforço em cardinalidade.' },
      { id: 5, alunoId: 1, avaliacaoId: 2, nota: 9.0, observacao: '' },
      { id: 6, alunoId: 2, avaliacaoId: 2, nota: 7.0, observacao: '' },
      { id: 7, alunoId: 3, avaliacaoId: 2, nota: 8.5, observacao: '' },
      { id: 8, alunoId: 4, avaliacaoId: 2, nota: 6.0, observacao: '' },
      { id: 9, alunoId: 1, avaliacaoId: 3, nota: 8.0, observacao: 'Boa estruturação de componentes.' },
      { id: 10, alunoId: 2, avaliacaoId: 3, nota: 7.5, observacao: '' },
      { id: 11, alunoId: 3, avaliacaoId: 3, nota: 9.5, observacao: 'Destaque na apresentação.' },
      { id: 12, alunoId: 4, avaliacaoId: 3, nota: 6.5, observacao: '' },
    ],
    comentarios: [
      {
        id: 1,
        alunoId: 2,
        professorId: 1,
        disciplinaTurmaId: 1,
        titulo: 'Prática de consultas SQL',
        tipo: 'DESEMPENHO',
        classificacao: 'ATENCAO',
        descricao: 'Precisa praticar junções e subconsultas SQL.',
        checklistItens: ['Necessitou de auxílio', 'Apresentou dificuldade'],
        acaoAcompanhamento: 'Resolver lista guiada de exercícios até a próxima semana.',
        visivelAluno: true,
        dataComentario: '2026-03-18T14:20:00Z',
      },
      {
        id: 2,
        alunoId: 3,
        professorId: 2,
        disciplinaTurmaId: 2,
        titulo: 'Destaque no projeto web',
        tipo: 'DESEMPENHO',
        classificacao: 'POSITIVO',
        descricao: 'Excelente autonomia e organização de componentes React.',
        checklistItens: ['Realizou atividades sozinho', 'Desenvolveu habilidade esperada'],
        acaoAcompanhamento: '',
        visivelAluno: true,
        dataComentario: '2026-03-20T16:10:00Z',
      },
      {
        id: 3,
        alunoId: 1,
        professorId: 1,
        disciplinaTurmaId: 1,
        titulo: 'Observação interna de bem-estar',
        tipo: 'SAUDE',
        classificacao: 'NEUTRO',
        descricao: 'Relatou cansaço extremo por turno noturno; acompanhar carga.',
        checklistItens: [],
        acaoAcompanhamento: 'Conversa de acolhimento com docente responsável.',
        visivelAluno: false,
        dataComentario: '2026-03-21T19:00:00Z',
      },
    ],
    planos: [
      {
        id: 1,
        alunoId: 4,
        professorId: 1,
        disciplinaTurmaId: 1,
        dificuldade: 'Baixa frequência e dificuldade em modelagem relacional',
        objetivo: 'Elevar presença acima de 75% e consolidar normalização até 3FN',
        acaoProposta: 'Atendimento em monitoria semanal e entrega de dois estudos dirigidos.',
        dataInicio: '2026-03-18',
        prazo: '2026-04-30',
        status: 'EM_ACOMPANHAMENTO',
        resultado: 'Participou da primeira monitoria.',
      },
    ],
  }
}

function loadDb() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(MOCK_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    }
  } catch {
    // Ignora storage bloqueado
  }
  return createSeedDatabase()
}

let db = loadDb()

function saveDb() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db))
    }
  } catch {
    // Ignora storage bloqueado
  }
}

export function resetMockDb() {
  db = createSeedDatabase()
  saveDb()
}

function problem(status, title, detail, errors = null) {
  return { status, title, detail, errors }
}

function encodeToken(usuario) {
  const payload = JSON.stringify({
    sub: usuario.id,
    email: usuario.email,
    cargo: usuario.cargo,
    professorId: usuario.professorId,
    alunoId: usuario.alunoId,
  })
  return `mock.${encodeURIComponent(payload).replaceAll('.', '%2E')}.sig`
}

function decodeToken(token) {
  if (!token || !String(token).startsWith('mock.')) return null
  try {
    const encoded = String(token).split('.')[1]
    const parsed = JSON.parse(decodeURIComponent(encoded))
    return db.usuarios.find((u) => u.id === parsed.sub) || null
  } catch {
    return null
  }
}

function requireAuth(token) {
  const user = decodeToken(token)
  if (!user) throw problem(401, 'Não autenticado', 'Token ausente ou inválido.')
  if (!user.ativo) throw problem(403, 'Acesso bloqueado', 'Usuário inativo.')
  return user
}

function requireProfessor(user) {
  if (user.cargo !== 'Professor') {
    throw problem(403, 'Acesso negado', 'Apenas docentes podem executar esta operação.')
  }
}

function paginate(items, query = {}) {
  const page = Math.max(0, Number(query.page ?? 0))
  const size = Math.min(100, Math.max(1, Number(query.size ?? 20)))
  const start = page * size
  return {
    content: items.slice(start, start + size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  }
}

function enrichDisciplinaTurma(dt) {
  const disciplina = db.disciplinas.find((d) => d.id === dt.disciplinaId)
  const turma = db.turmas.find((t) => t.id === dt.turmaId)
  const curso = turma ? db.cursos.find((c) => c.id === turma.cursoId) : null
  const periodo = turma ? db.periodos.find((p) => p.id === turma.periodoId) : null
  return {
    disciplinaTurmaId: dt.id,
    turmaId: dt.turmaId,
    turmaNome: turma?.nomeTurma || '',
    cursoId: curso?.id || null,
    cursoNome: curso?.nome || '',
    periodoId: periodo?.id || null,
    disciplina: disciplina
      ? {
          id: disciplina.id,
          nome: disciplina.nome,
          descricao: disciplina.descricao,
          cargaHoraria: disciplina.cargaHoraria,
        }
      : null,
  }
}

function filterContextIds(query = {}) {
  let dts = [...db.disciplinasTurma]
  if (query.cursoId) {
    const turmaIds = db.turmas.filter((t) => t.cursoId === Number(query.cursoId)).map((t) => t.id)
    dts = dts.filter((dt) => turmaIds.includes(dt.turmaId))
  }
  if (query.turmaId) {
    dts = dts.filter((dt) => dt.turmaId === Number(query.turmaId))
  }
  if (query.disciplinaTurmaId) {
    dts = dts.filter((dt) => dt.id === Number(query.disciplinaTurmaId))
  }
  return new Set(dts.map((dt) => dt.id))
}

function computeIndicators(query = {}) {
  const dtIds = filterContextIds(query)
  const aulas = db.aulas.filter(
    (a) =>
      dtIds.has(a.disciplinaTurmaId) &&
      (!query.dataInicio || a.dataAula >= query.dataInicio) &&
      (!query.dataFim || a.dataAula <= query.dataFim) &&
      (!query.periodo || a.dataAula.startsWith(query.periodo)),
  )
  const aulaMap = new Map(aulas.map((a) => [a.id, a]))
  const freqs = db.frequencias.filter(
    (f) => aulaMap.has(f.aulaId) && (!query.alunoId || f.alunoId === Number(query.alunoId)),
  )

  const avaliacoes = db.avaliacoes.filter(
    (av) =>
      dtIds.has(av.disciplinaTurmaId) &&
      (!query.periodoId || av.periodoId === Number(query.periodoId)),
  )
  const avMap = new Map(avaliacoes.map((av) => [av.id, av]))
  const notasRaw = db.alunoAvaliacoes
    .filter((aa) => avMap.has(aa.avaliacaoId) && (!query.alunoId || aa.alunoId === Number(query.alunoId)))
    .map((aa) => {
      const av = avMap.get(aa.avaliacaoId)
      return { ...aa, valorTotal: av.valorTotal, peso: av.peso }
    })

  const comentarios = db.comentarios.filter(
    (c) =>
      (c.disciplinaTurmaId === null || dtIds.has(c.disciplinaTurmaId)) &&
      (!query.alunoId || c.alunoId === Number(query.alunoId)) &&
      (!query.periodo || String(c.dataComentario).startsWith(query.periodo)),
  )

  const alunoIdsComRegistro = [...new Set(freqs.map((f) => f.alunoId))]
  const alertas = []
  let abaixoCorte = 0

  for (const alunoId of alunoIdsComRegistro) {
    const regs = freqs.filter((f) => f.alunoId === alunoId)
    const taxa = calcularTaxaFrequencia(regs)
    const dificuldades = comentarios.filter(
      (c) => c.alunoId === alunoId && (c.classificacao === 'ATENCAO' || c.classificacao === 'NEGATIVO'),
    ).length
    if (taxa !== null && taxa < CORTE_PRESENCA_PERCENTUAL) abaixoCorte += 1
    if ((taxa !== null && taxa < CORTE_PRESENCA_PERCENTUAL) || dificuldades > 0) {
      const aluno = db.alunos.find((a) => a.id === alunoId)
      alertas.push({
        alunoId,
        alunoNome: aluno?.nomeCompleto || `Aluno #${alunoId}`,
        taxaFrequencia: taxa,
        dificuldadesRegistradas: dificuldades,
      })
    }
  }

  const porCategoria = comentarios.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1
    return acc
  }, {})

  return {
    taxaFrequenciaMedia: calcularTaxaFrequencia(freqs),
    percentualAbaixoLimite: alunoIdsComRegistro.length
      ? Math.round((abaixoCorte * 100) / alunoIdsComRegistro.length)
      : null,
    limitePresencaPercentual: CORTE_PRESENCA_PERCENTUAL,
    mediaNotasPonderada: calcularMediaPonderada(notasRaw),
    totalAulasRegistradas: aulas.length,
    totalAlunosAvaliados: new Set(notasRaw.map((n) => n.alunoId)).size,
    totalComentarios: comentarios.length,
    comentariosPorTipo: porCategoria,
    alertas,
  }
}

export async function handleMockRequest({ method = 'GET', path, query = {}, body = {}, token }) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  // 1. Auth
  if (method === 'POST' && cleanPath === '/auth/login') {
    const email = String(body?.email || '').trim().toLowerCase()
    const senha = String(body?.senha || '')
    const user = db.usuarios.find((u) => u.email.toLowerCase() === email && u.senha === senha)
    if (!user) {
      throw problem(401, 'Credenciais inválidas', 'E-mail ou senha incorretos.')
    }
    if (!user.ativo) {
      throw problem(403, 'Usuário inativo', 'Esta conta foi desativada pela instituição.')
    }
    return {
      accessToken: encodeToken(user),
      tokenType: 'Bearer',
      expiresIn: 28800,
      usuario: {
        idUsuario: user.id,
        email: user.email,
        cargo: user.cargo,
        professorId: user.professorId,
        alunoId: user.alunoId,
        nomeCompleto: user.nomeCompleto,
      },
    }
  }

  if (method === 'GET' && cleanPath === '/auth/me') {
    const user = requireAuth(token)
    return {
      idUsuario: user.id,
      email: user.email,
      cargo: user.cargo,
      professorId: user.professorId,
      alunoId: user.alunoId,
      nomeCompleto: user.nomeCompleto,
    }
  }

  if (method === 'POST' && cleanPath === '/auth/logout') {
    requireAuth(token)
    return null
  }

  const user = requireAuth(token)

  // 2. Estrutura Acadêmica
  if (method === 'GET' && cleanPath === '/cursos') {
    let list = db.cursos.map((c) => {
      const turmaIds = db.turmas.filter((t) => t.cursoId === c.id).map((t) => t.id)
      const totalAlunos = new Set(
        db.matriculas.filter((m) => turmaIds.includes(m.turmaId) && m.status === 'ATIVA').map((m) => m.alunoId),
      ).size
      return { ...c, totalAlunos }
    })

    if (query.somenteMeus === true || query.somenteMeus === 'true') {
      if (user.cargo === 'Professor') {
        const dtIds = db.professorDisciplinasTurma
          .filter((p) => p.professorId === user.professorId)
          .map((p) => p.disciplinaTurmaId)
        const turmaIds = db.disciplinasTurma.filter((dt) => dtIds.includes(dt.id)).map((dt) => dt.turmaId)
        const cursoIds = new Set(db.turmas.filter((t) => turmaIds.includes(t.id)).map((t) => t.cursoId))
        list = list.filter((c) => cursoIds.has(c.id))
      }
    }
    if (query.status && query.status !== 'Todos') {
      list = list.filter((c) => c.status === query.status)
    }
    if (query.q) {
      const q = String(query.q).toLocaleLowerCase('pt-BR')
      list = list.filter((c) => `${c.nome} ${c.descricao}`.toLocaleLowerCase('pt-BR').includes(q))
    }
    if (query.sort === 'nome_desc') list.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'))
    else if (query.sort === 'alunos_desc') list.sort((a, b) => b.totalAlunos - a.totalAlunos)
    else list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

    return paginate(list, query)
  }

  if (method === 'GET' && cleanPath === '/periodos') {
    return db.periodos
  }

  let match
  if (method === 'GET' && (match = cleanPath.match(/^\/cursos\/(\d+)\/turmas$/))) {
    const cursoId = Number(match[1])
    if (!db.cursos.some((c) => c.id === cursoId)) {
      throw problem(404, 'Curso não encontrado', `Curso ${cursoId} não existe.`)
    }
    return db.turmas.filter((t) => t.cursoId === cursoId && (!query.periodoId || t.periodoId === Number(query.periodoId)))
  }

  if (method === 'GET' && (match = cleanPath.match(/^\/turmas\/(\d+)\/disciplinas$/))) {
    const turmaId = Number(match[1])
    if (!db.turmas.some((t) => t.id === turmaId)) {
      throw problem(404, 'Turma não encontrada', `Turma ${turmaId} não existe.`)
    }
    return db.disciplinasTurma.filter((dt) => dt.turmaId === turmaId).map(enrichDisciplinaTurma)
  }

  if (method === 'GET' && (match = cleanPath.match(/^\/turmas\/(\d+)\/alunos$/))) {
    requireProfessor(user)
    const turmaId = Number(match[1])
    const status = query.status || 'ATIVA'
    const mats = db.matriculas.filter((m) => m.turmaId === turmaId && m.status === status)
    return mats.map((m) => {
      const a = db.alunos.find((item) => item.id === m.alunoId)
      return {
        alunoId: a.id,
        matriculaId: m.id,
        nomeCompleto: a.nomeCompleto,
        matriculaEscolar: a.matriculaEscolar,
        statusMatricula: m.status,
      }
    })
  }

  if (method === 'GET' && cleanPath === '/alunos') {
    requireProfessor(user)
    let list = db.alunos.map((a) => {
      const mats = db.matriculas.filter((m) => m.alunoId === a.id && m.status === 'ATIVA')
      const turmaIds = mats.map((m) => m.turmaId)
      const cursoIds = db.turmas.filter((t) => turmaIds.includes(t.id)).map((t) => t.cursoId)
      return { ...a, turmaIds, cursoIds }
    })
    if (query.turmaId) list = list.filter((a) => a.turmaIds.includes(Number(query.turmaId)))
    if (query.cursoId) list = list.filter((a) => a.cursoIds.includes(Number(query.cursoId)))
    if (query.q) {
      const q = String(query.q).toLocaleLowerCase('pt-BR')
      list = list.filter((a) => `${a.nomeCompleto} ${a.matriculaEscolar}`.toLocaleLowerCase('pt-BR').includes(q))
    }
    return paginate(list, query)
  }

  // 3. Aulas e Frequência
  if (method === 'GET' && cleanPath === '/aulas') {
    let list = [...db.aulas]
    if (query.disciplinaTurmaId) list = list.filter((a) => a.disciplinaTurmaId === Number(query.disciplinaTurmaId))
    if (query.professorId) list = list.filter((a) => a.professorId === Number(query.professorId))
    if (query.status) list = list.filter((a) => a.status === query.status)
    if (query.periodo) list = list.filter((a) => a.dataAula.startsWith(query.periodo))
    list = list.map((a) => {
      const dt = enrichDisciplinaTurma(db.disciplinasTurma.find((d) => d.id === a.disciplinaTurmaId))
      const prof = db.professores.find((p) => p.id === a.professorId)
      return {
        ...a,
        disciplinaNome: dt?.disciplina?.nome || '',
        turmaNome: dt?.turmaNome || '',
        turmaId: dt?.turmaId || null,
        professorNome: prof?.nomeCompleto || '',
      }
    })
    list.sort((a, b) => b.dataAula.localeCompare(a.dataAula) || b.id - a.id)
    return paginate(list, query)
  }

  if (method === 'POST' && cleanPath === '/aulas') {
    requireProfessor(user)
    if (!body.disciplinaTurmaId || !body.dataAula || !body.horarioInicio || !body.horarioFim) {
      throw problem(400, 'Dados inválidos', 'Campos obrigatórios da aula ausentes.')
    }
    if (body.horarioFim <= body.horarioInicio) {
      throw problem(422, 'Horário inválido', 'O horário final deve ser posterior ao inicial.', {
        horarioFim: 'Deve ser maior que o horário de início.',
      })
    }
    const aula = {
      id: db.nextIds.aula++,
      disciplinaTurmaId: Number(body.disciplinaTurmaId),
      professorId: user.professorId,
      dataAula: body.dataAula,
      horarioInicio: body.horarioInicio,
      horarioFim: body.horarioFim,
      conteudo: body.conteudo || '',
      status: body.status || 'PLANEJADA',
    }
    db.aulas.push(aula)
    saveDb()
    return aula
  }

  if (method === 'PUT' && (match = cleanPath.match(/^\/aulas\/(\d+)$/))) {
    requireProfessor(user)
    const id = Number(match[1])
    const aula = db.aulas.find((a) => a.id === id)
    if (!aula) throw problem(404, 'Aula não encontrada', `Aula ${id} não existe.`)
    if (body.horarioFim && body.horarioInicio && body.horarioFim <= body.horarioInicio) {
      throw problem(422, 'Horário inválido', 'O horário final deve ser posterior ao inicial.')
    }
    Object.assign(aula, {
      dataAula: body.dataAula ?? aula.dataAula,
      horarioInicio: body.horarioInicio ?? aula.horarioInicio,
      horarioFim: body.horarioFim ?? aula.horarioFim,
      conteudo: body.conteudo ?? aula.conteudo,
      status: body.status ?? aula.status,
    })
    saveDb()
    return aula
  }

  if (method === 'PATCH' && (match = cleanPath.match(/^\/aulas\/(\d+)\/realizar$/))) {
    requireProfessor(user)
    const id = Number(match[1])
    const aula = db.aulas.find((a) => a.id === id)
    if (!aula) throw problem(404, 'Aula não encontrada', `Aula ${id} não existe.`)
    if (aula.status === 'CANCELADA') {
      throw problem(422, 'Transição inválida', 'Não é possível realizar uma aula cancelada.')
    }
    const conteudoFinal = body?.conteudo !== undefined ? String(body.conteudo).trim() : String(aula.conteudo || '').trim()
    if (!conteudoFinal) {
      throw problem(422, 'Conteúdo obrigatório', 'Informe o conteúdo ministrado para marcar a aula como realizada.', {
        conteudo: 'O conteúdo é obrigatório para realizar a aula.',
      })
    }
    aula.conteudo = conteudoFinal
    aula.status = 'REALIZADA'
    saveDb()
    return aula
  }

  if (method === 'PATCH' && (match = cleanPath.match(/^\/aulas\/(\d+)\/cancelar$/))) {
    requireProfessor(user)
    const id = Number(match[1])
    const aula = db.aulas.find((a) => a.id === id)
    if (!aula) throw problem(404, 'Aula não encontrada', `Aula ${id} não existe.`)
    if (aula.status === 'REALIZADA') {
      throw problem(422, 'Transição inválida', 'Não é possível cancelar uma aula já realizada.')
    }
    aula.status = 'CANCELADA'
    saveDb()
    return aula
  }

  if (method === 'GET' && (match = cleanPath.match(/^\/aulas\/(\d+)\/frequencias$/))) {
    const aulaId = Number(match[1])
    if (!db.aulas.some((a) => a.id === aulaId)) {
      throw problem(404, 'Aula não encontrada', `Aula ${aulaId} não existe.`)
    }
    let rows = db.frequencias.filter((f) => f.aulaId === aulaId)
    if (user.cargo === 'Aluno') rows = rows.filter((f) => f.alunoId === user.alunoId)
    return rows.map((f) => ({
      ...f,
      alunoNome: db.alunos.find((a) => a.id === f.alunoId)?.nomeCompleto || '',
    }))
  }

  if (method === 'POST' && (match = cleanPath.match(/^\/aulas\/(\d+)\/frequencias$/))) {
    requireProfessor(user)
    const aulaId = Number(match[1])
    if (!db.aulas.some((a) => a.id === aulaId)) {
      throw problem(404, 'Aula não encontrada', `Aula ${aulaId} não existe.`)
    }
    const itens = Array.isArray(body?.itens) ? body.itens : []
    if (!itens.length) {
      throw problem(400, 'Lista vazia', 'Selecione ao menos um aluno para registrar a chamada.')
    }
    const vistos = new Set()
    for (const item of itens) {
      const aid = Number(item.alunoId)
      if (vistos.has(aid)) {
        throw problem(409, 'Aluno duplicado', `O aluno ${aid} apareceu mais de uma vez na chamada.`)
      }
      vistos.add(aid)
    }

    const resultados = []
    for (const item of itens) {
      const alunoId = Number(item.alunoId)
      const statusPresenca = item.statusPresenca || STATUS_PRESENCA.PRESENTE
      const presente = isPresencaContabilizada({ statusPresenca })
      const existente = db.frequencias.find((f) => f.aulaId === aulaId && f.alunoId === alunoId)
      if (existente) {
        Object.assign(existente, {
          statusPresenca,
          presente,
          justificativa: item.justificativa || '',
          checklistAula: Array.isArray(item.checklistAula) ? item.checklistAula : [],
          observacao: item.observacao || '',
        })
        resultados.push({ ...existente, alunoNome: db.alunos.find((a) => a.id === alunoId)?.nomeCompleto || '' })
      } else {
        const novo = {
          id: db.nextIds.frequencia++,
          aulaId,
          alunoId,
          statusPresenca,
          presente,
          justificativa: item.justificativa || '',
          checklistAula: Array.isArray(item.checklistAula) ? item.checklistAula : [],
          observacao: item.observacao || '',
        }
        db.frequencias.push(novo)
        resultados.push({ ...novo, alunoNome: db.alunos.find((a) => a.id === alunoId)?.nomeCompleto || '' })
      }
    }
    saveDb()
    return resultados
  }

  if (method === 'PUT' && (match = cleanPath.match(/^\/frequencias\/(\d+)$/))) {
    requireProfessor(user)
    const id = Number(match[1])
    const freq = db.frequencias.find((f) => f.id === id)
    if (!freq) throw problem(404, 'Frequência não encontrada', `Registro ${id} não existe.`)
    const statusPresenca = body.statusPresenca || freq.statusPresenca
    Object.assign(freq, {
      statusPresenca,
      presente: isPresencaContabilizada({ statusPresenca }),
      justificativa: body.justificativa ?? freq.justificativa,
      checklistAula: body.checklistAula ?? freq.checklistAula,
      observacao: body.observacao ?? freq.observacao,
    })
    saveDb()
    return { ...freq, alunoNome: db.alunos.find((a) => a.id === freq.alunoId)?.nomeCompleto || '' }
  }

  // 4. Avaliações e Notas
  if (method === 'GET' && cleanPath === '/avaliacoes') {
    let list = [...db.avaliacoes]
    if (query.disciplinaTurmaId) list = list.filter((a) => a.disciplinaTurmaId === Number(query.disciplinaTurmaId))
    if (query.professorId) list = list.filter((a) => a.professorId === Number(query.professorId))
    if (query.periodoId) list = list.filter((a) => a.periodoId === Number(query.periodoId))
    if (query.status) list = list.filter((a) => a.status === query.status)
    list = list.map((av) => {
      const dt = enrichDisciplinaTurma(db.disciplinasTurma.find((d) => d.id === av.disciplinaTurmaId))
      return {
        ...av,
        disciplinaNome: dt?.disciplina?.nome || '',
        turmaNome: dt?.turmaNome || '',
        turmaId: dt?.turmaId || null,
      }
    })
    return paginate(list, query)
  }

  if (method === 'POST' && cleanPath === '/avaliacoes') {
    requireProfessor(user)
    if (!body.nomeAvaliacao || Number(body.valorTotal) <= 0 || Number(body.peso) <= 0) {
      throw problem(422, 'Dados da avaliação inválidos', 'Informe nome válido, valor total positivo e peso positivo.', {
        valorTotal: Number(body.valorTotal) <= 0 ? 'Deve ser maior que zero.' : undefined,
        peso: Number(body.peso) <= 0 ? 'Deve ser maior que zero.' : undefined,
      })
    }
    const nova = {
      id: db.nextIds.avaliacao++,
      disciplinaTurmaId: Number(body.disciplinaTurmaId),
      professorId: user.professorId,
      periodoId: Number(body.periodoId || 1),
      nomeAvaliacao: body.nomeAvaliacao,
      tipoAvaliacao: body.tipoAvaliacao || 'PROVA',
      descricao: body.descricao || '',
      dataAvaliacao: body.dataAvaliacao,
      valorTotal: Number(body.valorTotal),
      peso: Number(body.peso),
      status: body.status || 'PLANEJADA',
    }
    db.avaliacoes.push(nova)
    saveDb()
    return nova
  }

  if (method === 'PUT' && (match = cleanPath.match(/^\/avaliacoes\/(\d+)$/))) {
    requireProfessor(user)
    const id = Number(match[1])
    const av = db.avaliacoes.find((a) => a.id === id)
    if (!av) throw problem(404, 'Avaliação não encontrada', `Avaliação ${id} não existe.`)
    if (Number(body.valorTotal ?? av.valorTotal) <= 0 || Number(body.peso ?? av.peso) <= 0) {
      throw problem(422, 'Valores inválidos', 'Valor total e peso devem ser maiores que zero.')
    }
    Object.assign(av, {
      nomeAvaliacao: body.nomeAvaliacao ?? av.nomeAvaliacao,
      tipoAvaliacao: body.tipoAvaliacao ?? av.tipoAvaliacao,
      descricao: body.descricao ?? av.descricao,
      dataAvaliacao: body.dataAvaliacao ?? av.dataAvaliacao,
      valorTotal: body.valorTotal !== undefined ? Number(body.valorTotal) : av.valorTotal,
      peso: body.peso !== undefined ? Number(body.peso) : av.peso,
      status: body.status ?? av.status,
    })
    saveDb()
    return av
  }

  if (method === 'PATCH' && (match = cleanPath.match(/^\/avaliacoes\/(\d+)\/corrigir$/))) {
    requireProfessor(user)
    const id = Number(match[1])
    const av = db.avaliacoes.find((a) => a.id === id)
    if (!av) throw problem(404, 'Avaliação não encontrada', `Avaliação ${id} não existe.`)
    if (av.status === 'CANCELADA') {
      throw problem(422, 'Operação inválida', 'Não é possível corrigir uma avaliação cancelada.')
    }
    av.status = 'CORRIGIDA'
    saveDb()
    return av
  }

  if (method === 'GET' && (match = cleanPath.match(/^\/avaliacoes\/(\d+)\/notas$/))) {
    const avaliacaoId = Number(match[1])
    const av = db.avaliacoes.find((a) => a.id === avaliacaoId)
    if (!av) throw problem(404, 'Avaliação não encontrada', `Avaliação ${avaliacaoId} não existe.`)
    let rows = db.alunoAvaliacoes.filter((n) => n.avaliacaoId === avaliacaoId)
    if (user.cargo === 'Aluno') rows = rows.filter((n) => n.alunoId === user.alunoId)
    return rows.map((n) => ({
      ...n,
      alunoNome: db.alunos.find((a) => a.id === n.alunoId)?.nomeCompleto || '',
      valorTotal: av.valorTotal,
    }))
  }

  if (method === 'PUT' && (match = cleanPath.match(/^\/avaliacoes\/(\d+)\/notas\/(\d+)$/))) {
    requireProfessor(user)
    const avaliacaoId = Number(match[1])
    const alunoId = Number(match[2])
    const av = db.avaliacoes.find((a) => a.id === avaliacaoId)
    if (!av) throw problem(404, 'Avaliação não encontrada', `Avaliação ${avaliacaoId} não existe.`)
    const notaNum = Number(body.nota)
    if (!Number.isFinite(notaNum) || notaNum < 0 || notaNum > av.valorTotal) {
      throw problem(422, 'Nota fora do intervalo', `A nota deve estar entre 0 e ${av.valorTotal}.`, {
        nota: `A nota deve estar entre 0 e ${av.valorTotal}.`,
      })
    }
    let reg = db.alunoAvaliacoes.find((n) => n.avaliacaoId === avaliacaoId && n.alunoId === alunoId)
    if (reg) {
      reg.nota = notaNum
      reg.observacao = body.observacao ?? reg.observacao
    } else {
      reg = {
        id: db.nextIds.alunoAvaliacao++,
        avaliacaoId,
        alunoId,
        nota: notaNum,
        observacao: body.observacao || '',
      }
      db.alunoAvaliacoes.push(reg)
    }
    saveDb()
    return {
      ...reg,
      alunoNome: db.alunos.find((a) => a.id === alunoId)?.nomeCompleto || '',
      valorTotal: av.valorTotal,
    }
  }

  // 5. Comentários e Planos de Acompanhamento
  if (method === 'GET' && cleanPath === '/comentarios') {
    let list = [...db.comentarios]
    if (user.cargo === 'Aluno') {
      list = list.filter((c) => c.alunoId === user.alunoId && c.visivelAluno === true)
    }
    if (query.alunoId) list = list.filter((c) => c.alunoId === Number(query.alunoId))
    if (query.professorId) list = list.filter((c) => c.professorId === Number(query.professorId))
    if (query.disciplinaTurmaId) list = list.filter((c) => c.disciplinaTurmaId === Number(query.disciplinaTurmaId))
    if (query.tipo) list = list.filter((c) => c.tipo === query.tipo)
    if (query.classificacao) list = list.filter((c) => c.classificacao === query.classificacao)

    list = list.map((c) => {
      const dt = c.disciplinaTurmaId
        ? enrichDisciplinaTurma(db.disciplinasTurma.find((d) => d.id === c.disciplinaTurmaId))
        : null
      return {
        ...c,
        alunoNome: db.alunos.find((a) => a.id === c.alunoId)?.nomeCompleto || '',
        professorNome: db.professores.find((p) => p.id === c.professorId)?.nomeCompleto || '',
        disciplinaNome: dt?.disciplina?.nome || 'Geral',
        turmaNome: dt?.turmaNome || '',
      }
    })
    list.sort((a, b) => String(b.dataComentario).localeCompare(String(a.dataComentario)))
    return paginate(list, query)
  }

  if (method === 'POST' && cleanPath === '/comentarios') {
    requireProfessor(user)
    if (!body.alunoId || !body.titulo || !body.descricao) {
      throw problem(400, 'Dados inválidos', 'Aluno, título e descrição são obrigatórios.')
    }
    const novo = {
      id: db.nextIds.comentario++,
      alunoId: Number(body.alunoId),
      professorId: user.professorId,
      disciplinaTurmaId: body.disciplinaTurmaId ? Number(body.disciplinaTurmaId) : null,
      titulo: body.titulo,
      tipo: body.tipo || 'DESEMPENHO',
      classificacao: body.classificacao || 'NEUTRO',
      descricao: body.descricao,
      checklistItens: Array.isArray(body.checklistItens) ? body.checklistItens : [],
      acaoAcompanhamento: body.acaoAcompanhamento || '',
      visivelAluno: Boolean(body.visivelAluno ?? false),
      dataComentario: new Date().toISOString(),
    }
    db.comentarios.push(novo)
    saveDb()
    return {
      ...novo,
      alunoNome: db.alunos.find((a) => a.id === novo.alunoId)?.nomeCompleto || '',
      professorNome: user.nomeCompleto,
    }
  }

  if (method === 'PUT' && (match = cleanPath.match(/^\/comentarios\/(\d+)$/))) {
    requireProfessor(user)
    const id = Number(match[1])
    const com = db.comentarios.find((c) => c.id === id)
    if (!com) throw problem(404, 'Comentário não encontrado', `Comentário ${id} não existe.`)
    Object.assign(com, {
      titulo: body.titulo ?? com.titulo,
      tipo: body.tipo ?? com.tipo,
      classificacao: body.classificacao ?? com.classificacao,
      descricao: body.descricao ?? com.descricao,
      checklistItens: body.checklistItens ?? com.checklistItens,
      acaoAcompanhamento: body.acaoAcompanhamento ?? com.acaoAcompanhamento,
      visivelAluno: body.visivelAluno !== undefined ? Boolean(body.visivelAluno) : com.visivelAluno,
    })
    saveDb()
    return com
  }

  if (method === 'GET' && cleanPath === '/planos-acompanhamento') {
    requireProfessor(user)
    let list = [...db.planos]
    if (query.alunoId) list = list.filter((p) => p.alunoId === Number(query.alunoId))
    if (query.disciplinaTurmaId) list = list.filter((p) => p.disciplinaTurmaId === Number(query.disciplinaTurmaId))
    return list.map((p) => ({
      ...p,
      alunoNome: db.alunos.find((a) => a.id === p.alunoId)?.nomeCompleto || '',
    }))
  }

  if (method === 'POST' && cleanPath === '/planos-acompanhamento') {
    requireProfessor(user)
    if (body.prazo && body.dataInicio && body.prazo < body.dataInicio) {
      throw problem(422, 'Prazo inválido', 'O prazo deve ser igual ou posterior à data de início.', {
        prazo: 'O prazo não pode ser anterior à data de início.',
      })
    }
    const plano = {
      id: db.nextIds.plano++,
      alunoId: Number(body.alunoId),
      professorId: user.professorId,
      disciplinaTurmaId: body.disciplinaTurmaId ? Number(body.disciplinaTurmaId) : null,
      dificuldade: body.dificuldade,
      objetivo: body.objetivo,
      acaoProposta: body.acaoProposta,
      dataInicio: body.dataInicio,
      prazo: body.prazo,
      status: body.status || 'PENDENTE',
      resultado: body.resultado || '',
    }
    db.planos.push(plano)
    saveDb()
    return {
      ...plano,
      alunoNome: db.alunos.find((a) => a.id === plano.alunoId)?.nomeCompleto || '',
    }
  }

  if (method === 'PUT' && (match = cleanPath.match(/^\/planos-acompanhamento\/(\d+)$/))) {
    requireProfessor(user)
    const id = Number(match[1])
    const plano = db.planos.find((p) => p.id === id)
    if (!plano) throw problem(404, 'Plano não encontrado', `Plano ${id} não existe.`)
    const inicio = body.dataInicio ?? plano.dataInicio
    const prazo = body.prazo ?? plano.prazo
    if (prazo < inicio) {
      throw problem(422, 'Prazo inválido', 'O prazo não pode ser anterior ao início.')
    }
    Object.assign(plano, {
      dificuldade: body.dificuldade ?? plano.dificuldade,
      objetivo: body.objetivo ?? plano.objetivo,
      acaoProposta: body.acaoProposta ?? plano.acaoProposta,
      dataInicio: inicio,
      prazo,
      status: body.status ?? plano.status,
      resultado: body.resultado ?? plano.resultado,
    })
    saveDb()
    return plano
  }

  // 6. Indicadores, Relatórios e Área do Aluno
  if (method === 'GET' && cleanPath === '/indicadores/desempenho') {
    requireProfessor(user)
    return computeIndicators(query)
  }

  if (method === 'GET' && cleanPath === '/relatorios/academico') {
    requireProfessor(user)
    const indicadores = computeIndicators(query)
    const dtIds = filterContextIds(query)
    const aulas = db.aulas.filter(
      (a) => dtIds.has(a.disciplinaTurmaId) && (!query.periodo || a.dataAula.startsWith(query.periodo)),
    )
    const aulaMap = new Map(aulas.map((a) => [a.id, a]))

    const frequencias = db.frequencias
      .filter((f) => aulaMap.has(f.aulaId) && (!query.alunoId || f.alunoId === Number(query.alunoId)))
      .map((f) => {
        const aula = aulaMap.get(f.aulaId)
        const dt = enrichDisciplinaTurma(db.disciplinasTurma.find((d) => d.id === aula.disciplinaTurmaId))
        return {
          ...f,
          alunoNome: db.alunos.find((a) => a.id === f.alunoId)?.nomeCompleto || '',
          dataAula: aula.dataAula,
          disciplinaNome: dt?.disciplina?.nome || '',
          turmaNome: dt?.turmaNome || '',
        }
      })

    const avaliacoes = db.avaliacoes.filter((av) => dtIds.has(av.disciplinaTurmaId))
    const avMap = new Map(avaliacoes.map((av) => [av.id, av]))
    const notas = db.alunoAvaliacoes
      .filter((n) => avMap.has(n.avaliacaoId) && (!query.alunoId || n.alunoId === Number(query.alunoId)))
      .map((n) => {
        const av = avMap.get(n.avaliacaoId)
        const dt = enrichDisciplinaTurma(db.disciplinasTurma.find((d) => d.id === av.disciplinaTurmaId))
        return {
          ...n,
          alunoNome: db.alunos.find((a) => a.id === n.alunoId)?.nomeCompleto || '',
          avaliacaoNome: av.nomeAvaliacao,
          dataAvaliacao: av.dataAvaliacao,
          valorTotal: av.valorTotal,
          peso: av.peso,
          disciplinaNome: dt?.disciplina?.nome || '',
          turmaNome: dt?.turmaNome || '',
        }
      })

    const comentarios = db.comentarios
      .filter(
        (c) =>
          (c.disciplinaTurmaId === null || dtIds.has(c.disciplinaTurmaId)) &&
          (!query.alunoId || c.alunoId === Number(query.alunoId)) &&
          (!query.periodo || String(c.dataComentario).startsWith(query.periodo)),
      )
      .map((c) => {
        const dt = c.disciplinaTurmaId
          ? enrichDisciplinaTurma(db.disciplinasTurma.find((d) => d.id === c.disciplinaTurmaId))
          : null
        return {
          ...c,
          alunoNome: db.alunos.find((a) => a.id === c.alunoId)?.nomeCompleto || '',
          disciplinaNome: dt?.disciplina?.nome || 'Geral',
          turmaNome: dt?.turmaNome || '',
        }
      })

    return {
      indicadores,
      frequencias,
      notas,
      comentarios,
      emitidoEm: new Date().toISOString(),
    }
  }

  if (method === 'GET' && cleanPath === '/me/desempenho') {
    if (user.cargo !== 'Aluno') {
      throw problem(403, 'Acesso restrito', 'Esta rota é exclusiva para o perfil Aluno.')
    }
    const aluno = db.alunos.find((a) => a.id === user.alunoId)
    const matriculas = db.matriculas
      .filter((m) => m.alunoId === user.alunoId)
      .map((m) => {
        const turma = db.turmas.find((t) => t.id === m.turmaId)
        const curso = turma ? db.cursos.find((c) => c.id === turma.cursoId) : null
        const periodo = turma ? db.periodos.find((p) => p.id === turma.periodoId) : null
        return {
          id: m.id,
          status: m.status,
          turmaNome: turma?.nomeTurma || '',
          cursoNome: curso?.nome || '',
          periodoNome: periodo?.nomePeriodo || '',
        }
      })

    const frequencias = db.frequencias
      .filter((f) => f.alunoId === user.alunoId)
      .map((f) => {
        const aula = db.aulas.find((a) => a.id === f.aulaId)
        const dt = aula ? enrichDisciplinaTurma(db.disciplinasTurma.find((d) => d.id === aula.disciplinaTurmaId)) : null
        return {
          ...f,
          dataAula: aula?.dataAula || '',
          conteudo: aula?.conteudo || '',
          disciplinaNome: dt?.disciplina?.nome || '',
        }
      })

    const notas = db.alunoAvaliacoes
      .filter((n) => n.alunoId === user.alunoId)
      .map((n) => {
        const av = db.avaliacoes.find((a) => a.id === n.avaliacaoId)
        const dt = av ? enrichDisciplinaTurma(db.disciplinasTurma.find((d) => d.id === av.disciplinaTurmaId)) : null
        return {
          ...n,
          avaliacaoNome: av?.nomeAvaliacao || '',
          tipoAvaliacao: av?.tipoAvaliacao || '',
          dataAvaliacao: av?.dataAvaliacao || '',
          valorTotal: av?.valorTotal || 10,
          peso: av?.peso || 1,
          disciplinaNome: dt?.disciplina?.nome || '',
        }
      })

    const comentariosVisiveis = db.comentarios
      .filter((c) => c.alunoId === user.alunoId && c.visivelAluno === true)
      .map((c) => ({
        ...c,
        professorNome: db.professores.find((p) => p.id === c.professorId)?.nomeCompleto || '',
      }))

    const faltas = frequencias.filter((f) => !isPresencaContabilizada(f)).length
    const atrasos = frequencias.filter((f) => f.statusPresenca === STATUS_PRESENCA.ATRASO).length

    return {
      aluno,
      matriculas,
      taxaFrequencia: calcularTaxaFrequencia(frequencias),
      mediaPonderada: calcularMediaPonderada(notas),
      totalFaltas: faltas,
      totalAtrasos: atrasos,
      frequencias,
      notas,
      comentarios: comentariosVisiveis,
    }
  }

  throw problem(404, 'Endpoint não encontrado', `Rota ${method} /api/v1${cleanPath} não mapeada.`)
}
