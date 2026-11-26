import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import aprenderIcon from '../assets/aprender.png'
import { useAcademic } from '../contexts/AcademicContext.jsx'
import { useApiQuery } from '../hooks/useApiQuery.js'
import * as academicoService from '../services/academicoService.js'
import { EmptyState, ErrorBanner, LoadingState, StatusBadge } from '../components/ui/StateViews.jsx'
import Pagination from '../components/ui/Pagination.jsx'

export default function CursosProfessorPage() {
  const { setCursoId } = useAcademic()
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('Todos')
  const [sort, setSort] = useState('nome_asc')
  const [page, setPage] = useState(0)
  const [somenteMeus, setSomenteMeus] = useState(false)
  const [buscaAluno, setBuscaAluno] = useState('')
  const [verTodosAlunos, setVerTodosAlunos] = useState(false)

  const cursosQuery = useApiQuery(
    (signal) =>
      academicoService.listCursos(
        { q: busca, status, sort, somenteMeus, page, size: 4 },
        signal,
      ),
    [busca, status, sort, somenteMeus, page],
  )

  const alunosQuery = useApiQuery(
    (signal) => academicoService.listAlunos({ q: buscaAluno, page: 0, size: 30 }, signal),
    [buscaAluno],
  )

  const cursos = cursosQuery.data?.content || []
  const totalPages = cursosQuery.data?.totalPages || 1
  const alunos = alunosQuery.data?.content || []
  const listaAlunos = verTodosAlunos ? alunos : alunos.slice(0, 6)

  function abrirCurso(curso) {
    setCursoId(curso.id)
    navigate('/professor/visao-geral')
  }

  return (
    <div className="professor-page grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
      <section className="min-w-0">
        <header className="mb-4">
          <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-[#eaf3ff]">
            <img src={aprenderIcon} alt="EDULYTICS" className="size-6 object-contain" />
          </div>
          <h2 className="text-[26px] font-bold tracking-tight text-[#10213a]">Cursos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecione um curso integrado à API para acompanhar turmas, frequência, avaliações e aprendizagem.
          </p>
        </header>

        <div className="mb-4 grid gap-2 rounded-xl border border-[#d9e1eb] bg-white p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_145px_165px]">
          <label className="block text-xs font-semibold text-slate-600">
            <span className="sr-only">Buscar cursos</span>
            <input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setPage(0)
              }}
              placeholder="Buscar cursos..."
              className="h-9 w-full rounded-lg border border-[#d2deeb] bg-[#fbfdff] px-3 text-xs text-[#10213a]"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span>Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(0)
              }}
              className="h-9 min-w-0 flex-1 rounded-lg border border-[#d2deeb] bg-[#fbfdff] px-2 text-xs text-[#10213a]"
            >
              <option value="Todos">Todos</option>
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
              <option value="CONCLUIDO">Concluídos</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span>Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(0)
              }}
              className="h-9 min-w-0 flex-1 rounded-lg border border-[#d2deeb] bg-[#fbfdff] px-2 text-xs text-[#10213a]"
            >
              <option value="nome_asc">Nome (A-Z)</option>
              <option value="nome_desc">Nome (Z-A)</option>
              <option value="alunos_desc">Mais alunos</option>
            </select>
          </label>
        </div>

        <label className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d9e1eb] bg-white px-3 py-2 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={somenteMeus}
            onChange={(e) => {
              setSomenteMeus(e.target.checked)
              setPage(0)
            }}
            className="size-4 accent-[#2875df]"
          />
          Mostrar apenas cursos com turmas sob minha responsabilidade
        </label>

        {cursosQuery.loading && <LoadingState label="Carregando cursos..." />}
        {cursosQuery.error && <ErrorBanner error={cursosQuery.error} onRetry={cursosQuery.refetch} />}

        {!cursosQuery.loading && !cursosQuery.error && cursos.length === 0 && (
          <EmptyState
            title="Nenhum curso encontrado"
            description="Ajuste os filtros de pesquisa para visualizar os cursos cadastrados."
          />
        )}

        {!cursosQuery.loading && !cursosQuery.error && cursos.length > 0 && (
          <div className="space-y-3">
            {cursos.map((curso) => (
              <button
                key={curso.id}
                type="button"
                onClick={() => abrirCurso(curso)}
                className="group relative grid w-full gap-4 overflow-hidden rounded-xl border border-[#d9e1eb] bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-[#9bbdec] hover:shadow-md sm:grid-cols-[minmax(0,1fr)_170px_24px] sm:items-center"
              >
                <span className="absolute inset-y-0 left-0 w-1 bg-emerald-400" aria-hidden="true" />
                <span className="min-w-0 pl-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-bold text-[#10213a] group-hover:text-[#1767d2]">
                      {curso.nome}
                    </span>
                    <StatusBadge value={curso.status} />
                  </span>
                  <span className="mt-1.5 block text-xs leading-5 text-slate-600">{curso.descricao}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#2875df]">
                    Abrir visão geral →
                  </span>
                </span>
                <span className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-1">
                  <span className="rounded-lg bg-[#f5f8fc] px-3 py-2">
                    <strong className="text-[#10213a]">{curso.totalAlunos ?? 0}</strong> alunos ativos
                  </span>
                  <span className="rounded-lg bg-[#f5f8fc] px-3 py-2">
                    <strong className="text-[#10213a]">{curso.cargaHoraria}h</strong> de carga
                  </span>
                </span>
                <span className="hidden size-8 items-center justify-center rounded-full bg-[#edf4fc] text-lg text-[#2875df] group-hover:bg-[#2875df] group-hover:text-white sm:flex">
                  ›
                </span>
              </button>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </section>

      <aside>
        <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#10213a]">Alunos matriculados</h3>
            <span className="text-xs text-slate-500">{alunos.length} registros</span>
          </div>

          <label className="mt-3 block">
            <span className="sr-only">Buscar aluno</span>
            <input
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              placeholder="Buscar por nome ou matrícula..."
              className="h-9 w-full rounded-lg border border-[#d2deeb] bg-white px-3 text-xs text-[#10213a]"
            />
          </label>

          {alunosQuery.loading && <p className="py-6 text-center text-xs text-slate-500">Carregando alunos...</p>}
          {alunosQuery.error && <div className="mt-3"><ErrorBanner error={alunosQuery.error} onRetry={alunosQuery.refetch} /></div>}

          {!alunosQuery.loading && !alunosQuery.error && (
            <>
              <ul className="mt-3 divide-y divide-slate-100">
                {listaAlunos.map((aluno) => {
                  const iniciais = aluno.nomeCompleto
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()
                  return (
                    <li key={aluno.id} className="flex items-center gap-2.5 py-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d4e1f1] bg-[#eaf3ff] text-[10px] font-bold text-[#315f91]">
                        {iniciais}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">{aluno.nomeCompleto}</p>
                        <p className="text-[11px] text-slate-500">Matrícula {aluno.matriculaEscolar}</p>
                      </div>
                    </li>
                  )
                })}
                {alunos.length === 0 && (
                  <li className="py-5 text-center text-xs text-slate-500">Nenhum aluno encontrado.</li>
                )}
              </ul>
              {alunos.length > 6 && (
                <button
                  type="button"
                  onClick={() => setVerTodosAlunos((v) => !v)}
                  className="mt-2 text-xs font-semibold text-[#1767d2] hover:underline"
                >
                  {verTodosAlunos ? 'Mostrar menos' : `Ver todos (${alunos.length}) →`}
                </button>
              )}
            </>
          )}
        </section>
      </aside>
    </div>
  )
}
