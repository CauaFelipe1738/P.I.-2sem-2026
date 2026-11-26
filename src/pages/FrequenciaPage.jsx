import { useMemo, useState } from 'react'
import { useAcademic } from '../contexts/AcademicContext.jsx'
import { useApiQuery } from '../hooks/useApiQuery.js'
import * as academicoService from '../services/academicoService.js'
import * as aulasService from '../services/aulasService.js'
import {
  CHECKLIST_AULA,
  CORTE_PRESENCA_PERCENTUAL,
  STATUS_PRESENCA,
  STATUS_PRESENCA_LABELS,
  STATUS_PRESENCA_OPCOES,
} from '../utils/checklists.js'
import { calcularTaxaFrequencia, formatarPercentual, isPresencaContabilizada } from '../utils/academicMetrics.js'
import MetricCard from '../components/ui/MetricCard.jsx'
import { EmptyState, ErrorBanner, LoadingState, StatusBadge } from '../components/ui/StateViews.jsx'

export default function FrequenciaPage() {
  const { turmaId, disciplinaTurmaId } = useAcademic()

  const [aulaSelecionadaState, setAulaSelecionadaId] = useState(null)
  const [novaAula, setNovaAula] = useState({
    dataAula: new Date().toISOString().slice(0, 10),
    horarioInicio: '19:00',
    horarioFim: '20:40',
    conteudo: '',
    status: 'REALIZADA',
  })
  const [chamadaOverrides, setChamadaOverrides] = useState({})
  const [editingAulaId, setEditingAulaId] = useState(null)
  const [salvandoAula, setSalvandoAula] = useState(false)
  const [salvandoChamada, setSalvandoChamada] = useState(false)
  const [salvandoIndividualId, setSalvandoIndividualId] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erroForm, setErroForm] = useState(null)

  const aulasQuery = useApiQuery(
    (signal) => aulasService.listAulas({ disciplinaTurmaId, page: 0, size: 30 }, signal),
    [disciplinaTurmaId],
    { enabled: Boolean(disciplinaTurmaId) },
  )

  const alunosQuery = useApiQuery(
    (signal) => academicoService.listAlunosByTurma(turmaId, undefined, signal),
    [turmaId],
    { enabled: Boolean(turmaId) },
  )

  const aulas = useMemo(() => aulasQuery.data?.content || [], [aulasQuery.data])
  const aulaSelecionadaId = useMemo(
    () =>
      aulaSelecionadaState && aulas.some((a) => a.id === aulaSelecionadaState)
        ? aulaSelecionadaState
        : aulas[0]?.id ?? null,
    [aulaSelecionadaState, aulas],
  )

  const frequenciasQuery = useApiQuery(
    (signal) => aulasService.listFrequenciasByAula(aulaSelecionadaId, signal),
    [aulaSelecionadaId],
    { enabled: Boolean(aulaSelecionadaId) },
  )

  const alunos = useMemo(
    () => (Array.isArray(alunosQuery.data) ? alunosQuery.data : []),
    [alunosQuery.data],
  )
  const frequencias = useMemo(
    () => (Array.isArray(frequenciasQuery.data) ? frequenciasQuery.data : []),
    [frequenciasQuery.data],
  )

  const rascunhoChamada = useMemo(() => {
    const map = {}
    for (const aluno of alunos) {
      const existente = frequencias.find((f) => f.alunoId === aluno.alunoId)
      const base = {
        id: existente?.id || null,
        incluir: true,
        statusPresenca: existente?.statusPresenca || STATUS_PRESENCA.PRESENTE,
        justificativa: existente?.justificativa || '',
        checklistAula: existente?.checklistAula || [],
        observacao: existente?.observacao || '',
      }
      const key = `${aulaSelecionadaId}:${aluno.alunoId}`
      map[aluno.alunoId] = { ...base, ...(chamadaOverrides[key] || {}) }
    }
    return map
  }, [alunos, frequencias, aulaSelecionadaId, chamadaOverrides])

  function editarAulaSelecionada(aula) {
    setEditingAulaId(aula.id)
    setNovaAula({
      dataAula: aula.dataAula,
      horarioInicio: String(aula.horarioInicio || '').slice(0, 5),
      horarioFim: String(aula.horarioFim || '').slice(0, 5),
      conteudo: aula.conteudo || '',
      status: aula.status || 'REALIZADA',
    })
  }

  function cancelarEdicaoAula() {
    setEditingAulaId(null)
    setNovaAula({
      dataAula: new Date().toISOString().slice(0, 10),
      horarioInicio: '19:00',
      horarioFim: '20:40',
      conteudo: '',
      status: 'REALIZADA',
    })
  }

  async function criarAula(event) {
    event.preventDefault()
    setErroForm(null)
    setMensagem('')
    setSalvandoAula(true)
    try {
      if (editingAulaId) {
        await aulasService.updateAula(editingAulaId, novaAula)
        setMensagem('Aula atualizada com sucesso.')
        cancelarEdicaoAula()
        await aulasQuery.refetch()
      } else {
        const criada = await aulasService.createAula({
          disciplinaTurmaId,
          ...novaAula,
        })
        setNovaAula((prev) => ({ ...prev, conteudo: '' }))
        setMensagem('Aula registrada com sucesso.')
        await aulasQuery.refetch()
        setAulaSelecionadaId(criada.id)
      }
    } catch (error) {
      setErroForm(error)
    } finally {
      setSalvandoAula(false)
    }
  }

  async function salvarIndividual(alunoId) {
    const row = rascunhoChamada[alunoId]
    if (!row?.id) return
    setErroForm(null)
    setMensagem('')
    setSalvandoIndividualId(alunoId)
    try {
      await aulasService.updateFrequencia(row.id, {
        statusPresenca: row.statusPresenca,
        justificativa: row.justificativa,
        checklistAula: row.checklistAula,
        observacao: row.observacao,
      })
      setMensagem('Registro individual atualizado via PUT /frequencias.')
      frequenciasQuery.refetch()
    } catch (error) {
      setErroForm(error)
    } finally {
      setSalvandoIndividualId(null)
    }
  }

  async function alterarStatusAula(aula, acao) {
    setErroForm(null)
    setMensagem('')
    try {
      if (acao === 'realizar') {
        await aulasService.realizarAula(aula.id, aula.conteudo || 'Aula ministrada')
        setMensagem('Aula marcada como realizada.')
      } else {
        await aulasService.cancelarAula(aula.id)
        setMensagem('Aula cancelada.')
      }
      aulasQuery.refetch()
    } catch (error) {
      setErroForm(error)
    }
  }

  function atualizarAluno(alunoId, patch) {
    const key = `${aulaSelecionadaId}:${alunoId}`
    setChamadaOverrides((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || rascunhoChamada[alunoId] || {}), ...patch },
    }))
  }

  function toggleChecklist(alunoId, item) {
    const atual = rascunhoChamada[alunoId]?.checklistAula || []
    const proximo = atual.includes(item)
      ? atual.filter((x) => x !== item)
      : [...atual, item]
    atualizarAluno(alunoId, { checklistAula: proximo })
  }

  async function salvarChamada(event) {
    event.preventDefault()
    if (!aulaSelecionadaId) return
    setErroForm(null)
    setMensagem('')

    const itens = alunos
      .filter((a) => rascunhoChamada[a.alunoId]?.incluir)
      .map((a) => {
        const row = rascunhoChamada[a.alunoId]
        return {
          alunoId: a.alunoId,
          statusPresenca: row.statusPresenca,
          justificativa: row.justificativa,
          checklistAula: row.checklistAula,
          observacao: row.observacao,
        }
      })

    if (!itens.length) {
      setErroForm({ title: 'Seleção obrigatória', detail: 'Selecione ao menos um aluno para salvar a chamada.' })
      return
    }

    setSalvandoChamada(true)
    try {
      await aulasService.saveFrequenciasEmLote(aulaSelecionadaId, itens)
      setMensagem('Frequência salva na API com sucesso.')
      setChamadaOverrides({})
      frequenciasQuery.refetch()
    } catch (error) {
      setErroForm(error)
    } finally {
      setSalvandoChamada(false)
    }
  }

  const taxaAulaAtual = calcularTaxaFrequencia(frequencias)
  const ausenciasAula = frequencias.filter((f) => !isPresencaContabilizada(f)).length
  const aulaAtual = aulas.find((a) => a.id === aulaSelecionadaId)

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Aulas na disciplina" value={String(aulas.length)} />
        <MetricCard
          label="Presença na aula selecionada"
          value={formatarPercentual(taxaAulaAtual)}
          badge={`Corte ${CORTE_PRESENCA_PERCENTUAL}%`}
        />
        <MetricCard label="Ausências / justificadas" value={String(ausenciasAula)} />
        <MetricCard label="Alunos da turma" value={String(alunos.length)} />
      </section>

      {erroForm && <ErrorBanner error={erroForm} />}
      {mensagem && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          {mensagem}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,1fr)]">
        <section className="space-y-4 rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#10213a]">Chamada da aula</h2>
              <p className="text-xs text-slate-500">
                {aulaAtual
                  ? `${aulaAtual.dataAula} · ${aulaAtual.horarioInicio}–${aulaAtual.horarioFim} · ${aulaAtual.conteudo || 'Sem conteúdo'}`
                  : 'Selecione ou cadastre uma aula ao lado.'}
              </p>
            </div>
            {aulaAtual && <StatusBadge value={aulaAtual.status} />}
          </div>

          {frequenciasQuery.loading || alunosQuery.loading ? (
            <LoadingState label="Carregando alunos e frequência..." />
          ) : !aulaAtual ? (
            <EmptyState title="Nenhuma aula selecionada" description="Crie uma aula ao lado para registrar a frequência." />
          ) : (
            <form onSubmit={salvarChamada} className="space-y-3">
              <div className="max-h-[470px] space-y-3 overflow-auto pr-1">
                {alunos.map((aluno) => {
                  const row = rascunhoChamada[aluno.alunoId]
                  if (!row) return null
                  return (
                    <article key={aluno.alunoId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <input
                            type="checkbox"
                            checked={row.incluir}
                            onChange={(e) => atualizarAluno(aluno.alunoId, { incluir: e.target.checked })}
                            className="size-4 accent-[#2875df]"
                          />
                          {aluno.nomeCompleto}
                          <span className="text-xs font-normal text-slate-500">({aluno.matriculaEscolar})</span>
                        </label>

                        <select
                          aria-label={`Situação de ${aluno.nomeCompleto}`}
                          value={row.statusPresenca}
                          onChange={(e) => atualizarAluno(aluno.alunoId, { statusPresenca: e.target.value })}
                          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
                        >
                          {STATUS_PRESENCA_OPCOES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <input
                          value={row.justificativa}
                          onChange={(e) => atualizarAluno(aluno.alunoId, { justificativa: e.target.value })}
                          placeholder="Justificativa (se aplicável)"
                          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
                        />
                        <input
                          value={row.observacao}
                          onChange={(e) => atualizarAluno(aluno.alunoId, { observacao: e.target.value })}
                          placeholder="Observação da aula"
                          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="grid flex-1 gap-1 sm:grid-cols-2">
                          {CHECKLIST_AULA.map((item) => (
                            <label key={item} className="flex items-center gap-2 text-[11px] text-slate-600">
                              <input
                                type="checkbox"
                                checked={row.checklistAula.includes(item)}
                                onChange={() => toggleChecklist(aluno.alunoId, item)}
                              />
                              {item}
                            </label>
                          ))}
                        </div>
                        {row.id && (
                          <button
                            type="button"
                            disabled={salvandoIndividualId === aluno.alunoId}
                            onClick={() => salvarIndividual(aluno.alunoId)}
                            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          >
                            {salvandoIndividualId === aluno.alunoId ? 'Atualizando...' : 'Atualizar aluno'}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              <button
                type="submit"
                disabled={salvandoChamada}
                className="rounded-lg bg-[#2875df] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e65c2] disabled:opacity-50"
              >
                {salvandoChamada ? 'Salvando chamada...' : 'Salvar frequência'}
              </button>
            </form>
          )}
        </section>

        <aside className="space-y-5">
          <form onSubmit={criarAula} className="space-y-3 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#10213a]">
                {editingAulaId ? 'Editar aula' : 'Nova aula'}
              </h3>
              {editingAulaId && (
                <button
                  type="button"
                  onClick={cancelarEdicaoAula}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Cancelar edição
                </button>
              )}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className="text-xs font-semibold sm:col-span-2">
                Data
                <input
                  type="date"
                  required
                  value={novaAula.dataAula}
                  onChange={(e) => setNovaAula({ ...novaAula, dataAula: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
                />
              </label>
              <label className="text-xs font-semibold">
                Início
                <input
                  type="time"
                  required
                  value={novaAula.horarioInicio}
                  onChange={(e) => setNovaAula({ ...novaAula, horarioInicio: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
                />
              </label>
              <label className="text-xs font-semibold">
                Término
                <input
                  type="time"
                  required
                  value={novaAula.horarioFim}
                  onChange={(e) => setNovaAula({ ...novaAula, horarioFim: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
                />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                Conteúdo ministrado
                <input
                  required
                  value={novaAula.conteudo}
                  onChange={(e) => setNovaAula({ ...novaAula, conteudo: e.target.value })}
                  placeholder="Ex.: Joins e subconsultas SQL"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={salvandoAula || !disciplinaTurmaId}
              className="w-full rounded-lg bg-[#2875df] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1e65c2] disabled:opacity-50"
            >
              {salvandoAula
                ? 'Salvando...'
                : editingAulaId
                  ? 'Salvar alterações da aula'
                  : 'Registrar aula'}
            </button>
          </form>

          <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#10213a]">Aulas registradas</h3>
            {aulasQuery.loading ? (
              <p className="py-4 text-xs text-slate-500">Carregando aulas...</p>
            ) : aulas.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">Nenhuma aula encontrada.</p>
            ) : (
              <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
                {aulas.map((aula) => (
                  <article
                    key={aula.id}
                    className={`rounded-lg border p-3 ${
                      aula.id === aulaSelecionadaId
                        ? 'border-[#2875df] bg-blue-50/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setAulaSelecionadaId(aula.id)}
                        className="text-left"
                      >
                        <strong className="block text-xs text-[#10213a]">
                          {aula.dataAula} · {aula.horarioInicio}–{aula.horarioFim}
                        </strong>
                        <span className="text-xs text-slate-600">{aula.conteudo || 'Sem conteúdo'}</span>
                      </button>
                      <StatusBadge value={aula.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => editarAulaSelecionada(aula)}
                        className="font-semibold text-[#1767d2] hover:underline"
                      >
                        Editar
                      </button>
                      {aula.status === 'PLANEJADA' && (
                        <>
                          <button
                            type="button"
                            onClick={() => alterarStatusAula(aula, 'realizar')}
                            className="font-semibold text-emerald-700 hover:underline"
                          >
                            Marcar realizada
                          </button>
                          <button
                            type="button"
                            onClick={() => alterarStatusAula(aula, 'cancelar')}
                            className="font-semibold text-rose-700 hover:underline"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      <span className="ml-auto text-slate-400">
                        {frequencias.length && aula.id === aulaSelecionadaId
                          ? `${frequencias.filter(isPresencaContabilizada).length}/${frequencias.length} presentes`
                          : ''}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <p className="text-xs text-slate-500">
        Regra institucional: <strong>{STATUS_PRESENCA_LABELS.PRESENTE}</strong> e{' '}
        <strong>{STATUS_PRESENCA_LABELS.ATRASO}</strong> contam como comparecimento; corte mínimo oficial de{' '}
        <strong>{CORTE_PRESENCA_PERCENTUAL}%</strong>.
      </p>
    </div>
  )
}
