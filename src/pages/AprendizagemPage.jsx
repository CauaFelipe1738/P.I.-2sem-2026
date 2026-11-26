import { useState } from 'react'
import { useAcademic } from '../contexts/AcademicContext.jsx'
import { useApiQuery } from '../hooks/useApiQuery.js'
import * as academicoService from '../services/academicoService.js'
import * as comentariosService from '../services/comentariosService.js'
import {
  CHECKLIST_APRENDIZAGEM,
  CLASSIFICACOES_COMENTARIO,
  STATUS_PLANO,
  TIPOS_COMENTARIO,
} from '../utils/checklists.js'
import MetricCard from '../components/ui/MetricCard.jsx'
import { EmptyState, ErrorBanner, LoadingState, StatusBadge } from '../components/ui/StateViews.jsx'

export default function AprendizagemPage() {
  const { turmaId, disciplinaTurmaId } = useAcademic()

  const [filtroAlunoId, setFiltroAlunoId] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [editingComentarioId, setEditingComentarioId] = useState(null)
  const [comForm, setComForm] = useState({
    alunoId: '',
    titulo: '',
    tipo: 'DESEMPENHO',
    classificacao: 'POSITIVO',
    descricao: '',
    acaoAcompanhamento: '',
    checklistItens: [],
    visivelAluno: false,
  })
  const [editingPlanoId, setEditingPlanoId] = useState(null)
  const [planoForm, setPlanoForm] = useState({
    alunoId: '',
    dificuldade: '',
    objetivo: '',
    acaoProposta: '',
    dataInicio: new Date().toISOString().slice(0, 10),
    prazo: '',
    status: 'PENDENTE',
    resultado: '',
  })
  const [salvandoCom, setSalvandoCom] = useState(false)
  const [salvandoPlano, setSalvandoPlano] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState(null)

  const alunosQuery = useApiQuery(
    (signal) => academicoService.listAlunosByTurma(turmaId, undefined, signal),
    [turmaId],
    { enabled: Boolean(turmaId) },
  )

  const comentariosQuery = useApiQuery(
    (signal) =>
      comentariosService.listComentarios(
        {
          disciplinaTurmaId,
          alunoId: filtroAlunoId || undefined,
          tipo: filtroTipo || undefined,
          page: 0,
          size: 30,
        },
        signal,
      ),
    [disciplinaTurmaId, filtroAlunoId, filtroTipo],
    { enabled: Boolean(disciplinaTurmaId) },
  )

  const planosQuery = useApiQuery(
    (signal) =>
      comentariosService.listPlanos(
        { disciplinaTurmaId, alunoId: filtroAlunoId || undefined },
        signal,
      ),
    [disciplinaTurmaId, filtroAlunoId],
    { enabled: Boolean(disciplinaTurmaId) },
  )

  const alunos = Array.isArray(alunosQuery.data) ? alunosQuery.data : []
  const comentarios = comentariosQuery.data?.content || []
  const planos = Array.isArray(planosQuery.data) ? planosQuery.data : []
  const planosAtivos = planos.filter((p) => p.status !== 'CONCLUIDO').length
  const registrosAtencao = comentarios.filter(
    (c) => c.classificacao === 'ATENCAO' || c.classificacao === 'NEGATIVO',
  ).length

  function toggleChecklist(item) {
    setComForm((prev) => ({
      ...prev,
      checklistItens: prev.checklistItens.includes(item)
        ? prev.checklistItens.filter((x) => x !== item)
        : [...prev.checklistItens, item],
    }))
  }

  async function salvarComentario(event) {
    event.preventDefault()
    setErro(null)
    setMensagem('')
    const targetAlunoId = Number(comForm.alunoId || alunos[0]?.alunoId)
    if (!targetAlunoId) return

    setSalvandoCom(true)
    try {
      const payload = {
        ...comForm,
        alunoId: targetAlunoId,
        disciplinaTurmaId: disciplinaTurmaId || null,
      }
      if (editingComentarioId) {
        await comentariosService.updateComentario(editingComentarioId, payload)
        setMensagem('Comentário pedagógico atualizado.')
      } else {
        await comentariosService.createComentario(payload)
        setMensagem('Comentário pedagógico registrado.')
      }
      setEditingComentarioId(null)
      setComForm({
        alunoId: '',
        titulo: '',
        tipo: 'DESEMPENHO',
        classificacao: 'POSITIVO',
        descricao: '',
        acaoAcompanhamento: '',
        checklistItens: [],
        visivelAluno: false,
      })
      comentariosQuery.refetch()
    } catch (error) {
      setErro(error)
    } finally {
      setSalvandoCom(false)
    }
  }

  async function salvarPlano(event) {
    event.preventDefault()
    setErro(null)
    setMensagem('')
    const targetAlunoId = Number(planoForm.alunoId || alunos[0]?.alunoId)
    if (!targetAlunoId) return

    setSalvandoPlano(true)
    try {
      const payload = {
        ...planoForm,
        alunoId: targetAlunoId,
        disciplinaTurmaId: disciplinaTurmaId || null,
      }
      if (editingPlanoId) {
        await comentariosService.updatePlano(editingPlanoId, payload)
        setMensagem('Plano de acompanhamento atualizado.')
      } else {
        await comentariosService.createPlano(payload)
        setMensagem('Plano de acompanhamento criado.')
      }
      setEditingPlanoId(null)
      setPlanoForm({
        alunoId: '',
        dificuldade: '',
        objetivo: '',
        acaoProposta: '',
        dataInicio: new Date().toISOString().slice(0, 10),
        prazo: '',
        status: 'PENDENTE',
        resultado: '',
      })
      planosQuery.refetch()
    } catch (error) {
      setErro(error)
    } finally {
      setSalvandoPlano(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Comentários pedagógicos" value={String(comentarios.length)} />
        <MetricCard label="Registros de atenção/negativos" value={String(registrosAtencao)} />
        <MetricCard label="Planos de acompanhamento ativos" value={String(planosAtivos)} />
      </section>

      <section className="grid gap-3 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-xs sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          Filtrar por aluno
          <select
            value={filtroAlunoId}
            onChange={(e) => setFiltroAlunoId(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm font-normal"
          >
            <option value="">Todos os alunos da turma</option>
            {alunos.map((a) => (
              <option key={a.alunoId} value={a.alunoId}>{a.nomeCompleto}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-600">
          Filtrar por tipo
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm font-normal"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_COMENTARIO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
      </section>

      {erro && <ErrorBanner error={erro} />}
      {mensagem && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          {mensagem}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={salvarComentario} className="space-y-3 rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#10213a]">
              {editingComentarioId ? 'Editar comentário' : 'Novo comentário pedagógico'}
            </h2>
            {editingComentarioId && (
              <button
                type="button"
                onClick={() => setEditingComentarioId(null)}
                className="text-xs font-semibold text-[#1767d2]"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Aluno
              <select
                value={comForm.alunoId || alunos[0]?.alunoId || ''}
                onChange={(e) => setComForm({ ...comForm, alunoId: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
              >
                {alunos.map((a) => (
                  <option key={a.alunoId} value={a.alunoId}>{a.nomeCompleto}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold">
              Título
              <input
                required
                value={comForm.titulo}
                onChange={(e) => setComForm({ ...comForm, titulo: e.target.value })}
                placeholder="Resumo do registro"
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
              />
            </label>

            <label className="text-xs font-semibold">
              Tipo
              <select
                value={comForm.tipo}
                onChange={(e) => setComForm({ ...comForm, tipo: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
              >
                {TIPOS_COMENTARIO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold">
              Classificação
              <select
                value={comForm.classificacao}
                onChange={(e) => setComForm({ ...comForm, classificacao: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
              >
                {CLASSIFICACOES_COMENTARIO.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-1 sm:grid-cols-2">
            {CHECKLIST_APRENDIZAGEM.map((item) => (
              <label key={item} className="flex items-center gap-2 py-0.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={comForm.checklistItens.includes(item)}
                  onChange={() => toggleChecklist(item)}
                />
                {item}
              </label>
            ))}
          </div>

          <label className="block text-xs font-semibold">
            Descrição
            <textarea
              required
              rows={3}
              value={comForm.descricao}
              onChange={(e) => setComForm({ ...comForm, descricao: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-normal"
            />
          </label>

          <label className="block text-xs font-semibold">
            Ação de acompanhamento
            <input
              value={comForm.acaoAcompanhamento}
              onChange={(e) => setComForm({ ...comForm, acaoAcompanhamento: e.target.value })}
              placeholder="Próximo passo pedagógico"
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
            />
          </label>

          <label className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={comForm.visivelAluno}
              onChange={(e) => setComForm({ ...comForm, visivelAluno: e.target.checked })}
              className="size-4 accent-[#2875df]"
            />
            Visível no painel do aluno (LGPD: mantenha desmarcado para notas internas ou de saúde)
          </label>

          <button
            type="submit"
            disabled={salvandoCom || !alunos.length}
            className="rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e65c2] disabled:opacity-50"
          >
            {salvandoCom ? 'Salvando...' : editingComentarioId ? 'Atualizar comentário' : 'Salvar comentário'}
          </button>
        </form>

        <form onSubmit={salvarPlano} className="space-y-3 rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#10213a]">
              {editingPlanoId ? 'Editar plano de acompanhamento' : 'Plano de acompanhamento'}
            </h2>
            {editingPlanoId && (
              <button
                type="button"
                onClick={() => setEditingPlanoId(null)}
                className="text-xs font-semibold text-[#1767d2]"
              >
                Cancelar
              </button>
            )}
          </div>

          <label className="block text-xs font-semibold">
            Aluno
            <select
              value={planoForm.alunoId || alunos[0]?.alunoId || ''}
              onChange={(e) => setPlanoForm({ ...planoForm, alunoId: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
            >
              {alunos.map((a) => (
                <option key={a.alunoId} value={a.alunoId}>{a.nomeCompleto}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold">
            Dificuldade identificada
            <input
              required
              value={planoForm.dificuldade}
              onChange={(e) => setPlanoForm({ ...planoForm, dificuldade: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
            />
          </label>

          <label className="block text-xs font-semibold">
            Objetivo de aprendizagem
            <input
              required
              value={planoForm.objetivo}
              onChange={(e) => setPlanoForm({ ...planoForm, objetivo: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
            />
          </label>

          <label className="block text-xs font-semibold">
            Ação proposta
            <textarea
              required
              rows={2}
              value={planoForm.acaoProposta}
              onChange={(e) => setPlanoForm({ ...planoForm, acaoProposta: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs font-normal"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-xs font-semibold">
              Início
              <input
                type="date"
                required
                value={planoForm.dataInicio}
                onChange={(e) => setPlanoForm({ ...planoForm, dataInicio: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-xs font-normal"
              />
            </label>
            <label className="text-xs font-semibold">
              Prazo
              <input
                type="date"
                required
                value={planoForm.prazo}
                onChange={(e) => setPlanoForm({ ...planoForm, prazo: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-xs font-normal"
              />
            </label>
            <label className="text-xs font-semibold">
              Situação
              <select
                value={planoForm.status}
                onChange={(e) => setPlanoForm({ ...planoForm, status: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-xs font-normal"
              >
                {STATUS_PLANO.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold">
            Resultado observado
            <input
              value={planoForm.resultado}
              onChange={(e) => setPlanoForm({ ...planoForm, resultado: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-normal"
            />
          </label>

          <button
            type="submit"
            disabled={salvandoPlano || !alunos.length}
            className="rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e65c2] disabled:opacity-50"
          >
            {salvandoPlano ? 'Salvando...' : editingPlanoId ? 'Atualizar plano' : 'Salvar plano'}
          </button>
        </form>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#10213a]">Histórico de comentários</h3>
          {comentariosQuery.loading ? (
            <div className="mt-3"><LoadingState label="Carregando comentários..." /></div>
          ) : comentarios.length === 0 ? (
            <div className="mt-3"><EmptyState title="Nenhum comentário encontrado" /></div>
          ) : (
            <div className="mt-3 space-y-3">
              {comentarios.map((c) => (
                <article key={c.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-[#10213a]">{c.alunoNome} · {c.titulo}</strong>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge value={c.tipo} />
                      {c.classificacao && <StatusBadge value={c.classificacao} />}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{c.descricao}</p>
                  {c.checklistItens?.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-500">Checklist: {c.checklistItens.join(' · ')}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{c.visivelAluno ? 'Visível para o aluno' : 'Restrito aos docentes (LGPD)'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingComentarioId(c.id)
                        setComForm({
                          alunoId: String(c.alunoId),
                          titulo: c.titulo,
                          tipo: c.tipo,
                          classificacao: c.classificacao || 'NEUTRO',
                          descricao: c.descricao,
                          acaoAcompanhamento: c.acaoAcompanhamento || '',
                          checklistItens: c.checklistItens || [],
                          visivelAluno: Boolean(c.visivelAluno),
                        })
                      }}
                      className="font-semibold text-[#1767d2] hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#10213a]">Planos de acompanhamento</h3>
          {planosQuery.loading ? (
            <div className="mt-3"><LoadingState label="Carregando planos..." /></div>
          ) : planos.length === 0 ? (
            <div className="mt-3"><EmptyState title="Nenhum plano cadastrado" /></div>
          ) : (
            <div className="mt-3 space-y-3">
              {planos.map((p) => (
                <article key={p.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-[#10213a]">{p.alunoNome}</strong>
                    <StatusBadge value={p.status} />
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-700">{p.dificuldade}</p>
                  <p className="mt-1 text-xs text-slate-600">Objetivo: {p.objetivo}</p>
                  <p className="mt-1 text-xs text-slate-600">Ação: {p.acaoProposta}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{p.dataInicio} até {p.prazo}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlanoId(p.id)
                        setPlanoForm({
                          alunoId: String(p.alunoId),
                          dificuldade: p.dificuldade,
                          objetivo: p.objetivo,
                          acaoProposta: p.acaoProposta,
                          dataInicio: p.dataInicio,
                          prazo: p.prazo,
                          status: p.status,
                          resultado: p.resultado || '',
                        })
                      }}
                      className="font-semibold text-[#1767d2] hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
