import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useApiQuery } from '../hooks/useApiQuery.js'
import * as indicadoresService from '../services/indicadoresService.js'
import { CORTE_PRESENCA_PERCENTUAL, STATUS_PRESENCA_LABELS } from '../utils/checklists.js'
import { formatarNota, formatarPercentual } from '../utils/academicMetrics.js'
import MetricCard from '../components/ui/MetricCard.jsx'
import { EmptyState, ErrorBanner, LoadingState, StatusBadge } from '../components/ui/StateViews.jsx'

export default function PainelAlunoPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const desempenhoQuery = useApiQuery(
    (signal) => indicadoresService.getMeuDesempenho(undefined, signal),
    [],
  )

  const dados = desempenhoQuery.data

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-6 text-[#10213a] sm:px-8">
      <div className="mx-auto max-w-[1160px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d9e1eb] bg-white px-5 py-4 shadow-xs">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2875df]">
              EDULYTICS · Área do Aluno
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#10213a]">
              {usuario?.nomeCompleto || dados?.aluno?.nomeCompleto || 'Meu Painel Acadêmico'}
            </h1>
            {dados?.aluno?.matriculaEscolar && (
              <p className="text-xs text-slate-500">
                Matrícula {dados.aluno.matriculaEscolar} · {usuario?.email}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Sair
          </button>
        </header>

        {desempenhoQuery.loading && <LoadingState label="Carregando seu histórico acadêmico..." />}
        {desempenhoQuery.error && (
          <ErrorBanner error={desempenhoQuery.error} onRetry={desempenhoQuery.refetch} />
        )}

        {!desempenhoQuery.loading && !desempenhoQuery.error && dados && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Minha frequência"
                value={formatarPercentual(dados.taxaFrequencia)}
                badge={`Mínimo ${CORTE_PRESENCA_PERCENTUAL}%`}
              />
              <MetricCard
                label="Minha média ponderada"
                value={formatarNota(dados.mediaPonderada)}
                badge="Escala 0–10"
              />
              <MetricCard label="Faltas registradas" value={String(dados.totalFaltas ?? 0)} />
              <MetricCard label="Atrasos registrados" value={String(dados.totalAtrasos ?? 0)} />
            </section>

            <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
              <h2 className="text-base font-bold text-[#10213a]">Matrículas ativas</h2>
              {dados.matriculas?.length === 0 ? (
                <div className="mt-3"><EmptyState title="Nenhuma matrícula encontrada" /></div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {dados.matriculas.map((m) => (
                    <article key={m.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm text-[#10213a]">{m.cursoNome}</strong>
                        <StatusBadge value={m.status} />
                      </div>
                      <p className="mt-1 text-slate-600">
                        Turma {m.turmaNome} · {m.periodoNome}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
                <h2 className="text-base font-bold text-[#10213a]">Minhas notas</h2>
                {dados.notas?.length === 0 ? (
                  <div className="mt-3"><EmptyState title="Nenhuma avaliação lançada" /></div>
                ) : (
                  <ul className="mt-3 space-y-2 text-xs">
                    {dados.notas.map((n) => (
                      <li key={n.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <strong className="text-sm">{n.avaliacaoNome}</strong>
                          <span className="text-sm font-bold text-[#1767d2]">
                            {n.nota}/{n.valorTotal}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-500">
                          {n.disciplinaNome} · {n.dataAvaliacao} · Peso {n.peso}
                        </p>
                        {n.observacao && <p className="mt-1 text-slate-600">{n.observacao}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
                <h2 className="text-base font-bold text-[#10213a]">Minha frequência</h2>
                {dados.frequencias?.length === 0 ? (
                  <div className="mt-3"><EmptyState title="Nenhuma chamada registrada" /></div>
                ) : (
                  <ul className="mt-3 max-h-80 space-y-2 overflow-auto pr-1 text-xs">
                    {dados.frequencias.map((f) => (
                      <li key={f.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <strong>{f.disciplinaNome} · {f.dataAula}</strong>
                          <StatusBadge
                            value={f.statusPresenca}
                            label={STATUS_PRESENCA_LABELS[f.statusPresenca]}
                          />
                        </div>
                        <p className="mt-1 text-slate-500">{f.conteudo}</p>
                        {f.justificativa && <p className="mt-1 text-slate-600">Justificativa: {f.justificativa}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
              <h2 className="text-base font-bold text-[#10213a]">Observações pedagógicas compartilhadas</h2>
              <p className="mt-1 text-xs text-slate-500">
                Por privacidade (LGPD), são exibidas apenas observações autorizadas pelo docente para visualização estudantil.
              </p>
              {dados.comentarios?.length === 0 ? (
                <div className="mt-3"><EmptyState title="Nenhuma observação compartilhada até o momento" /></div>
              ) : (
                <div className="mt-3 space-y-2">
                  {dados.comentarios.map((c) => (
                    <article key={c.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm">{c.titulo}</strong>
                        <div className="flex gap-1.5">
                          <StatusBadge value={c.tipo} />
                          {c.classificacao && <StatusBadge value={c.classificacao} />}
                        </div>
                      </div>
                      <p className="mt-1 text-slate-600">{c.descricao}</p>
                      {c.acaoAcompanhamento && (
                        <p className="mt-1 text-slate-500">
                          <strong>Orientação:</strong> {c.acaoAcompanhamento}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
