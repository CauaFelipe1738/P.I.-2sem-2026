export function LoadingState({ label = 'Carregando dados...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center"
    >
      <span className="loading-spinner" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  )
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null
  const message =
    typeof error === 'string'
      ? error
      : error.detail || error.title || error.message || 'Ocorreu um erro inesperado.'

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      <div>
        <strong className="font-semibold">{error.title || 'Não foi possível concluir'}</strong>
        <p className="mt-0.5 text-xs text-rose-800">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e65c2]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

const BADGE_VARIANTS = {
  ATIVO: 'bg-emerald-50 text-emerald-700',
  ATIVA: 'bg-emerald-50 text-emerald-700',
  REALIZADA: 'bg-emerald-50 text-emerald-700',
  CORRIGIDA: 'bg-emerald-50 text-emerald-700',
  CONCLUIDO: 'bg-emerald-50 text-emerald-700',
  CONCLUIDA: 'bg-emerald-50 text-emerald-700',
  BAIXO: 'bg-emerald-50 text-emerald-700',
  POSITIVO: 'bg-emerald-50 text-emerald-700',
  PRESENTE: 'bg-emerald-50 text-emerald-700',
  PLANEJADA: 'bg-blue-50 text-blue-700',
  EM_ACOMPANHAMENTO: 'bg-blue-50 text-blue-700',
  NEUTRO: 'bg-slate-100 text-slate-700',
  PENDENTE: 'bg-amber-50 text-amber-800',
  TRANCADA: 'bg-amber-50 text-amber-800',
  MEDIO: 'bg-amber-50 text-amber-800',
  ATRASO: 'bg-amber-50 text-amber-800',
  ATENCAO: 'bg-amber-50 text-amber-800',
  FALTA_JUSTIFICADA: 'bg-amber-50 text-amber-800',
  CANCELADA: 'bg-rose-50 text-rose-700',
  ALTO: 'bg-rose-50 text-rose-700',
  AUSENTE: 'bg-rose-50 text-rose-700',
  NEGATIVO: 'bg-rose-50 text-rose-700',
}

export function StatusBadge({ value, label }) {
  const cls = BADGE_VARIANTS[value] || 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label || value}
    </span>
  )
}
