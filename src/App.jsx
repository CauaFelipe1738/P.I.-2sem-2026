import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import menuIcon from './assets/menu-aberto.png'
import visaoIcon from './assets/visaogeral.png'
import desempenhoIcon from './assets/desempenho.png'
import frequenciaIcon from './assets/frequencia.png'
import aprenderIcon from './assets/aprender.png'
import alunoFoto from './assets/otimizadas/aluno.jpg'
import professorFoto from './assets/otimizadas/professor.jpg'
import coordenacaoFoto from './assets/otimizadas/diretor.jpg'
import CatalogoAcademico from './components/CatalogoAcademico.jsx'
import DashboardOverview from './components/DashboardOverview.jsx'
import HelpCenter from './components/HelpCenter.jsx'
import NotificationCenter from './components/NotificationCenter.jsx'
import Aprendizagem from './components/aprendizagem.jsx'
import Desempenho from './components/desempenho.jsx'
import Frequencia from './components/frequencia.jsx'
import { cursos as cursosAcademicos } from './data/dadosAcademicos.js'
import './App.css'

// As telas de entrada e perfil são carregadas sob demanda para reduzir o bundle inicial.
const Login = lazy(() => import('./components/Login.jsx'))
const Alunos = lazy(() => import('./components/alunos.jsx'))
const Professor = lazy(() => import('./components/professor.jsx'))
const Coordenador = lazy(() => import('./components/coodernador.jsx'))
const carregando = (
  <div className="loading-screen" role="status" aria-label="Carregando">
    <span className="loading-spinner" aria-hidden="true" />
  </div>
)

// O mesmo mapa define a ordem do menu e resolve o componente exibido em cada tela.
const paginas = [
  { id: 'visao', nome: 'Visão geral', icone: visaoIcon },
  { id: 'desempenho', nome: 'Desempenho', icone: desempenhoIcon, Componente: Desempenho },
  { id: 'frequencia', nome: 'Frequência', icone: frequenciaIcon, Componente: Frequencia },
  { id: 'aprendizagem', nome: 'Aprendizagem', icone: aprenderIcon, Componente: Aprendizagem },
]

