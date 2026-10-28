import { useMemo, useState } from 'react'
import aprenderIcon from '../assets/aprender.png'

const cursos = [
  { id: 1, nome: 'Desenvolvimento Web', descricao: 'Aprenda a criar aplicações web modernas com HTML, CSS, JavaScript, React e Tailwind.', status: 'Em andamento', alunos: 12, carga: '80h', cor: 'blue', professor: 'Lucas Ferreira' },
  { id: 2, nome: 'Python para Iniciantes', descricao: 'Introdução à linguagem Python, com foco em lógica de programação e projetos práticos.', status: 'Em breve', alunos: 8, carga: '60h', cor: 'sky', professor: 'Ana Souza' },
  { id: 3, nome: 'Banco de Dados', descricao: 'Aprenda a modelar, criar e gerenciar bancos de dados com SQL e PostgreSQL.', status: 'Em andamento', alunos: 8, carga: '60h', cor: 'violet', professor: 'Carlos Mendes' },
  { id: 4, nome: 'Computação em Nuvem', descricao: 'Entenda os conceitos de cloud computing e aprenda a usar as principais plataformas.', status: 'Concluído', alunos: 15, carga: '40h', cor: 'blue' },
  { id: 5, nome: 'Ciência de Dados', descricao: 'Explore análise de dados, visualização e machine learning com Python.', status: 'Em andamento', alunos: 10, carga: '100h', cor: 'emerald', professor: 'Rafael Costa' },
  { id: 6, nome: 'Desenvolvimento Mobile', descricao: 'Crie aplicações móveis nativas e multiplataforma com React Native.', status: 'Em breve', alunos: 0, carga: '70h', cor: 'orange' },
]

const nomesAlunos = ['Lucas Almeida', 'Mariana Santos', 'Felipe Oliveira', 'Beatriz Costa', 'Rafael Pereira', 'Camila Rodrigues', 'Pedro Martins', 'Ana Clara Souza', 'João Pedro Lima', 'Isabela Ferreira', 'Gabriel Rocha', 'Laura Mendes', 'Matheus Carvalho', 'Sofia Ribeiro', 'Enzo Martins']
const alunos = cursos.flatMap((curso, indiceCurso) => nomesAlunos.slice(0, curso.alunos).map((nome, indice) => ({ nome, curso: curso.nome, inicial: nome.split(' ').map((parte) => parte[0]).join('').slice(0, 2), id: `${indiceCurso}-${indice}` })))

