import { useState } from 'react'
import Login from './components/Login.jsx'
import Alunos from './components/alunos.jsx'
import Aprendizagem from './components/aprendizagem.jsx'
import Configuracoes from './components/configuracoes.jsx'
import Desempenho from './components/desempenho.jsx'
import Frequencia from './components/frequencia.jsx'
import Registro from './components/registro.jsx'
import Relatorio from './components/relatorio.jsx'
import './App.css'

const paginas = [
  { id: 'visao', nome: 'Visão geral', icone: '▦' },
  { id: 'alunos', nome: 'Alunos', icone: '♙', Componente: Alunos },
  { id: 'desempenho', nome: 'Desempenho', icone: '⌁', Componente: Desempenho },
  { id: 'relatorio', nome: 'Relatórios', icone: '▤', Componente: Relatorio },
  { id: 'frequencia', nome: 'Frequência', icone: '✓', Componente: Frequencia },
  { id: 'aprendizagem', nome: 'Aprendizagem', icone: '↗', Componente: Aprendizagem },
  { id: 'convivencia', nome: 'Convivência', icone: '◷' },
  { id: 'registro', nome: 'Registros docentes', icone: '✎', Componente: Registro },
  { id: 'configuracoes', nome: 'Configurações', icone: '⚙', Componente: Configuracoes },
]

const dimensoesIniciais = [
  { nome: 'Participação', total: 0 },
  { nome: 'Engajamento', total: 0 },
  { nome: 'Colaboração', total: 0 },
  { nome: 'Autonomia', total: 0 },
  { nome: 'Compreensão', total: 0 },
  { nome: 'Estratégias', total: 0 },
]

const observacoesIniciais = [
  {
    nome: 'Sarah Jensen', turma: '9º A', data: '24 set', dimensao: 'Participação',
    descricao: 'Compartilhou uma estratégia de resolução durante a atividade em grupo.',
    proximo: 'Convidar a explicar o raciocínio para a turma.',
  },
  {
    nome: 'Mateus Lima', turma: '9º A', data: '23 set', dimensao: 'Autonomia',
    descricao: 'Iniciou a atividade e consultou os materiais de referência sem lembrete.',
  },
  {
    nome: 'Ana Costa', turma: '9º B', data: '20 set', dimensao: 'Compreensão',
    descricao: 'Aplicou o conceito com apoio de um exemplo visual.',
    proximo: 'Retomar com material concreto na próxima aula.',
  },
]

function Icon({ type, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  }
  return <svg {...common}>{paths[type]}</svg>
}

