import { useState } from 'react'
import { useAcademic } from '../contexts/AcademicContext.jsx'
import { useApiQuery } from '../hooks/useApiQuery.js'
import * as academicoService from '../services/academicoService.js'
import * as indicadoresService from '../services/indicadoresService.js'
import { STATUS_PRESENCA_LABELS } from '../utils/checklists.js'
import {
  buildAcademicReportCsv,
  formatarNota,
  formatarPercentual,
} from '../utils/academicMetrics.js'
import MetricCard from '../components/ui/MetricCard.jsx'
import { EmptyState, ErrorBanner, LoadingState, StatusBadge } from '../components/ui/StateViews.jsx'

export default function RelatoriosPage() {
  const { cursoId, turmaId, disciplinaTurmaId, cursoAtual } = useAcademic()
  const [alunoId, setAlunoId] = useState('')
  const [mesPeriodo, setMesPeriodo] = useState('')
  const [aviso, setAviso] = useState('')

  const alunosQuery = useApiQuery(
    (signal) => academicoService.listAlunosByTurma(turmaId, undefined, signal),
    [turmaId],
    { enabled: Boolean(turmaId) },
  )

  const relatorioQuery = useApiQuery(
    (signal) =>
      indicadoresService.getRelatorioAcademico(
        {
          cursoId,
          turmaId,
          disciplinaTurmaId,
          alunoId: alunoId || undefined,
          periodo: mesPeriodo || undefined,
        },
        signal,
      ),
    [cursoId, turmaId, disciplinaTurmaId, alunoId, mesPeriodo],
    { enabled: Boolean(cursoId) },
  )

  const alunos = Array.isArray(alunosQuery.data) ? alunosQuery.data : []
  const relatorio = relatorioQuery.data
  const ind = relatorio?.indicadores

  function exportarCsv() {
    if (!relatorio) return
    const csv = buildAcademicReportCsv({
      frequencias: relatorio.frequencias,
      comentarios: relatorio.comentarios,
      notas: relatorio.notas,
      cursoNome: cursoAtual?.nome || 'Curso',
    })
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `relatorio-edulytics-${(cursoAtual?.nome || 'curso').toLowerCase().replaceAll(' ', '-')}.csv`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setAviso('CSV exportado com sucesso.')
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#10213a]">Configurar relatório consolidado</h2>
            <p className="text-xs text-slate-500">
              Dados obtidos em tempo real via <code>GET /api/v1/relatorios/academico</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              disabled={!relatorio}
              className="rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e65c2] disabled:opacity-50"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Imprimir / Salvar PDF
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Aluno
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
            Mês de referência
            <input
              type="month"
              value={mesPeriodo}
              onChange={(e) => setMesPeriodo(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm font-normal"
            />
          </label>
        </div>

        {aviso && <p role="status" className="mt-3 text-xs font-semibold text-emerald-700">{aviso}</p>}
      </section>

      {relatorioQuery.loading && <LoadingState label="Gerando prévia do relatório..." />}
      {relatorioQuery.error && <ErrorBanner error={relatorioQuery.error} onRetry={relatorioQuery.refetch} />}

      {!relatorioQuery.loading && !relatorioQuery.error && relatorio && (
        <section className="report-preview space-y-5 rounded-xl border border-[#d9e1eb] bg-white p-6 shadow-xs">
          <header className="border-b border-slate-200 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              EDULYTICS · Relatório Acadêmico
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#10213a]">{cursoAtual?.nome || 'Consolidado'}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Emitido em {new Date(relatorio.emitidoEm).toLocaleDateString('pt-BR')} · Período:{' '}
              {mesPeriodo || 'Todo o histórico'}
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Frequência média" value={formatarPercentual(ind?.taxaFrequenciaMedia)} />
            <MetricCard label="Média ponderada de notas" value={formatarNota(ind?.mediaNotasPonderada)} />
            <MetricCard label="Comentários registrados" value={String(relatorio.comentarios?.length ?? 0)} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-bold text-[#10213a]">Frequência ({relatorio.frequencias.length})</h4>
              {relatorio.frequencias.length === 0 ? (
                <EmptyState title="Sem lançamentos de frequência para os filtros" />
              ) : (
                <ul className="max-h-80 space-y-2 overflow-auto pr-1 text-xs">
                  {relatorio.frequencias.map((f) => (
                    <li key={f.id} className="rounded-lg border border-slate-100 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <strong>{f.alunoNome}</strong>
                        <StatusBadge
                          value={f.statusPresenca}
                          label={STATUS_PRESENCA_LABELS[f.statusPresenca]}
                        />
                      </div>
                      <p className="mt-1 text-slate-500">
                        {f.dataAula} · {f.disciplinaNome}
                        {f.justificativa ? ` · ${f.justificativa}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-bold text-[#10213a]">Notas em Avaliações ({relatorio.notas.length})</h4>
              {relatorio.notas.length === 0 ? (
                <EmptyState title="Sem notas lançadas para os filtros" />
              ) : (
                <ul className="max-h-80 space-y-2 overflow-auto pr-1 text-xs">
                  {relatorio.notas.map((n) => (
                    <li key={n.id} className="rounded-lg border border-slate-100 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <strong>{n.alunoNome}</strong>
                        <span className="font-bold text-[#1767d2]">
                          {n.nota}/{n.valorTotal}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500">
                        {n.avaliacaoNome} · {n.disciplinaNome}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      <style>
        {
          '@media print { body * { visibility: hidden; } .report-preview, .report-preview * { visibility: visible; } .report-preview { position: absolute; inset: 0; border: 0; box-shadow: none; } }'
        }
      </style>
    </div>
  )
}
