import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import menuIcon from '../../assets/menu-aberto.png'
import visaoIcon from '../../assets/visaogeral.png'
import desempenhoIcon from '../../assets/desempenho.png'
import relatorioIcon from '../../assets/relatorio.png'
import frequenciaIcon from '../../assets/frequencia.png'
import aprenderIcon from '../../assets/aprender.png'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useAcademic } from '../../contexts/AcademicContext.jsx'
import { getApiMode } from '../../services/apiClient.js'

const NAV_ITEMS = [
  { to: '/professor/cursos', label: 'Cursos', icone: aprenderIcon },
  { to: '/professor/visao-geral', label: 'Visão geral', icone: visaoIcon },
  { to: '/professor/frequencia', label: 'Frequência', icone: frequenciaIcon },
  { to: '/professor/avaliacoes', label: 'Avaliações', icone: desempenhoIcon },
  { to: '/professor/aprendizagem', label: 'Aprendizagem', icone: aprenderIcon },
  { to: '/professor/desempenho', label: 'Desempenho', icone: desempenhoIcon },
  { to: '/professor/relatorios', label: 'Relatórios', icone: relatorioIcon },
]

export default function AppShell({ children, showContextBar = true }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const { usuario, logout } = useAuth()
  const {
    cursos,
    turmas,
    disciplinas,
    cursoId,
    turmaId,
    disciplinaTurmaId,
    setCursoId,
    setTurmaId,
    setDisciplinaTurmaId,
  } = useAcademic()
  const navigate = useNavigate()
  const location = useLocation()
  const apiMode = getApiMode()

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuAberto(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const currentNav = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const iniciais = (usuario?.nomeCompleto || 'ED')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <main className="dashboard min-h-screen bg-[#f7f9fc] px-5 py-6 text-[#10213a] sm:px-8">
      <header className="relative mx-auto mb-6 flex max-w-[1500px] items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Voltar à página anterior"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            <img src={menuIcon} alt="" className="menu-trigger-icon" />
          </button>
        </div>

        <div className="min-w-0 text-center">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-[26px]">
            {currentNav?.label || 'EDULYTICS'}
          </h1>
          <p className="mt-0.5 truncate text-xs text-slate-600">
            Painel Docente · {usuario?.nomeCompleto || 'Professor'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${
              apiMode === 'http'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}
            title="Modo de comunicação com a API /api/v1"
          >
            {apiMode === 'http' ? 'API HTTP' : 'Mock /api/v1'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair"
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <span className="hidden sm:inline">Sair</span>
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 17l5-5-5-5M15 12H3" />
              <path d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
            </svg>
          </button>
        </div>
      </header>

      {showContextBar && cursos.length > 0 && (
        <section
          aria-label="Contexto acadêmico selecionado"
          className="mx-auto mb-5 max-w-[1500px] rounded-xl border border-[#d9e1eb] bg-white px-4 py-3 shadow-xs"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              Curso
              <select
                value={cursoId || ''}
                onChange={(e) => setCursoId(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-800"
              >
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Turma
              <select
                value={turmaId || ''}
                onChange={(e) => setTurmaId(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-800"
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nomeTurma} · {t.turno}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Disciplina ofertada
              <select
                value={disciplinaTurmaId || ''}
                onChange={(e) => setDisciplinaTurmaId(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-800"
              >
                {disciplinas.map((d) => (
                  <option key={d.disciplinaTurmaId} value={d.disciplinaTurmaId}>
                    {d.disciplina?.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      {menuAberto && (
        <div className="drawer-layer fixed inset-0 z-30">
          <button
            type="button"
            className="drawer-backdrop absolute inset-0 h-full w-full"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
          />
          <aside
            className="app-drawer absolute inset-y-0 left-0 flex w-[292px] max-w-[86vw] flex-col bg-white px-[14px] pb-4 pt-7 shadow-2xl"
            aria-label="Menu principal"
          >
            <div className="flex items-center gap-3 px-2 pb-8">
              <div className="brand-icon flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#2875df]">
                <img src={aprenderIcon} alt="" className="drawer-brand-icon" />
              </div>
              <div>
                <p className="text-[20px] font-bold tracking-wide text-slate-800">EDULYTICS</p>
                <p className="mt-1 text-sm text-slate-500">Painel escolar</p>
              </div>
              <button
                type="button"
                className="ml-auto self-start text-xl text-slate-400 md:hidden"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
              >
                ×
              </button>
            </div>

            <p className="mb-2 px-3 text-[12px] font-medium uppercase tracking-[.08em] text-slate-400">
              Menu principal
            </p>
            <nav className="drawer-nav flex-1 space-y-1" aria-label="Navegação principal">
              {NAV_ITEMS.map(({ to, label, icone }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuAberto(false)}
                  className={({ isActive }) =>
                    `drawer-item flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left text-[15px] font-semibold ${
                      isActive ? 'drawer-item-active' : ''
                    }`
                  }
                >
                  <img src={icone} alt="" className="drawer-nav-icon" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 flex items-center gap-3 border-t border-slate-200 px-1 pt-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfebf8] text-sm font-bold text-[#315f91]">
                {iniciais}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {usuario?.nomeCompleto || 'Docente'}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{usuario?.email}</p>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="app-content mx-auto max-w-[1500px]">{children}</div>
    </main>
  )
}
