/**
 * Constantes canônicas compartilhadas entre formulários, serviços e visualizações.
 */

export const STATUS_PRESENCA = {
  PRESENTE: 'PRESENTE',
  AUSENTE: 'AUSENTE',
  FALTA_JUSTIFICADA: 'FALTA_JUSTIFICADA',
  ATRASO: 'ATRASO',
}

export const STATUS_PRESENCA_OPCOES = [
  { value: STATUS_PRESENCA.PRESENTE, label: 'Presente' },
  { value: STATUS_PRESENCA.AUSENTE, label: 'Ausente' },
  { value: STATUS_PRESENCA.FALTA_JUSTIFICADA, label: 'Falta justificada' },
  { value: STATUS_PRESENCA.ATRASO, label: 'Atraso' },
]

export const STATUS_PRESENCA_LABELS = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  FALTA_JUSTIFICADA: 'Falta justificada',
  ATRASO: 'Atraso',
}

export const CHECKLIST_AULA = [
  'Participou da aula',
  'Realizou as atividades propostas',
  'Participou em grupo',
  'Apresentou dificuldade',
  'Necessitou de acompanhamento',
  'Entregou atividade solicitada',
]

export const CHECKLIST_APRENDIZAGEM = [
  'Compreendeu o conteúdo',
  'Realizou atividades sozinho',
  'Necessitou de auxílio',
  'Demonstrou evolução',
  'Participou das atividades',
  'Apresentou dificuldade',
  'Desenvolveu habilidade esperada',
]

export const TIPOS_COMENTARIO = [
  { value: 'COMPORTAMENTO', label: 'Comportamento' },
  { value: 'DESEMPENHO', label: 'Desempenho' },
  { value: 'SAUDE', label: 'Saúde' },
  { value: 'SOCIAL', label: 'Social' },
]

export const CLASSIFICACOES_COMENTARIO = [
  { value: 'POSITIVO', label: 'Positivo' },
  { value: 'NEUTRO', label: 'Neutro' },
  { value: 'ATENCAO', label: 'Atenção' },
  { value: 'NEGATIVO', label: 'Negativo' },
]

export const TIPOS_AVALIACAO = [
  { value: 'PROVA', label: 'Prova' },
  { value: 'TRABALHO', label: 'Trabalho' },
  { value: 'SEMINARIO', label: 'Seminário' },
  { value: 'PROJETO', label: 'Projeto' },
  { value: 'CONTINUA', label: 'Contínua' },
]

export const STATUS_PLANO = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ACOMPANHAMENTO', label: 'Em acompanhamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
]

export const CORTE_PRESENCA_PERCENTUAL = 75
