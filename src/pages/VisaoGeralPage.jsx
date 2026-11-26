import { useState } from 'react'
import alunosResumoIcon from '../assets/alunos vg.png'
import calendarioIcon from '../assets/calendario.png'
import registrosIcon from '../assets/registros.png'
import { useAcademic } from '../contexts/AcademicContext.jsx'
import { useApiQuery } from '../hooks/useApiQuery.js'
import * as academicoService from '../services/academicoService.js'
import * as comentariosService from '../services/comentariosService.js'
import * as indicadoresService from '../services/indicadoresService.js'
import { CLASSIFICACOES_COMENTARIO, TIPOS_COMENTARIO } from '../utils/checklists.js'
import { formatarNota, formatarPercentual } from '../utils/academicMetrics.js'
import MetricCard from '../components/ui/MetricCard.jsx'
import { EmptyState, ErrorBanner, LoadingState, StatusBadge } from '../components/ui/StateViews.jsx'

export default function VisaoGeralPage() {
  const { cursoId, turmaId, disciplinaTurmaId, cursoAtual, turmaAtual, disciplinaAtual } = useAcademic()
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const indicadoresQuery = useApiQuery(
    (signal) =>
      indicadoresService.getIndicadoresDesempenho(
        { cursoId, turmaId, disciplinaTurmaId },
        signal,
      ),
    [cursoId, turmaId, disciplinaTurmaId],
    { enabled: Boolean(cursoId) },
  )

  const comentariosQuery = useApiQuery(
    (signal) =>
      comentariosService.listComentarios(
        { disciplinaTurmaId, page: 0, size: 8 },
        signal,
      ),
    [disciplinaTurmaId],
    { enabled: Boolean(disciplinaTurmaId) },
  )

  const alunosQuery = useApiQuery(
    (signal) => academicoService.listAlunosByTurma(turmaId, undefined, signal),
    [turmaId],
    { enabled: Boolean(turmaId) },
  )

  const ind = indicadoresQuery.data
  const comentarios = comentariosQuery.data?.content || []
  const alunosTurma = Array.isArray(alunosQuery.data) ? alunosQuery.data : []

  async function salvarComentario(event) {
    event.preventDefault()
    setErroForm('')
    setSalvando(true)
    const form = new FormData(event.currentTarget)
    try {
      await comentariosService.createComentario({
        alunoId: Number(form.get('alunoId')),
        disciplinaTurmaId: disciplinaTurmaId || null,
        titulo: form.get('titulo'),
        tipo: form.get('tipo'),
        classificacao: form.get('classificacao'),
        descricao: form.get('descricao'),
        acaoAcompanhamento: form.get('acaoAcompanhamento'),
        visivelAluno: Boolean(form.get('visivelAluno')),
      })
      setModalAberto(false)
      comentariosQuery.refetch()
      indicadoresQuery.refetch()
    } catch (error) {
      setErroForm(error?.detail || 'Não foi possível salvar o comentário.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-5">
      <section aria-label="Indicadores do contexto" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Frequência média"
          value={formatarPercentual(ind?.taxaFrequenciaMedia)}
          badge="Corte 75%"
          icon={calendarioIcon}
        />
        <MetricCard
          label="Média ponderada de notas"
          value={formatarNota(ind?.mediaNotasPonderada)}
          badge="Escala 0–10"
          icon={registrosIcon}
        />
        <MetricCard
          label="Alunos matriculados na turma"
          value={String(alunosTurma.length)}
          badge={turmaAtual?.nomeTurma || 'Turma'}
          icon={alunosResumoIcon}
        />
        <MetricCard
          label="Alertas de acompanhamento"
          value={String(ind?.alertas?.length ?? 0)}
          badge={`${ind?.totalAulasRegistradas ?? 0} aulas`}
          icon={registrosIcon}
        />
      </section>

      {cursoAtual && (
        <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Oferta selecionada
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {cursoAtual.nome}
                {disciplinaAtual?.disciplina?.nome ? ` · ${disciplinaAtual.disciplina.nome}` : ''}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{cursoAtual.descricao}</p>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <strong className="block text-sm text-slate-900">{cursoAtual.cargaHoraria}h</strong>
                Carga do curso
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <strong className="block text-sm text-slate-900">{turmaAtual?.turno || '—'}</strong>
                Turno
              </div>
            </div>
          </div>
        </section>
      )}

      {(indicadoresQuery.error || comentariosQuery.error) && (
        <ErrorBanner
          error={indicadoresQuery.error || comentariosQuery.error}
          onRetry={() => {
            indicadoresQuery.refetch()
            comentariosQuery.refetch()
          }}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#10213a]">Registros pedagógicos por tipo</h3>
          <p className="mt-1 text-xs text-slate-500">
            Distribuição consolidada diretamente do endpoint <code>/api/v1/indicadores/desempenho</code>.
          </p>

          {indicadoresQuery.loading ? (
            <div className="mt-4">
              <LoadingState label="Calculando indicadores..." />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {TIPOS_COMENTARIO.map(({ value, label }) => {
                const total = ind?.comentariosPorTipo?.[value] || 0
                return (
                  <div key={value} className="grid grid-cols-[120px_1fr_28px] items-center gap-3 text-xs">
                    <span className="font-medium text-slate-700">{label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#347fe0]"
                        style={{ width: `${Math.min(100, total * 25)}%` }}
                      />
                    </div>
                    <strong className="text-right text-slate-800">{total}</strong>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#10213a]">Observações recentes</h3>
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              disabled={!alunosTurma.length}
              className="rounded-lg bg-[#2875df] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e65c2] disabled:opacity-50"
            >
              Novo comentário
            </button>
          </div>

          {comentariosQuery.loading ? (
            <div className="mt-4">
              <LoadingState label="Carregando comentários..." />
            </div>
          ) : comentarios.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nenhum comentário neste contexto"
                description="Registre uma observação pedagógica para iniciar o acompanhamento."
              />
            </div>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              {comentarios.map((obs) => (
                <article key={obs.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-[#1760b5]">{obs.alunoNome}</strong>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge value={obs.tipo} />
                      {obs.classificacao && <StatusBadge value={obs.classificacao} />}
                    </div>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-800">{obs.titulo}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{obs.descricao}</p>
                  {obs.acaoAcompanhamento && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      <strong>Próximo passo:</strong> {obs.acaoAcompanhamento}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalAberto(false)
          }}
        >
          <form onSubmit={salvarComentario} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Novo comentário pedagógico</h3>
              <button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar" className="text-xl text-slate-500">
                ×
              </button>
            </div>

            {erroForm && <p role="alert" className="mb-3 rounded bg-rose-50 p-2 text-xs text-rose-700">{erroForm}</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold sm:col-span-2">
                Aluno
                <select name="alunoId" required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal">
                  {alunosTurma.map((a) => (
                    <option key={a.alunoId} value={a.alunoId}>
                      {a.nomeCompleto}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold sm:col-span-2">
                Título
                <input name="titulo" required placeholder="Ex.: Participação nas atividades" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" />
              </label>

              <label className="text-xs font-semibold">
                Tipo
                <select name="tipo" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal">
                  {TIPOS_COMENTARIO.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold">
                Classificação
                <select name="classificacao" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal">
                  {CLASSIFICACOES_COMENTARIO.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold sm:col-span-2">
                Descrição
                <textarea name="descricao" required rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm font-normal" />
              </label>

              <label className="text-xs font-semibold sm:col-span-2">
                Ação de acompanhamento (opcional)
                <input name="acaoAcompanhamento" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" />
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 sm:col-span-2">
                <input type="checkbox" name="visivelAluno" className="size-4 accent-[#2875df]" />
                Tornar visível no painel do aluno (LGPD — desmarcado por padrão)
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModalAberto(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar comentário'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