function App() {
  const [paginaAtual, setPaginaAtual] = useState('login')
  const [menuAberto, setMenuAberto] = useState(false)
  const [selecionadas, setSelecionadas] = useState(dimensoesIniciais.map(({ nome }) => nome))
  const [observacoes, setObservacoes] = useState(observacoesIniciais)
  const [modalAberto, setModalAberto] = useState(false)

  function alternarDimensao(nome) {
    setSelecionadas((atuais) => atuais.includes(nome) ? atuais.filter((item) => item !== nome) : [...atuais, nome])
  }

  function adicionarObservacao(event) {
    event.preventDefault()
    const dados = new FormData(event.currentTarget)
    setObservacoes((atuais) => [{
      nome: dados.get('aluno'), turma: dados.get('turma'), data: 'Hoje',
      dimensao: dados.get('dimensao'), descricao: dados.get('descricao'),
      proximo: dados.get('proximo'),
    }, ...atuais])
    setModalAberto(false)
  }

  if (paginaAtual === 'login') {
    return <div className="min-h-screen bg-slate-100 text-slate-900"><Login onLogin={() => setPaginaAtual('visao')} /></div>
  }

  const paginaSelecionada = paginas.find(({ id }) => id === paginaAtual)

  return (
    <main className="dashboard min-h-screen bg-[#f7f9fc] px-4 py-4 text-[#10213a] sm:px-6">
      <header className="relative mx-auto mb-4 flex max-w-[1500px] items-start justify-between">
        <button onClick={() => setMenuAberto(!menuAberto)} aria-label="Abrir menu" className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><Icon type="menu" /></button>
        <div className="absolute left-1/2 top-0 -translate-x-1/2 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{paginaSelecionada?.nome}</h1>
          <p className="mt-1 whitespace-nowrap text-xs text-slate-600">Apoio à observação docente · Escola Central · Dados demonstrativos</p>
        </div>
        <button onClick={() => setPaginaAtual('login')} aria-label="Sair" className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><Icon type="logout" /></button>
      </header>

      {menuAberto && <div className="drawer-layer fixed inset-0 z-30">
        <button className="drawer-backdrop absolute inset-0 h-full w-full" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />
        <aside className="app-drawer absolute inset-y-0 left-0 flex w-[292px] max-w-[86vw] flex-col bg-white px-[14px] pb-4 pt-7 shadow-2xl" aria-label="Menu principal">
          <div className="flex items-center gap-3 px-2 pb-8">
            <div className="brand-icon flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#2875df]"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6"/></svg></div>
            <div><p className="text-[20px] font-bold tracking-wide text-slate-800">EDULYTICS</p><p className="mt-1 text-sm text-slate-500">Painel escolar</p></div>
            <button className="ml-auto self-start text-slate-400 md:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">×</button>
          </div>
          <p className="mb-2 px-3 text-[12px] font-medium uppercase tracking-[.08em] text-slate-400">Menu principal</p>
          <nav className="drawer-nav flex-1 space-y-1" aria-label="Navegação principal">{paginas.map(({ id, nome, icone }) => <button key={id} onClick={() => { setPaginaAtual(id); setMenuAberto(false) }} aria-current={paginaAtual === id ? 'page' : undefined} className={`drawer-item flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left text-[15px] font-semibold ${paginaAtual === id ? 'drawer-item-active' : ''}`}><span className="w-6 text-center text-[20px] leading-none">{icone}</span>{nome}</button>)}</nav>
          <div className="mt-4 flex items-center gap-3 border-t border-slate-200 px-1 pt-5"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfebf8] text-sm font-bold text-[#315f91]">AC</div><div><p className="text-sm font-semibold text-slate-800">Alex Chen</p><p className="mt-1 text-sm text-slate-500">Docente</p></div></div>
        </aside>
      </div>}

      <div className="app-content mx-auto max-w-[1500px]">
        {paginaAtual !== 'visao' && (() => { const Componente = paginaSelecionada?.Componente; return <section className="component-page rounded-xl border border-[#d9e1eb] bg-white p-6 shadow-sm"><div className="mb-5 border-b border-slate-200 pb-4"><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Escola Central</p><h2 className="mt-1 text-2xl font-bold">{paginaSelecionada?.nome}</h2></div>{Componente ? <Componente /> : <p className="text-sm text-slate-600">Esta seção estará disponível em breve.</p>}</section> })()}
        {paginaAtual === 'visao' && <>
        <section aria-label="Indicadores" className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Alunos', value: '1.248', badge: '42 turmas', icon: 'people' },
            { label: 'Frequência média', value: '94,8%', badge: 'Visão complementar', icon: 'calendar' },
            { label: 'Registros docentes', value: String(observacoes.length), badge: 'Neste período', icon: 'list' },
            { label: 'Dimensões observadas', value: '3', badge: 'Além de nota e presença', icon: 'plus' },
          ].map((card) => <article key={card.label} className="flex min-h-[82px] items-center justify-between rounded-xl border border-[#d9e1eb] bg-white px-4 py-3 shadow-[0_2px_5px_rgba(15,23,42,0.04)]">
            <div><p className="text-[12px] font-medium">{card.label}</p><div className="mt-1.5 flex items-center gap-2.5"><strong className="text-[24px] leading-none tracking-tight text-slate-950">{card.value}</strong><span className="rounded bg-[#e9f6f0] px-2 py-1 text-[10px] text-[#138466]">{card.badge}</span></div></div>
            <span className="flex h-[28px] w-[28px] items-center justify-center rounded-lg bg-[#eaf3ff] text-blue-600"><Icon type={card.icon} size={18} /></span>
          </article>)}
        </section>

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <section className="dashboard-card rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)]">
            <h2 className="text-[14px] font-bold">Registros por característica</h2>
            <p className="mt-3 text-[15px] text-slate-800">Selecione as dimensões que deseja considerar nesta leitura.</p>
            <div className="my-4 flex flex-wrap gap-x-4 gap-y-2">
              {dimensoesIniciais.map(({ nome }) => <label key={nome} className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-600"><input type="checkbox" checked={selecionadas.includes(nome)} onChange={() => alternarDimensao(nome)} className="h-4 w-4 accent-blue-600" />{nome}</label>)}
            </div>
            <div className="space-y-3.5">
              {dimensoesIniciais.filter(({ nome }) => selecionadas.includes(nome)).map(({ nome, total }) => <div key={nome} className="grid grid-cols-[minmax(100px,140px)_1fr_24px] items-center gap-3 text-[12px] text-slate-600"><span>{nome}</span><div className="h-[6px] overflow-hidden rounded-full bg-[#edf1f5]"><div className="h-full rounded-full bg-[#347fe0]" style={{ width: `${total ? 24 : 0}%` }} /></div><strong className="font-semibold text-slate-700">{total}</strong></div>)}
            </div>
            <div className="mt-3 border-t border-[#dfe6ee] pt-3 text-[12px] text-slate-500">Os dados são demonstrativos. As observações devem ser registradas pela equipe docente.</div>
          </section>

          <section className="dashboard-card rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-[#dfe6ee] pb-2.5"><h2 className="text-[14px] font-bold">Observações recentes</h2><button onClick={() => setModalAberto(true)} className="rounded-lg bg-[#2875df] px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-700">Novo registro</button></div>
            <div>{observacoes.map((obs, index) => <article key={`${obs.nome}-${index}`} className="border-b border-[#dfe6ee] py-3 last:border-b-0">
              <h3 className="text-[15px] font-bold text-[#1760b5]">{obs.nome}</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">{obs.turma} · {obs.data} · {obs.dimensao}</p>
              <p className="mt-3 text-[12px] leading-[18px] text-slate-600">{obs.descricao}</p>
              {obs.proximo && <p className="mt-3 text-[12px] leading-[18px] text-slate-600"><strong className="text-slate-800">Próximo passo:</strong><br />{obs.proximo}</p>}
            </article>)}</div>
          </section>
        </div>
        </>}
      </div>

      {modalAberto && <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalAberto(false) }}><form onSubmit={adicionarObservacao} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Novo registro</h2><button type="button" onClick={() => setModalAberto(false)} className="text-xl text-slate-500" aria-label="Fechar">×</button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Aluno<input name="aluno" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Nome do aluno" /></label><label className="text-sm font-medium">Turma<input name="turma" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Ex.: 9º A" /></label><label className="text-sm font-medium sm:col-span-2">Dimensão<select name="dimensao" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal">{dimensoesIniciais.map(({ nome }) => <option key={nome}>{nome}</option>)}</select></label><label className="text-sm font-medium sm:col-span-2">Observação<textarea name="descricao" required rows="3" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Descreva o que foi observado" /></label><label className="text-sm font-medium sm:col-span-2">Próximo passo (opcional)<input name="proximo" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="Ação para acompanhar" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setModalAberto(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Salvar registro</button></div></form></div>}
    </main>
  )
}

export default App
