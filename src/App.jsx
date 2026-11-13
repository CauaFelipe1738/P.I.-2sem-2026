import { lazy, Suspense, useEffect, useState } from 'react'
import menuIcon from './assets/menu-aberto.png'
import visaoIcon from './assets/visaogeral.png'
import desempenhoIcon from './assets/desempenho.png'
import frequenciaIcon from './assets/frequencia.png'
import aprenderIcon from './assets/aprender.png'
import alunosResumoIcon from './assets/alunos vg.png'
import calendarioIcon from './assets/calendario.png'
import registrosIcon from './assets/registros.png'
import alunoFoto from './assets/otimizadas/aluno.jpg'
import professorFoto from './assets/otimizadas/professor.jpg'
import coordenacaoFoto from './assets/otimizadas/diretor.jpg'
import CatalogoAcademico from './components/CatalogoAcademico.jsx'
import Aprendizagem from './components/aprendizagem.jsx'
import Desempenho from './components/desempenho.jsx'
import Frequencia from './components/frequencia.jsx'
import { cursos as cursosAcademicos } from './data/dadosAcademicos.js'
import { useAcademicData } from './data/academicoStore.js'
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

// Uma lista única mantém consistentes as opções do gráfico e do formulário de observações.
const dimensoesIniciais = [
  { nome: 'Participação' },
  { nome: 'Engajamento' },
  { nome: 'Colaboração' },
  { nome: 'Autonomia' },
  { nome: 'Compreensão' },
  { nome: 'Estratégias' },
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
  const [selecionadas, setSelecionadas] = useState(dimensoesIniciais.map(({ nome }) => nome))
  const [cursoSelecionado, setCursoSelecionado] = useState(cursosAcademicos[0])
  const dadosAcademicos = useAcademicData()
  const registrosCurso = dadosAcademicos.learning.filter((record) => record.courseId === cursoSelecionado.id)

  useEffect(() => {
    // popstate é necessário porque o histórico não atualiza o estado React sozinho.
    if (!window.history.state?.pagina) window.history.replaceState({ pagina: 'login' }, '')
    const sincronizarPagina = (event) => {
      if (event.state?.pagina) setPaginaAtual(event.state.pagina)
    }
    window.addEventListener('popstate', sincronizarPagina)
    return () => window.removeEventListener('popstate', sincronizarPagina)
  }, [])

  function navegar(pagina, curso = cursoSelecionado) {
    if (pagina === paginaAtual) return
    setCursoSelecionado(curso)
    window.history.pushState({ pagina }, '')
    setPaginaAtual(pagina)
  }

  useEffect(() => {
    function fecharMenuPeloTeclado(event) {
      if (event.key === 'Escape') setMenuAberto(false)
    }

    window.addEventListener('keydown', fecharMenuPeloTeclado)
    return () => window.removeEventListener('keydown', fecharMenuPeloTeclado)
  }, [])

  function alternarDimensao(nome) {
    setSelecionadas((atuais) =>
      atuais.includes(nome)
        ? atuais.filter((item) => item !== nome)
        : [...atuais, nome],
    )
  }

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

  if (paginaAtual === 'aluno') return <Suspense fallback={carregando}><PerfilPage Componente={Alunos} perfil={perfil} onTrocarPerfil={() => { setPerfil(null); navegar('perfil') }} onSair={() => { setPerfil(null); navegar('login') }} /></Suspense>
  if (paginaAtual === 'professor') return <Suspense fallback={carregando}><PerfilPage Componente={Professor} perfil={perfil} onTrocarPerfil={() => { setPerfil(null); navegar('perfil') }} onSair={() => { setPerfil(null); navegar('login') }} professor onAbrirVisaoGeral={(curso) => navegar('visao', curso)} /></Suspense>
  if (paginaAtual === 'coordenador') return <Suspense fallback={carregando}><PerfilPage Componente={Coordenador} perfil={perfil} onTrocarPerfil={() => { setPerfil(null); navegar('perfil') }} onSair={() => { setPerfil(null); navegar('login') }} /></Suspense>

  const paginaSelecionada = paginas.find(({ id }) => id === paginaAtual)

  return (
    <main className="dashboard min-h-screen bg-[#f7f9fc] px-5 py-6 text-[#10213a] sm:px-8">
      <header className="sticky top-0 z-20 relative mx-auto mb-7 flex max-w-[1500px] items-start justify-between border-b border-slate-200/70 bg-[#f7f9fc]/95 py-2 backdrop-blur">
        <div className="mt-1 flex gap-2"><button onClick={() => window.history.back()} aria-label="Voltar à página anterior" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50">‹</button><button onClick={() => setMenuAberto(!menuAberto)} aria-label="Abrir menu" aria-expanded={menuAberto} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><img src={menuIcon} alt="" className="menu-trigger-icon" /></button></div>
        <div className="absolute left-1/2 top-0 -translate-x-1/2 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{paginaSelecionada?.nome}</h1>
          <p className="mt-1 whitespace-nowrap text-xs text-slate-600">{paginaAtual === 'visao' ? cursoSelecionado.nome : 'Apoio à observação docente · Escola Central'}</p>
        </div>
        <button onClick={() => navegar('login')} aria-label="Sair" className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><Icon type="logout" /></button>
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
        {/* A Visão Geral continua usando observações locais do protótipo; os dados acadêmicos ausentes não são estimados. */}
        {/* Os dados acadêmicos ausentes são sinalizados; não são calculados a partir de estimativas. */}
        {paginaAtual === 'visao' && <>
        <section aria-label="Indicadores" className="dashboard-stats mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Alunos matriculados', value: String(cursoSelecionado.alunos), badge: 'Neste curso', icon: alunosResumoIcon },
            { label: 'Carga horária', value: cursoSelecionado.carga, badge: cursoSelecionado.status, icon: calendarioIcon },
            { label: 'Registros de aprendizagem', value: String(registrosCurso.length), badge: 'Neste curso', icon: registrosIcon },
          ].map((card) => <article key={card.label} className="flex min-h-[82px] items-center justify-between rounded-xl border border-[#d9e1eb] bg-white px-4 py-3 shadow-[0_2px_5px_rgba(15,23,42,0.04)]">
            <div><p className="text-[12px] font-medium">{card.label}</p><div className="mt-1.5 flex items-center gap-2.5"><strong className="text-[24px] leading-none tracking-tight text-slate-950">{card.value}</strong><span className="rounded bg-[#e9f6f0] px-2 py-1 text-[10px] text-[#138466]">{card.badge}</span></div></div>
            <span className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-[#eaf3ff]"><img src={card.icon} alt="" className="dashboard-stat-icon" /></span>
          </article>)}
        </section>

        <section className="mb-5 rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Curso selecionado</p><h2 className="mt-1 text-xl font-bold">{cursoSelecionado.nome}</h2><p className="mt-2 max-w-3xl text-sm text-slate-600">{cursoSelecionado.descricao}</p></div><div className="flex gap-3 text-sm"><span className="rounded-lg bg-slate-50 px-3 py-2"><strong>{cursoSelecionado.carga}</strong><br />Carga horária</span><span className="rounded-lg bg-slate-50 px-3 py-2"><strong>{cursoSelecionado.professor || 'Não informado'}</strong><br />Responsável</span></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Selecionar curso<select value={cursoSelecionado.id} onChange={(event) => setCursoSelecionado(cursosAcademicos.find((curso) => curso.id === Number(event.target.value)))} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800">{cursosAcademicos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nome}</option>)}</select></label><div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">Notas, frequência, entregas, disciplinas e turmas não estão cadastradas. Indicadores correspondentes ficam indisponíveis até haver dados acadêmicos integrados.</div></div></section>

        <div className="dashboard-panels grid items-stretch gap-5 lg:grid-cols-2">
          <section className="dashboard-card rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)]">
            <h2 className="text-[14px] font-bold">Registros por característica</h2>
            <p className="mt-3 text-[15px] text-slate-800">Selecione as dimensões que deseja considerar nesta leitura.</p>
            <div className="my-4 flex flex-wrap gap-x-4 gap-y-2">
              {dimensoesIniciais.map(({ nome }) => <label key={nome} className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-600"><input type="checkbox" checked={selecionadas.includes(nome)} onChange={() => alternarDimensao(nome)} className="h-4 w-4 accent-blue-600" />{nome}</label>)}
            </div>
            <div className="space-y-3.5">
              {dimensoesIniciais.filter(({ nome }) => selecionadas.includes(nome)).map(({ nome }) => { const checks = { Participação: ['Participou das atividades'], Engajamento: ['Participou da aula', 'Participou das atividades'], Colaboração: ['Participou em grupo'], Autonomia: ['Realizou atividades sozinho'], Compreensão: ['Compreendeu o conteúdo'], Estratégias: ['Necessitou de auxílio', 'Desenvolveu habilidade esperada'] }[nome] || []; const total = registrosCurso.filter((record) => record.checks?.some((check) => checks.includes(check))).length; return <div key={nome} className="grid grid-cols-[minmax(100px,140px)_1fr_24px] items-center gap-3 text-[12px] text-slate-600"><span>{nome}</span><div className="h-[6px] overflow-hidden rounded-full bg-[#edf1f5]"><div className="h-full rounded-full bg-[#347fe0]" style={{ width: `${Math.min(100, total * 20)}%` }} /></div><strong className="font-semibold text-slate-700">{total}</strong></div>})}
            </div>
            <div className="mt-3 border-t border-[#dfe6ee] pt-3 text-[12px] text-slate-500">Indicadores calculados a partir dos registros salvos em Aprendizagem.</div>
          </section>

          <section className="dashboard-card rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-[#dfe6ee] pb-2.5"><h2 className="text-[14px] font-bold">Registros recentes de aprendizagem</h2><button onClick={() => navegar('aprendizagem', cursoSelecionado)} className="rounded-lg bg-[#2875df] px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-700">Novo registro</button></div>
            <div>{registrosCurso.slice(0, 4).map((record) => <article key={record.id} className="border-b border-[#dfe6ee] py-3 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><h3 className="text-[15px] font-bold text-[#1760b5]">{record.studentName}</h3><span className="text-[11px] text-slate-500">{record.date}</span></div>
              <p className="mt-0.5 text-[11px] text-slate-500">{record.subject} · {record.category}</p>
              <p className="mt-2 text-[12px] leading-[18px] text-slate-600">{record.description}</p>
              {(record.action || record.plan?.goal) && <p className="mt-2 text-[11px] text-slate-600"><strong className="text-slate-800">Próximo passo:</strong> {record.action || record.plan.goal}</p>}
            </article>)}{registrosCurso.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nenhum registro de aprendizagem para este curso.</p>}</div>
          </section>
        </div>
        </>}
      </div>

    </main>
  )
}

export default App

function PerfilPage({ Componente, perfil, onTrocarPerfil, onSair, professor = false, onAbrirVisaoGeral }) {
  return (
    <main className={`min-h-screen px-5 py-6 sm:px-8 ${professor ? 'bg-[#f7f9fc] text-[#10213a] lg:py-3' : 'bg-[#f7f9fc] text-[#10213a]'}`}>
      <header className={`mx-auto flex items-center justify-between ${professor ? 'mb-3 max-w-[1500px]' : 'mb-7 max-w-[1100px]'}`}>
          <div>{!professor && <><p className="text-sm font-bold tracking-wide text-[#2875df]">EDULYTICS</p><p className="mt-1 text-sm text-slate-500">Área de {perfil}</p></>}</div>
        <div className="flex gap-2">
          <button onClick={onTrocarPerfil} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Trocar perfil</button>
          <button onClick={onSair} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Sair</button>
        </div>
      </header>
      <section className={`mx-auto ${professor ? 'max-w-[1500px] bg-[#f7f9fc]' : 'max-w-[1100px] rounded-xl border border-[#d9e1eb] bg-white p-6 shadow-sm'}`}><Componente onAbrirVisaoGeral={onAbrirVisaoGeral} /></section>
    </main>
  )
}
