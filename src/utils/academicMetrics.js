import { STATUS_PRESENCA, STATUS_PRESENCA_LABELS } from './checklists.js'

/**
 * Define se um status de frequência conta como comparecimento oficial.
 * Regra confirmada: PRESENTE e ATRASO contam como presença;
 * AUSENTE e FALTA_JUSTIFICADA contam como ausência nos indicadores.
 */
export function isPresencaContabilizada(item) {
  if (!item) return false
  if (item.statusPresenca) {
    return (
      item.statusPresenca === STATUS_PRESENCA.PRESENTE ||
      item.statusPresenca === STATUS_PRESENCA.ATRASO
    )
  }
  return Boolean(item.presente)
}

/**
 * Calcula a taxa percentual inteira de presença (0-100), ou null quando não há registros.
 */
export function calcularTaxaFrequencia(registros) {
  if (!Array.isArray(registros) || registros.length === 0) return null
  const presencas = registros.filter(isPresencaContabilizada).length
  return Math.round((presencas * 100) / registros.length)
}

/**
 * Calcula média ponderada normalizada na escala 0-10 a partir de notas lançadas.
 * Cada item deve informar { nota, valorTotal, peso }. Itens com nota null/undefined são ignorados.
 */
export function calcularMediaPonderada(itens) {
  if (!Array.isArray(itens) || itens.length === 0) return null
  let somaPonderada = 0
  let somaPesos = 0

  for (const item of itens) {
    if (item?.nota === null || item?.nota === undefined || item?.nota === '') continue
    const nota = Number(item.nota)
    const valorTotal = Number(item.valorTotal || 10)
    const peso = Number(item.peso ?? 1)
    if (!Number.isFinite(nota) || !Number.isFinite(valorTotal) || valorTotal <= 0 || peso <= 0) {
      continue
    }
    const normalizada = (nota / valorTotal) * 10
    somaPonderada += normalizada * peso
    somaPesos += peso
  }

  if (somaPesos === 0) return null
  return Number((somaPonderada / somaPesos).toFixed(2))
}

export function formatarPercentual(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—'
  return `${Math.round(Number(valor))}%`
}

export function formatarNota(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—'
  return Number(valor).toFixed(1).replace('.', ',')
}

/**
 * Gera CSV com BOM UTF-8 e separador ponto-e-vírgula compatível com Excel em pt-BR.
 */
export function buildAcademicReportCsv({
  frequencias = [],
  comentarios = [],
  notas = [],
  cursoNome = 'Todos os cursos',
} = {}) {
  const linhas = [
    ['Tipo', 'Aluno', 'Curso', 'Turma', 'Disciplina', 'Data', 'Situação/Categoria', 'Detalhes'],
  ]

  for (const item of frequencias) {
    const situacao = STATUS_PRESENCA_LABELS[item.statusPresenca] || item.statusPresenca || '-'
    const detalhes = [item.justificativa, item.observacao].filter(Boolean).join(' · ')
    linhas.push([
      'Frequência',
      item.alunoNome || '',
      cursoNome,
      item.turmaNome || '',
      item.disciplinaNome || '',
      item.dataAula || '',
      situacao,
      detalhes,
    ])
  }

  for (const item of notas) {
    linhas.push([
      'Avaliação',
      item.alunoNome || '',
      cursoNome,
      item.turmaNome || '',
      item.disciplinaNome || '',
      item.dataAvaliacao || '',
      item.avaliacaoNome || '',
      item.nota === null || item.nota === undefined
        ? 'Sem nota'
        : `${item.nota}/${item.valorTotal}${item.observacao ? ` · ${item.observacao}` : ''}`,
    ])
  }

  for (const item of comentarios) {
    linhas.push([
      'Comentário Pedagógico',
      item.alunoNome || '',
      cursoNome,
      item.turmaNome || '',
      item.disciplinaNome || 'Geral',
      String(item.dataComentario || '').slice(0, 10),
      `${item.tipo || ''} (${item.classificacao || 'NEUTRO'})`,
      [item.titulo, item.descricao, item.acaoAcompanhamento].filter(Boolean).join(' · '),
    ])
  }

  return `\uFEFF${linhas
    .map((linha) =>
      linha.map((celula) => `"${String(celula ?? '').replaceAll('"', '""')}"`).join(';'),
    )
    .join('\r\n')}`
}
