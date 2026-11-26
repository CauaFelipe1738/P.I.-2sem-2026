import { useMemo, useState } from 'react'
import { useAcademic } from '../contexts/AcademicContext.jsx'
import { useApiQuery } from '../hooks/useApiQuery.js'
import * as academicoService from '../services/academicoService.js'
import * as avaliacoesService from '../services/avaliacoesService.js'
import { TIPOS_AVALIACAO } from '../utils/checklists.js'
import { calcularMediaPonderada, formatarNota } from '../utils/academicMetrics.js'
import MetricCard from '../components/ui/MetricCard.jsx'
import { EmptyState, ErrorBanner, LoadingState, StatusBadge } from '../components/ui/StateViews.jsx'

export default function AvaliacoesPage() {
  const { turmaId, disciplinaTurmaId, periodoId, periodos } = useAcademic()
  const [avaliacaoIdState, setAvaliacaoId] = useState(null)
  const [formAv, setFormAv] = useState({
    nomeAvaliacao: '',
    tipoAvaliacao: 'PROVA',
    dataAvaliacao: new Date().toISOString().slice(0, 10),
    valorTotal: '10',
    peso: '1',
    descricao: '',
  })
  const [notasOverrides, setNotasOverrides] = useState({})
  const [editingAvaliacaoId, setEditingAvaliacaoId] = useState(null)
  const [salvandoAv, setSalvandoAv] = useState(false)
  const [salvandoNotaId, setSalvandoNotaId] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(null)

  const avaliacoesQuery = useApiQuery(
    (signal) => avaliacoesService.listAvaliacoes({ disciplinaTurmaId, page: 0, size: 30 }, signal),
    [disciplinaTurmaId],
    { enabled: Boolean(disciplinaTurmaId) },
  )

  const alunosQuery = useApiQuery(
    (signal) => academicoService.listAlunosByTurma(turmaId, undefined, signal),
    [turmaId],
    { enabled: Boolean(turmaId) },
  )

  const avaliacoes = useMemo(() => avaliacoesQuery.data?.content || [], [avaliacoesQuery.data])
  const avaliacaoId = useMemo(
    () =>
      avaliacaoIdState && avaliacoes.some((a) => a.id === avaliacaoIdState)
        ? avaliacaoIdState
        : avaliacoes[0]?.id ?? null,
    [avaliacaoIdState, avaliacoes],
  )

  const notasQuery = useApiQuery(
    (signal) => avaliacoesService.listNotasByAvaliacao(avaliacaoId, signal),
    [avaliacaoId],
    { enabled: Boolean(avaliacaoId) },
  )

  const alunos = useMemo(
    () => (Array.isArray(alunosQuery.data) ? alunosQuery.data : []),
    [alunosQuery.data],
  )
  const notas = useMemo(
    () => (Array.isArray(notasQuery.data) ? notasQuery.data : []),
    [notasQuery.data],
  )

  const notasDraft = useMemo(() => {
    const draft = {}
    for (const aluno of alunos) {
      const reg = notas.find((n) => n.alunoId === aluno.alunoId)
      const base = {
        nota: reg?.nota ?? '',
        observacao: reg?.observacao ?? '',
      }
      const key = `${avaliacaoId}:${aluno.alunoId}`
      draft[aluno.alunoId] = { ...base, ...(notasOverrides[key] || {}) }
    }
    return draft
  }, [alunos, notas, avaliacaoId, notasOverrides])

  const avSelecionada = avaliacoes.find((a) => a.id === avaliacaoId)

  function editarAvaliacao(av) {
    setEditingAvaliacaoId(av.id)
    setFormAv({
      nomeAvaliacao: av.nomeAvaliacao || '',
      tipoAvaliacao: av.tipoAvaliacao || 'PROVA',
      dataAvaliacao: av.dataAvaliacao || new Date().toISOString().slice(0, 10),
      valorTotal: String(av.valorTotal ?? 10),
      peso: String(av.peso ?? 1),
      descricao: av.descricao || '',
    })
  }

  function cancelarEdicaoAvaliacao() {
    setEditingAvaliacaoId(null)
    setFormAv({
      nomeAvaliacao: '',
      tipoAvaliacao: 'PROVA',
      dataAvaliacao: new Date().toISOString().slice(0, 10),
      valorTotal: '10',
      peso: '1',
      descricao: '',
    })
  }

  async function criarAvaliacao(event) {
    event.preventDefault()
    setErro(null)
    setMensagem('')
    setSalvandoAv(true)
    try {
      if (editingAvaliacaoId) {
        await avaliacoesService.updateAvaliacao(editingAvaliacaoId, {
          nomeAvaliacao: formAv.nomeAvaliacao,
          tipoAvaliacao: formAv.tipoAvaliacao,
          dataAvaliacao: formAv.dataAvaliacao,
          valorTotal: Number(formAv.valorTotal),
          peso: Number(formAv.peso),
          descricao: formAv.descricao,
        })
        setMensagem('Avaliação atualizada com sucesso.')
        cancelarEdicaoAvaliacao()
        await avaliacoesQuery.refetch()
      } else {
        const criada = await avaliacoesService.createAvaliacao({
          disciplinaTurmaId,
          periodoId: periodoId || periodos[0]?.id || 1,
          nomeAvaliacao: formAv.nomeAvaliacao,
          tipoAvaliacao: formAv.tipoAvaliacao,
          dataAvaliacao: formAv.dataAvaliacao,
          valorTotal: Number(formAv.valorTotal),
          peso: Number(formAv.peso),
          descricao: formAv.descricao,
          status: 'PLANEJADA',
        })
        setFormAv((prev) => ({ ...prev, nomeAvaliacao: '', descricao: '' }))
        setMensagem('Avaliação criada com sucesso.')
        await avaliacoesQuery.refetch()
        setAvaliacaoId(criada.id)
      }
    } catch (error) {
      setErro(error)
    } finally {
      setSalvandoAv(false)
    }
  }

  async function marcarCorrigida(id) {
    setErro(null)
    setMensagem('')
    try {
      await avaliacoesService.corrigirAvaliacao(id)
      setMensagem('Avaliação marcada como CORRIGIDA.')
      avaliacoesQuery.refetch()
    } catch (error) {
      setErro(error)
    }
  }

  async function salvarNotaAluno(alunoId) {
    if (!avSelecionada) return
    setErro(null)
    setMensagem('')
    const entry = notasDraft[alunoId]
    const notaNum = Number(entry?.nota)
    if (entry?.nota === '' || !Number.isFinite(notaNum) || notaNum < 0 || notaNum > avSelecionada.valorTotal) {
      setErro({
        title: 'Nota inválida',
        detail: `Informe um valor numérico entre 0 e ${avSelecionada.valorTotal}.`,
      })
      return
    }

    setSalvandoNotaId(alunoId)
    try {
      await avaliacoesService.upsertNotaAluno(avSelecionada.id, alunoId, {
        nota: notaNum,
        observacao: entry.observacao || '',
      })
      setMensagem('Nota registrada com sucesso.')
      setNotasOverrides((prev) => {
        const copy = { ...prev }
        delete copy[`${avaliacaoId}:${alunoId}`]
        return copy
      })
      notasQuery.refetch()
    } catch (error) {
      setErro(error)
    } finally {
      setSalvandoNotaId(null)
    }
  }

  const mediaAvaliacao = avSelecionada
    ? calcularMediaPonderada(
        notas.map((n) => ({
          nota: n.nota,
          valorTotal: avSelecionada.valorTotal,
          peso: 1,
        })),
      )
    : null

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Avaliações na disciplina" value={String(avaliacoes.length)} />
        <MetricCard label="Notas lançadas (selecionada)" value={`${notas.length}/${alunos.length}`} />
        <MetricCard label="Média da avaliação (0–10)" value={formatarNota(mediaAvaliacao)} />
      </section>

      {erro && <ErrorBanner error={erro} />}
      {mensagem && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          {mensagem}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <form onSubmit={criarAvaliacao} className="space-y-3 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#10213a]">
                {editingAvaliacaoId ? 'Editar avaliação' : 'Nova avaliação'}
              </h2>
              {editingAvaliacaoId && (
                <button
                  type="button"
                  onClick={cancelarEdicaoAvaliacao}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Cancelar
                </button>
              )}
            </div>
            <label className="block text-xs font-semibold">
              Nome da avaliação
              <input
                required
                value={formAv.nomeAvaliacao}
                onChange={(e) => setFormAv({ ...formAv, nomeAvaliacao: e.target.value })}
                placeholder="Ex.: Prova 2 - SQL"
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold">
                Tipo
                <select
                  value={formAv.tipoAvaliacao}
                  onChange={(e) => setFormAv({ ...formAv, tipoAvaliacao: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-xs font-normal"
                >
                  {TIPOS_AVALIACAO.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold">
                Data
                <input
                  type="date"
                  required
                  value={formAv.dataAvaliacao}
                  onChange={(e) => setFormAv({ ...formAv, dataAvaliacao: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-xs font-normal"
                />
              </label>
              <label className="text-xs font-semibold">
                Valor total
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={formAv.valorTotal}
                  onChange={(e) => setFormAv({ ...formAv, valorTotal: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-xs font-normal"
                />
              </label>
              <label className="text-xs font-semibold">
                Peso
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={formAv.peso}
                  onChange={(e) => setFormAv({ ...formAv, peso: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-xs font-normal"
                />
              </label>
            </div>
            <label className="block text-xs font-semibold">
              Descrição (opcional)
              <input
                value={formAv.descricao}
                onChange={(e) => setFormAv({ ...formAv, descricao: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
              />
            </label>
            <button
              type="submit"
              disabled={salvandoAv || !disciplinaTurmaId}
              className="w-full rounded-lg bg-[#2875df] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1e65c2] disabled:opacity-50"
            >
              {salvandoAv ? 'Salvando...' : editingAvaliacaoId ? 'Salvar alterações' : 'Criar avaliação'}
            </button>
          </form>

          <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#10213a]">Lista de avaliações</h3>
            {avaliacoesQuery.loading ? (
              <p className="py-4 text-xs text-slate-500">Carregando...</p>
            ) : avaliacoes.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">Nenhuma avaliação nesta disciplina.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {avaliacoes.map((av) => (
                  <article
                    key={av.id}
                    className={`rounded-lg border p-3 ${
                      av.id === avaliacaoId ? 'border-[#2875df] bg-blue-50/40' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => setAvaliacaoId(av.id)} className="text-left">
                        <strong className="block text-xs text-[#10213a]">{av.nomeAvaliacao}</strong>
                        <span className="text-[11px] text-slate-500">
                          {av.dataAvaliacao} · Valor {av.valorTotal} · Peso {av.peso}
                        </span>
                      </button>
                      <StatusBadge value={av.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                      <button
                        type="button"
                        onClick={() => editarAvaliacao(av)}
                        className="font-semibold text-slate-600 hover:underline"
                      >
                        Editar
                      </button>
                      {av.status !== 'CORRIGIDA' && av.status !== 'CANCELADA' && (
                        <button
                          type="button"
                          onClick={() => marcarCorrigida(av.id)}
                          className="font-semibold text-[#1767d2] hover:underline"
                        >
                          Marcar como corrigida
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#10213a]">
              Lançamento de notas {avSelecionada ? `· ${avSelecionada.nomeAvaliacao}` : ''}
            </h3>
            <p className="text-xs text-slate-500">
              {avSelecionada
                ? `Valor máximo permitido: ${avSelecionada.valorTotal} | Peso ${avSelecionada.peso}`
                : 'Selecione uma avaliação à esquerda.'}
            </p>
          </div>

          {notasQuery.loading || alunosQuery.loading ? (
            <LoadingState label="Carregando notas da turma..." />
          ) : !avSelecionada ? (
            <EmptyState title="Nenhuma avaliação selecionada" description="Crie ou selecione uma avaliação para lançar notas." />
          ) : alunos.length === 0 ? (
            <EmptyState title="Turma sem alunos matriculados" />
          ) : (
            <div className="space-y-3">
              {alunos.map((aluno) => {
                const draft = notasDraft[aluno.alunoId] || { nota: '', observacao: '' }
                const key = `${avaliacaoId}:${aluno.alunoId}`
                return (
                  <div
                    key={aluno.alunoId}
                    className="grid items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1.4fr)_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{aluno.nomeCompleto}</p>
                      <p className="text-[11px] text-slate-500">Matrícula {aluno.matriculaEscolar}</p>
                    </div>

                    <label className="text-[11px] font-semibold text-slate-600">
                      Nota (0–{avSelecionada.valorTotal})
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={avSelecionada.valorTotal}
                        value={draft.nota}
                        onChange={(e) =>
                          setNotasOverrides((prev) => ({
                            ...prev,
                            [key]: { ...draft, nota: e.target.value },
                          }))
                        }
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-normal"
                      />
                    </label>

                    <label className="text-[11px] font-semibold text-slate-600">
                      Observação
                      <input
                        value={draft.observacao}
                        onChange={(e) =>
                          setNotasOverrides((prev) => ({
                            ...prev,
                            [key]: { ...draft, observacao: e.target.value },
                          }))
                        }
                        placeholder="Comentário sobre a entrega"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-normal"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={salvandoNotaId === aluno.alunoId}
                      onClick={() => salvarNotaAluno(aluno.alunoId)}
                      className="h-9 self-end rounded-lg bg-[#2875df] px-3 text-xs font-semibold text-white hover:bg-[#1e65c2] disabled:opacity-50"
                    >
                      {salvandoNotaId === aluno.alunoId ? 'Salvando...' : 'Salvar nota'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
