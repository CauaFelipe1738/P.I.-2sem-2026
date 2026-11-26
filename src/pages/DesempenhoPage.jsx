import { useState } from 'react'
import { useAcademic } from '../contexts/AcademicContext.jsx'
import { useApiQuery } from '../hooks/useApiQuery.js'
import * as academicoService from '../services/academicoService.js'
import * as indicadoresService from '../services/indicadoresService.js'
import { CORTE_PRESENCA_PERCENTUAL, TIPOS_COMENTARIO } from '../utils/checklists.js'
import { formatarNota, formatarPercentual } from '../utils/academicMetrics.js'
import MetricCard from '../components/ui/MetricCard.jsx'
import { EmptyState, ErrorBanner, LoadingState } from '../components/ui/StateViews.jsx'

export default function DesempenhoPage() {
  const { cursoId, turmaId, disciplinaTurmaId, periodoId } = useAcademic()
  const [alunoId, setAlunoId] = useState('')
  const [mesPeriodo, setMesPeriodo] = useState('')

  const alunosQuery = useApiQuery(
    (signal) => academicoService.listAlunosByTurma(turmaId, undefined, signal),
    [turmaId],
    { enabled: Boolean(turmaId) },
  )

  const indicadoresQuery = useApiQuery(
    (signal) =>
      indicadoresService.getIndicadoresDesempenho(
        {
          cursoId,
          turmaId,
          disciplinaTurmaId,
          periodoId,
          alunoId: alunoId || undefined,
          periodo: mesPeriodo || undefined,
        },
        signal,
      ),
    [cursoId, turmaId, disciplinaTurmaId, periodoId, alunoId, mesPeriodo],
    { enabled: Boolean(cursoId) },
  )

  const alunos = Array.isArray(alunosQuery.data) ? alunosQuery.data : []
  const ind = indicadoresQuery.data

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Taxa de frequência média"
          value={formatarPercentual(ind?.taxaFrequenciaMedia)}
          badge="PRESENTE + ATRASO"
        />
        <MetricCard
          label={`Alunos abaixo de ${CORTE_PRESENCA_PERCENTUAL}%`}
          value={formatarPercentual(ind?.percentualAbaixoLimite)}
          badge="Corte oficial"
        />
        <MetricCard
          label="Média ponderada de notas"
          value={formatarNota(ind?.mediaNotasPonderada)}
          badge="Escala 0–10"
        />
        <MetricCard
          label="Precisam de acompanhamento"
          value={String(ind?.alertas?.length ?? 0)}
          badge={`${ind?.totalAulasRegistradas ?? 0} aulas`}
        />
      </section>

      <section className="grid gap-3 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-xs sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          Filtrar aluno
          <select
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm font-normal"
          >
            <option value="">Todos os alunos</option>
            {alunos.map((a) => (
              <option key={a.alunoId} value={a.alunoId}>{a.nomeCompleto}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-600">
          Filtrar mês/período
          <input
            type="month"
            value={mesPeriodo}
            onChange={(e) => setMesPeriodo(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm font-normal"
          />
        </label>
      </section>

      {indicadoresQuery.loading && <LoadingState label="Calculando indicadores de desempenho..." />}
      {indicadoresQuery.error && (
        <ErrorBanner error={indicadoresQuery.error} onRetry={indicadoresQuery.refetch} />
      )}

      {!indicadoresQuery.loading && !indicadoresQuery.error && ind && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold text-[#10213a]">Observações pedagógicas por categoria</h2>
            <div className="mt-4 space-y-2.5">
              {TIPOS_COMENTARIO.map(({ value, label }) => {
                const count = ind.comentariosPorTipo?.[value] || 0
                return (
                  <div key={value} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-medium text-slate-700">{label}</span>
                    <strong className="text-slate-900">{count}</strong>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-bold text-amber-950">Alunos que precisam de atenção</h2>
            <p className="mt-1 text-xs text-amber-900">
              Critério oficial: frequência abaixo de {CORTE_PRESENCA_PERCENTUAL}% ou registro pedagógico de atenção/negativo.
            </p>

            {ind.alertas?.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="Nenhum alerta para os filtros atuais" />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {ind.alertas.map((alerta) => (
                  <article
                    key={alerta.alunoId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3"
                  >
                    <div>
                      <strong className="text-sm text-slate-900">{alerta.alunoNome}</strong>
                      <p className="text-xs text-slate-600">
                        Frequência: {formatarPercentual(alerta.taxaFrequencia)} ·{' '}
                        {alerta.dificuldadesRegistradas} ocorrência(s) de atenção
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlunoId(String(alerta.alunoId))}
                      className="text-xs font-semibold text-[#1767d2] hover:underline"
                    >
                      Filtrar aluno
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