function Icon({ children, className = 'size-5' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
}

function SearchIcon({ className = 'size-4' }) {
  return <Icon className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Icon>
}

export default function Professor({ onAbrirVisaoGeral = () => {} }) {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('Todos')
  const [ordenacao, setOrdenacao] = useState('Nome (A-Z)')
  const [pagina, setPagina] = useState(1)
  const [buscaAluno, setBuscaAluno] = useState('')
  const [somenteMeusAlunos, setSomenteMeusAlunos] = useState(true)
  const [verTodosAlunos, setVerTodosAlunos] = useState(false)

  const meusCursos = cursos
  const cursosFiltrados = useMemo(() => meusCursos.filter((curso) => {
    const texto = `${curso.nome} ${curso.descricao}`.toLocaleLowerCase('pt-BR')
    return texto.includes(busca.toLocaleLowerCase('pt-BR')) && (status === 'Todos' || curso.status === status)
  }).sort((a, b) => ordenacao === 'Nome (Z-A)' ? b.nome.localeCompare(a.nome, 'pt-BR') : ordenacao === 'Mais alunos' ? b.alunos - a.alunos : a.nome.localeCompare(b.nome, 'pt-BR')), [busca, meusCursos, ordenacao, status])
  const paginasTotais = Math.max(1, Math.ceil(cursosFiltrados.length / 3))
  const cursosVisiveis = cursosFiltrados.slice((pagina - 1) * 3, pagina * 3)
  const totalAlunosCursos = cursos.reduce((total, curso) => total + curso.alunos, 0)
  const cursosEmAndamento = cursos.filter((curso) => curso.status === 'Em andamento').length
  const alunosVisiveis = useMemo(() => alunos.filter((aluno) => {
    const curso = cursos.find((item) => item.nome === aluno.curso)
    return (!somenteMeusAlunos || curso?.id !== 4 && curso?.id !== 6) && `${aluno.nome} ${aluno.curso}`.toLocaleLowerCase('pt-BR').includes(buscaAluno.toLocaleLowerCase('pt-BR'))
  }), [buscaAluno, somenteMeusAlunos])
  const listaAlunos = verTodosAlunos ? alunosVisiveis : alunosVisiveis.slice(0, 5)

  return (
    <div className="professor-page -mx-6 grid min-h-[calc(100vh-190px)] gap-4 bg-[#f7f9fc] px-6 py-3 text-[#10213a] lg:grid-cols-[minmax(0,1fr)_318px] lg:gap-3 lg:py-2">
      <section className="min-w-0">
        <header className="mb-3 lg:mb-2">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#eaf3ff] lg:mb-1 lg:size-8"><img src={aprenderIcon} alt="EDULYTICS" className="size-7 object-contain lg:size-6" /></div>
          <h1 className="text-[27px] font-bold tracking-tight text-[#10213a]">Cursos</h1>
          <p className="mt-0.5 text-sm text-slate-700">Gerencie e acompanhe todos os cursos da sua instituição.</p>
          <p className="mt-1 max-w-3xl text-xs leading-[18px] text-slate-500">Aqui você pode visualizar e acessar as informações dos cursos, além de acompanhar os alunos e professores responsáveis.</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500" aria-label="Resumo dos cursos">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e1eaf5] bg-white px-2 py-1"><strong className="text-[#1767d2]">{cursos.length}</strong> cursos</span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#d8eee8] bg-[#f4fbf8] px-2 py-1"><span className="size-1.5 rounded-full bg-emerald-500" /><strong className="text-emerald-700">{cursosEmAndamento}</strong> em andamento</span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e1eaf5] bg-white px-2 py-1"><strong className="text-[#10213a]">{totalAlunosCursos}</strong> matrículas</span>
          </div>
        </header>

        <div className="mb-3 grid gap-2 rounded-xl border border-[#d9e1eb] bg-white p-2 shadow-[0_2px_8px_rgba(15,23,42,0.035)] sm:grid-cols-[minmax(0,1fr)_160px_170px] lg:mb-2 lg:p-1.5">
          <label className="relative block"><span className="sr-only">Buscar cursos</span><SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-[17px] -translate-y-1/2 text-[#2875df]" /><input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1) }} placeholder="Buscar cursos..." className="h-9 w-full rounded-lg border border-[#d2deeb] bg-[#fbfdff] pl-10 pr-3 text-xs text-[#10213a] outline-none transition focus:border-[#3980e6] focus:ring-2 focus:ring-[#3980e6]/10 placeholder:text-slate-400" /></label>
          <label className="flex items-center gap-2 text-[10px] text-slate-600"><span className="shrink-0">Filtrar:</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPagina(1) }} className="h-9 min-w-0 flex-1 rounded-lg border border-[#d2deeb] bg-[#fbfdff] px-2 text-xs text-[#10213a] outline-none transition focus:border-[#3980e6] focus:ring-2 focus:ring-[#3980e6]/10"><option>Todos</option><option>Em andamento</option><option>Em breve</option><option>Concluído</option></select></label>
          <label className="flex items-center gap-2 text-[10px] text-slate-600"><span className="shrink-0">Ordenar:</span><select value={ordenacao} onChange={(event) => { setOrdenacao(event.target.value); setPagina(1) }} className="h-9 min-w-0 flex-1 rounded-lg border border-[#d2deeb] bg-[#fbfdff] px-2 text-xs text-[#10213a] outline-none transition focus:border-[#3980e6] focus:ring-2 focus:ring-[#3980e6]/10"><option>Nome (A-Z)</option><option>Nome (Z-A)</option><option>Mais alunos</option></select></label>
        </div>

        <div className="space-y-2.5">
          {cursosVisiveis.map((curso) => <button key={curso.id} type="button" onClick={onAbrirVisaoGeral} className="group relative grid w-full gap-4 overflow-hidden rounded-xl border border-[#d9e1eb] bg-white p-4 text-left shadow-[0_3px_10px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#9bbdec] hover:bg-[#fcfdff] hover:shadow-[0_8px_20px_rgba(40,117,223,0.11)] active:scale-[0.998] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2875df] sm:grid-cols-[minmax(0,1fr)_170px_18px] sm:items-center lg:p-3">
            <span className={`absolute inset-y-0 left-0 w-1 ${curso.status === 'Em andamento' ? 'bg-emerald-400' : curso.status === 'Concluído' ? 'bg-slate-300' : 'bg-[#2875df]'}`} aria-hidden="true" />
            <span className="min-w-0 pl-1"><span className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-bold tracking-[-0.01em] text-[#10213a] transition-colors group-hover:text-[#1767d2]">{curso.nome}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${curso.status === 'Em andamento' ? 'bg-emerald-50 text-emerald-700' : curso.status === 'Concluído' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}><span className={`size-1.5 rounded-full ${curso.status === 'Em andamento' ? 'bg-emerald-500' : curso.status === 'Concluído' ? 'bg-slate-400' : 'bg-blue-500'}`} />{curso.status}</span></span><span className="mt-1.5 block max-w-3xl text-xs leading-[18px] text-slate-600">{curso.descricao}</span><span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[#7890aa]">Detalhes do curso <span className="text-[#2875df] transition-transform group-hover:translate-x-1">→</span></span></span>
            <span className="grid grid-cols-2 gap-2 sm:grid-cols-1"><span className="flex items-center gap-2 rounded-lg bg-[#f5f8fc] px-2.5 py-2 text-[11px] text-slate-600"><Icon className="size-4 shrink-0 text-[#2875df]"><><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 11a3 3 0 0 0 0-6M18 14a5 5 0 0 1 3 5v1" /></></Icon><span><strong className="font-semibold text-[#10213a]">{curso.alunos}</strong> alunos</span></span><span className="flex items-center gap-2 rounded-lg bg-[#f5f8fc] px-2.5 py-2 text-[11px] text-slate-600"><Icon className="size-4 shrink-0 text-[#2875df]"><><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></></Icon><span><strong className="font-semibold text-[#10213a]">{curso.carga}</strong> de carga</span></span></span>
            <span className="hidden size-8 items-center justify-center rounded-full bg-[#edf4fc] text-lg text-[#2875df] transition group-hover:bg-[#2875df] group-hover:text-white sm:flex" aria-hidden="true">›</span>
          </button>)}
          {cursosFiltrados.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-700">Nenhum curso encontrado</p><p className="mt-1 text-xs text-slate-500">Tente mudar o termo da pesquisa ou os filtros.</p></div>}
        </div>
        <nav aria-label="Paginação dos cursos" className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600"><button onClick={() => setPagina((atual) => Math.max(1, atual - 1))} disabled={pagina === 1} className="px-1 text-[#2875df] disabled:opacity-40" aria-label="Página anterior">‹</button>{Array.from({ length: paginasTotais }, (_, indice) => indice + 1).map((numero) => <button key={numero} onClick={() => setPagina(numero)} aria-current={pagina === numero ? 'page' : undefined} className={`size-8 rounded-md ${pagina === numero ? 'bg-[#2875df] text-white' : 'hover:bg-slate-100'}`}>{numero}</button>)}<button onClick={() => setPagina((atual) => Math.min(paginasTotais, atual + 1))} disabled={pagina === paginasTotais} className="px-1 text-[#2875df] disabled:opacity-40" aria-label="Próxima página">›</button></nav>
      </section>

      <aside>
        <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)] lg:p-3">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-[#10213a]"><Icon className="size-[18px] text-[#2875df]"><><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></></Icon>Alunos do Curso</h2><button onClick={() => setVerTodosAlunos((valor) => !valor)} className="text-[11px] font-semibold text-[#1767d2] hover:underline">Ver todos</button></div>
          <div className="mt-3 flex items-center -space-x-2" aria-hidden="true">{alunosVisiveis.slice(0, 5).map((aluno, indice) => <span key={aluno.id} className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white ${['bg-blue-500', 'bg-sky-700', 'bg-slate-500', 'bg-violet-500', 'bg-indigo-400'][indice]}`}>{aluno.inicial}</span>)}<span className="ml-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#eaf3ff] text-[9px] text-[#315f91]">+8</span></div>
          <p className="mt-2 text-xs text-slate-600">{alunosVisiveis.length} alunos matriculados</p>
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#d9e1eb] bg-slate-50 px-2.5 py-2 text-[10px] text-slate-600"><span>Apenas alunos do professor</span><input type="checkbox" checked={somenteMeusAlunos} onChange={(event) => setSomenteMeusAlunos(event.target.checked)} className="size-4 accent-[#2875df]" /></label>
          <label className="relative mt-2.5 block"><span className="sr-only">Buscar aluno</span><SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#2875df]" /><input value={buscaAluno} onChange={(event) => setBuscaAluno(event.target.value)} placeholder="Buscar aluno..." className="h-9 w-full rounded-lg border border-[#d2deeb] bg-white pl-8 pr-2 text-[11px] text-[#10213a] outline-none placeholder:text-slate-400 focus:border-[#3980e6]" /></label>
          <ul className="mt-2 divide-y divide-slate-100">{listaAlunos.map((aluno) => <li key={aluno.id} className="flex items-center gap-2 py-2 lg:py-1.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d4e1f1] bg-[#eaf3ff] text-[9px] font-bold text-[#315f91]">{aluno.inicial}</span><span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-slate-700">{aluno.nome}</span><span className="block text-[10px] text-emerald-600">● Ativo</span></span></li>)}{alunosVisiveis.length === 0 && <li className="py-4 text-center text-[11px] text-slate-500">Nenhum aluno corresponde à pesquisa.</li>}</ul>
          {alunosVisiveis.length > 5 && <button onClick={() => setVerTodosAlunos((valor) => !valor)} className="mt-1 pl-10 text-[11px] font-semibold text-[#1767d2] hover:underline">{verTodosAlunos ? 'Mostrar menos' : 'Ver todos os alunos'} →</button>}
        </section>

      </aside>
    </div>
  )
}