function Icon({ type, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  const paths = {
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /></>,
  }
  return <svg {...common}>{paths[type]}</svg>
}

function App() {
  // O estado da rota e o histórico são mantidos juntos para suportar voltar e avançar.
  const [paginaAtual, setPaginaAtual] = useState('login')
  const [perfil, setPerfil] = useState(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [cursoSelecionado, setCursoSelecionado] = useState(cursosAcademicos[0])
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const [modoAjuda, setModoAjuda] = useState('center')
  const [tutorialNecessario, setTutorialNecessario] = useState(() => {
    try { return localStorage.getItem('edulytics.tutorial.seen.v1') !== 'true' } catch { return true }
  })
  const [studentToOpen, setStudentToOpen] = useState(null)

  useEffect(() => {
    // popstate é necessário porque o histórico não atualiza o estado React sozinho.
    if (!window.history.state?.pagina) window.history.replaceState({ pagina: 'login' }, '')
    const sincronizarPagina = (event) => {
      if (event.state?.pagina) setPaginaAtual(event.state.pagina)
    }
    window.addEventListener('popstate', sincronizarPagina)
    return () => window.removeEventListener('popstate', sincronizarPagina)
  }, [])

  const navegar = useCallback((pagina, curso = cursoSelecionado) => {
    if (pagina === paginaAtual) return
    if (pagina !== 'visao') setStudentToOpen(null)
    setCursoSelecionado(curso)
    window.history.pushState({ pagina }, '')
    setPaginaAtual(pagina)
  }, [cursoSelecionado, paginaAtual])

  useEffect(() => {
    function fecharMenuPeloTeclado(event) {
      if (event.key === 'Escape') setMenuAberto(false)
    }

    window.addEventListener('keydown', fecharMenuPeloTeclado)
    return () => window.removeEventListener('keydown', fecharMenuPeloTeclado)
  }, [])

  const abrirPerfilDoAlerta = useCallback((alerta) => {
    const curso = cursosAcademicos.find((item) => item.nome === alerta.student.curso) || cursosAcademicos[0]
    setStudentToOpen({ studentId: alerta.student.id, requestId: `${Date.now()}-${Math.random()}` })
    if (paginaAtual === 'visao') setCursoSelecionado(curso)
    else navegar('visao', curso)
  }, [navegar, paginaAtual])

  const limparEstudanteSelecionado = useCallback(() => setStudentToOpen(null), [])

  function fecharAjuda(concluiuTutorial = modoAjuda === 'tutorial') {
    setAjudaAberta(false)
    if (concluiuTutorial) {
      setTutorialNecessario(false)
      try { localStorage.setItem('edulytics.tutorial.seen.v1', 'true') } catch { /* A ajuda continua acessível manualmente nesta sessão. */ }
    }
  }

  const tutorialInicial = paginaAtual === 'visao' && tutorialNecessario && !ajudaAberta

  // Separar a entrada do shell evita carregar a navegação acadêmica nas telas públicas.
  if (paginaAtual === 'login') {
    return <div className="min-h-screen bg-slate-100 text-slate-900"><Suspense fallback={carregando}><Login onLogin={() => navegar('perfil')} /></Suspense></div>
  }

  if (paginaAtual === 'perfil') {
    const perfis = [
      { nome: 'Aluno', detalhe: 'Acompanhe seu percurso de aprendizagem.', imagem: alunoFoto, destino: 'aluno' },
      { nome: 'Professor', detalhe: 'Registre observações e acompanhe suas turmas.', imagem: professorFoto, destino: 'professor' },
      { nome: 'Coordenação', detalhe: 'Consulte indicadores e informações da escola.', imagem: coordenacaoFoto, destino: 'coordenador' },
    ]

    return (
      <main className="login-background flex min-h-dvh items-center justify-center px-4 py-10 text-[#10233f]">
        <section className="w-full max-w-[1060px]">
          <div className="mb-9 text-center">
            <p className="mb-2 text-sm font-bold text-[#1767d2]">Acesso ao painel</p>
            <h1 className="text-3xl font-bold sm:text-[36px]">Como deseja continuar?</h1>
            <p className="mt-2 text-[15px] text-[#71819a]">Escolha seu perfil para acessar o ambiente da escola.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {perfis.map(({ nome, detalhe, imagem, destino }) => (
              <button key={nome} onClick={() => { setPerfil(nome); navegar(destino) }} className="group overflow-hidden rounded-2xl border border-[#d3e1f1] bg-white text-left shadow-[0_12px_35px_rgba(31,54,82,0.08)] transition hover:-translate-y-1 hover:border-[#8db7ef] hover:shadow-[0_18px_42px_rgba(31,84,145,0.14)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#70a6ef]">
                <img src={imagem} alt="" loading="lazy" decoding="async" className="h-52 w-full object-cover object-center" />
                <span className="block p-5">
                  <span className="block text-xl font-bold text-[#10233f]">{nome}</span>
                  <span className="mt-1.5 block min-h-10 text-sm leading-5 text-[#71819a]">{detalhe}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1767d2]">Acessar <span aria-hidden="true">›</span></span>
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => navegar('login')} className="mx-auto mt-7 block text-sm font-semibold text-[#64758d] hover:text-[#1767d2]">Voltar ao login</button>
        </section>
      </main>
    )
  }

  if (paginaAtual === 'aluno') return <Suspense fallback={carregando}><PerfilPage Componente={Alunos} perfil={perfil} onTrocarPerfil={() => { setPerfil(null); navegar('perfil') }} onSair={() => { setPerfil(null); navegar('login') }} aluno /></Suspense>
  if (paginaAtual === 'professor') return <Suspense fallback={carregando}><PerfilPage Componente={Professor} perfil={perfil} onTrocarPerfil={() => { setPerfil(null); navegar('perfil') }} onSair={() => { setPerfil(null); navegar('login') }} professor onAbrirVisaoGeral={(curso) => navegar('visao', curso)} /></Suspense>
  if (paginaAtual === 'coordenador') return <Suspense fallback={carregando}><PerfilPage Componente={Coordenador} perfil={perfil} onTrocarPerfil={() => { setPerfil(null); navegar('perfil') }} onSair={() => { setPerfil(null); navegar('login') }} /></Suspense>

  const paginaSelecionada = paginas.find(({ id }) => id === paginaAtual)

  return (
    <main className="dashboard min-h-screen bg-[#f7f9fc] px-5 py-6 text-[#10213a] sm:px-8">
      <header className="sticky top-0 z-20 relative mx-auto mb-7 flex max-w-[1500px] items-start justify-between border-b border-slate-200/70 bg-[#f7f9fc]/95 py-2 backdrop-blur">
        <div className="dashboard-header-back mt-1 flex gap-2"><button onClick={() => window.history.back()} aria-label="Voltar à página anterior" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50">‹</button><button onClick={() => setMenuAberto(!menuAberto)} aria-label="Abrir menu" aria-expanded={menuAberto} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><img src={menuIcon} alt="" className="menu-trigger-icon" /></button></div>
        <div className="dashboard-title absolute left-1/2 top-0 -translate-x-1/2 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{paginaSelecionada?.nome}</h1>
          <p className="mt-1 whitespace-nowrap text-xs text-slate-600">{paginaAtual === 'visao' ? cursoSelecionado.nome : 'Apoio à observação docente · Escola Central'}</p>
        </div>
        <div className="dashboard-header-actions mt-1 flex items-center gap-1 sm:gap-2">
          <NotificationCenter onOpenStudent={abrirPerfilDoAlerta} />
          <button onClick={() => { setModoAjuda('center'); setAjudaAberta(true) }} aria-label="Abrir central de ajuda" title="Central de ajuda" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50">?</button>
          <button onClick={() => navegar('login')} aria-label="Sair" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><Icon type="logout" /></button>
        </div>
      </header>

      {/* Menu lateral compartilhado pelas áreas acadêmicas. */}
      {/* Navegação lateral compartilhada pelas áreas do painel. */}
      {menuAberto && <div className="drawer-layer fixed inset-0 z-30">
        <button className="drawer-backdrop absolute inset-0 h-full w-full" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />
        <aside className="app-drawer absolute inset-y-0 left-0 flex w-[292px] max-w-[86vw] flex-col bg-white px-[14px] pb-4 pt-7 shadow-2xl" aria-label="Menu principal">
          <div className="flex items-center gap-3 px-2 pb-8">
            <div className="brand-icon flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#2875df]"><img src={aprenderIcon} alt="" className="drawer-brand-icon" /></div>
            <div><p className="text-[20px] font-bold tracking-wide text-slate-800">EDULYTICS</p><p className="mt-1 text-sm text-slate-500">Painel escolar</p></div>
            <button className="ml-auto self-start text-slate-400 md:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">×</button>
          </div>
          <p className="mb-2 px-3 text-[12px] font-medium uppercase tracking-[.08em] text-slate-400">Menu principal</p>
          <nav className="drawer-nav flex-1 space-y-1" aria-label="Navegação principal">
            {paginas.map(({ id, nome, icone }) => (
              <button
                key={id}
                onClick={() => {
                  navegar(id)
                  setMenuAberto(false)
                }}
                aria-current={paginaAtual === id ? 'page' : undefined}
                className={`drawer-item flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left text-[15px] font-semibold ${paginaAtual === id ? 'drawer-item-active' : ''}`}
              >
                <img src={icone} alt="" className="drawer-nav-icon" />
                {nome}
              </button>
            ))}
          </nav>
          <button onClick={() => { setModoAjuda('center'); setAjudaAberta(true); setMenuAberto(false) }} className="drawer-item flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left text-[15px] font-semibold"><span className="flex size-[23px] items-center justify-center rounded-full border border-current text-xs">?</span>Central de ajuda</button>
          <div className="mt-4 flex items-center gap-3 border-t border-slate-200 px-1 pt-5"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfebf8] text-sm font-bold text-[#315f91]">{(perfil || 'AC').slice(0, 2).toUpperCase()}</div><div><p className="text-sm font-semibold text-slate-800">{perfil || 'Alex Chen'}</p><p className="mt-1 text-sm text-slate-500">Perfil selecionado</p></div></div>
        </aside>
      </div>}

      <div className="app-content mx-auto max-w-[1500px]">
        {paginaAtual !== 'visao' && (() => {
          const Componente = paginaSelecionada?.Componente
          const temaPagina = {
            desempenho: 'border-blue-100 bg-[#f4f8ff]',
            frequencia: 'border-emerald-100 bg-[#f4fbf8]',
            aprendizagem: 'border-amber-100 bg-[#fffaf2]',
          }[paginaAtual] || 'border-[#d9e1eb] bg-white'

          return (
            <section className={`component-page rounded-2xl border p-5 shadow-sm sm:p-7 ${temaPagina}`}>
              {Componente === Aprendizagem ? <Aprendizagem initialCourseId={cursoSelecionado.id} /> : Componente ? <Componente /> : <CatalogoAcademico onAbrirVisaoGeral={(curso) => navegar('visao', curso)} />}
            </section>
          )
        })()}
        {paginaAtual === 'visao' && <DashboardOverview
          key={studentToOpen?.requestId || 'dashboard'}
          course={cursoSelecionado}
          onSelectCourse={setCursoSelecionado}
          onNavigate={navegar}
          studentToOpen={studentToOpen}
          onStudentOpened={limparEstudanteSelecionado}
        />}
      </div>

      {(ajudaAberta || tutorialInicial) && <HelpCenter key={`${modoAjuda}-${tutorialInicial}`} open mode={tutorialInicial ? 'tutorial' : modoAjuda} page={paginaAtual} onClose={fecharAjuda} onNavigate={navegar} />}

    </main>
  )
}

export default App

function PerfilPage({ Componente, perfil, onTrocarPerfil, onSair, professor = false, aluno = false, onAbrirVisaoGeral }) {
  return (
    <main className={`min-h-screen px-5 py-6 sm:px-8 ${professor ? 'bg-[#f7f9fc] text-[#10213a] lg:py-3' : 'bg-[#f7f9fc] text-[#10213a]'}`}>
      <header className={`mx-auto flex items-center justify-between ${professor ? 'mb-3 max-w-[1500px]' : 'mb-7 max-w-[1100px]'}`}>
          <div>{!professor && <><p className="text-sm font-bold tracking-wide text-[#2875df]">EDULYTICS</p><p className="mt-1 text-sm text-slate-500">{aluno ? 'Área do aluno · somente consulta' : `Área de ${perfil}`}</p></>}</div>
        <div className="flex gap-2">
          {!aluno && <button onClick={onTrocarPerfil} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Trocar perfil</button>}
          <button onClick={onSair} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Sair</button>
        </div>
      </header>
      <section className={`mx-auto ${professor ? 'max-w-[1500px] bg-[#f7f9fc]' : 'max-w-[1100px] rounded-xl border border-[#d9e1eb] bg-white p-6 shadow-sm'}`}><Componente onAbrirVisaoGeral={onAbrirVisaoGeral} /></section>
    </main>
  )
}
