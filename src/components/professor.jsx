import { useMemo, useState } from 'react'

const cursos = [
  { id: 1, nome: 'Desenvolvimento Web', descricao: 'Aprenda a criar aplicações web modernas com HTML, CSS e JavaScript.', status: 'Em andamento', alunos: 12, carga: '80h', cor: 'blue', meus: true },
  { id: 2, nome: 'Python para Iniciantes', descricao: 'Introdução à linguagem Python, com foco em lógica de programação e projetos práticos.', status: 'Em breve', alunos: 8, carga: '60h', cor: 'amber', meus: true },
  { id: 3, nome: 'Banco de Dados', descricao: 'Aprenda a modelar, criar e gerenciar bancos de dados com SQL e PostgreSQL.', status: 'Em andamento', alunos: 8, carga: '60h', cor: 'violet', meus: true },
  { id: 4, nome: 'Computação em Nuvem', descricao: 'Entenda os conceitos de cloud computing e aprenda a usar as principais plataformas.', status: 'Concluído', alunos: 15, carga: '40h', cor: 'sky', meus: false },
  { id: 5, nome: 'Ciência de Dados', descricao: 'Explore análise de dados, visualização e machine learning com Python.', status: 'Em andamento', alunos: 10, carga: '100h', cor: 'emerald', meus: true },
  { id: 6, nome: 'Desenvolvimento Mobile', descricao: 'Crie aplicações móveis nativas e multiplataforma com React Native.', status: 'Em breve', alunos: 6, carga: '70h', cor: 'orange', meus: false },
]

const nomesAlunos = [
  'Lucas Almeida', 'Mariana Santos', 'Felipe Oliveira', 'Beatriz Costa',
  'Rafael Pereira', 'Camila Rodrigues', 'Pedro Martins', 'Ana Clara Souza',
  'João Pedro Lima', 'Isabela Ferreira', 'Gabriel Rocha', 'Laura Mendes',
  'Matheus Carvalho', 'Sofia Ribeiro', 'Enzo Martins',
]

const alunos = cursos.flatMap((curso, indiceCurso) =>
  nomesAlunos.slice(0, curso.alunos).map((nome, indice) => ({
    nome,
    curso: curso.nome,
    inicial: nome.split(' ').map((parte) => parte[0]).join('').slice(0, 2),
    id: String(indiceCurso) + '-' + String(indice),
  })),
)

const cores = {
  blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700', sky: 'bg-sky-100 text-sky-700',
  emerald: 'bg-emerald-100 text-emerald-700', orange: 'bg-orange-100 text-orange-700',
}

function Icon({ children, className = 'size-5' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
}

export default function Professor() {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('Todos')
  const [aba, setAba] = useState('Todos os cursos')
  const [ordenacao, setOrdenacao] = useState('Nome A-Z')
  const [somenteMeusAlunos, setSomenteMeusAlunos] = useState(true)
  const [verTodosAlunos, setVerTodosAlunos] = useState(false)
  const [buscaAluno, setBuscaAluno] = useState('')
  const [cursoSelecionado, setCursoSelecionado] = useState(null)

  const cursosFiltrados = useMemo(() => cursos.filter((curso) => {
    const correspondeBusca = `${curso.nome} ${curso.descricao}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))
    const correspondeStatus = status === 'Todos' || curso.status === status
    const correspondeAba = aba !== 'Meus cursos' || curso.meus
    return correspondeBusca && correspondeStatus && correspondeAba
  }).sort((a, b) => ordenacao === 'Nome Z-A' ? b.nome.localeCompare(a.nome, 'pt-BR') : ordenacao === 'Mais alunos' ? b.alunos - a.alunos : a.nome.localeCompare(b.nome, 'pt-BR')), [aba, busca, ordenacao, status])

  const alunosVisiveis = useMemo(() => alunos.filter((aluno) => {
    const cursoDoProfessor = cursos.some((curso) => curso.nome === aluno.curso && curso.meus)
    const cursoAtual = !cursoSelecionado || aluno.curso === cursoSelecionado
    const pertenceAoProfessor = !somenteMeusAlunos || cursoDoProfessor
    return cursoAtual && pertenceAoProfessor && aluno.nome.toLocaleLowerCase('pt-BR').includes(buscaAluno.toLocaleLowerCase('pt-BR'))
  }), [buscaAluno, cursoSelecionado, somenteMeusAlunos])

  const alunosMostrados = verTodosAlunos ? alunosVisiveis : alunosVisiveis.slice(0, 5)

  if (cursoSelecionado) {
    const curso = cursos.find((item) => item.nome === cursoSelecionado)
    const alunosMatriculados = alunos.filter((aluno) => aluno.curso === curso?.nome)
    const alunosDoCurso = alunosMatriculados.filter((aluno) => aluno.nome.toLocaleLowerCase('pt-BR').includes(buscaAluno.toLocaleLowerCase('pt-BR')))

    return (
      <div className="space-y-5">
        <button onClick={() => setCursoSelecionado(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#1767d2] hover:underline"><span aria-hidden="true">←</span> Voltar aos cursos</button>
        <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.03)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Visão geral do curso</p><h1 className="mt-1 text-2xl font-bold text-[#10213a]">{curso?.nome}</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">{curso?.descricao}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">{curso?.status}</span></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><article className="rounded-lg bg-[#f7f9fc] p-4"><p className="text-xs text-slate-500">Alunos matriculados</p><p className="mt-1 font-semibold text-[#10213a]">{alunosMatriculados.length}</p></article><article className="rounded-lg bg-[#f7f9fc] p-4"><p className="text-xs text-slate-500">Carga horaria</p><p className="mt-1 font-semibold text-[#10213a]">{curso?.carga}</p></article></div>
        </section>
        <section className="rounded-xl border border-[#d9e1eb] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.03)]"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-[#10213a]">Alunos do curso</h2><p className="mt-1 text-xs text-slate-500">{alunosDoCurso.length} alunos listados</p></div><label className="relative block"><span className="sr-only">Buscar aluno</span><Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Icon><input value={buscaAluno} onChange={(event) => setBuscaAluno(event.target.value)} placeholder="Buscar aluno..." className="h-10 w-full rounded-lg border border-[#d2deeb] pl-9 pr-3 text-xs outline-none focus:border-[#3980e6] sm:w-56" /></label></div><ul className="mt-3 divide-y divide-slate-100">{alunosDoCurso.map((aluno) => <li key={aluno.id} className="flex items-center gap-3 py-3"><span className="flex size-9 items-center justify-center rounded-full bg-[#eaf3ff] text-xs font-bold text-[#315f91]">{aluno.inicial}</span><span className="text-sm font-semibold text-slate-700">{aluno.nome}</span></li>)}{alunosDoCurso.length === 0 && <li className="py-5 text-sm text-slate-500">Nenhum aluno encontrado.</li>}</ul></section>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_230px]">
      <section className="min-w-0">
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Cursos da instituição</p>
          <h1 className="mt-1 text-2xl font-bold text-[#10213a]">Cursos</h1>
          <p className="mt-2 text-sm text-slate-600">Gerencie seus cursos e acompanhe os alunos matriculados.</p>
        </header>

        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_145px_145px]">
          <label className="relative block">
            <span className="sr-only">Pesquisar cursos</span>
            <Icon className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Icon>
            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar curso..." className="h-11 w-full rounded-lg border border-[#d2deeb] bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#3980e6] focus:ring-3 focus:ring-[#3980e6]/15" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><span className="shrink-0">Filtrar por</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-[#d2deeb] bg-white px-3 text-sm outline-none focus:border-[#3980e6]"><option>Todos</option><option>Em andamento</option><option>Em breve</option><option>Concluído</option></select></label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><span className="shrink-0">Ordenar</span><select value={ordenacao} onChange={(event) => setOrdenacao(event.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-[#d2deeb] bg-white px-3 text-sm outline-none focus:border-[#3980e6]"><option>Nome A-Z</option><option>Nome Z-A</option><option>Mais alunos</option></select></label>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {['Todos os cursos', 'Meus cursos'].map((item) => <button key={item} onClick={() => setAba(item)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${aba === item ? 'bg-[#2875df] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{item}<span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${aba === item ? 'bg-white/20' : 'bg-slate-100'}`}>{item === 'Meus cursos' ? cursos.filter((curso) => curso.meus).length : cursos.length}</span></button>)}
        </div>

        <div className="space-y-3">
          {cursosFiltrados.map((curso) => <button key={curso.id} onClick={() => { setBuscaAluno(''); setCursoSelecionado(curso.nome) }} aria-label={`Abrir visão geral de ${curso.nome}`} className="grid w-full gap-3 rounded-xl border border-[#d9e1eb] bg-white p-3 text-left shadow-[0_2px_5px_rgba(15,23,42,0.03)] transition hover:border-[#9bbdec] sm:grid-cols-[40px_minmax(0,1fr)_145px_16px] sm:items-center">
            <span className={`flex size-10 items-center justify-center rounded-xl ${cores[curso.cor]}`}>
              <Icon className="size-5">
                {curso.id === 1 && <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></>}
                {curso.id === 2 && <><path d="M8 7a3 3 0 1 0 0 6h8a3 3 0 1 0-3-3" /><path d="M16 17a3 3 0 1 0 0-6H8a3 3 0 1 0 3 3" /></>}
                {curso.id === 3 && <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>}
                {curso.id === 4 && <path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9Z" />}
                {curso.id === 5 && <><path d="M4 20V11M10 20V5M16 20v-8M22 20V8" /><path d="M2 20h21" /></>}
                {curso.id === 6 && <><rect x="6" y="2.5" width="12" height="19" rx="2" /><path d="M10 5h4M11 18.5h2" /></>}
              </Icon>
            </span>
            <span className="min-w-0"><span className="block font-bold text-[#10213a]">{curso.nome}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{curso.descricao}</span></span>
            <span className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-slate-600 sm:block sm:space-y-2"><span className={`inline-block rounded-full px-2.5 py-1 font-semibold ${curso.status === 'Em andamento' ? 'bg-emerald-50 text-emerald-700' : curso.status === 'Concluído' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>{curso.status}</span><span className="block">{curso.alunos} alunos · {curso.carga}</span></span>
            <span className="hidden text-xl text-blue-500 sm:block" aria-hidden="true">›</span>
          </button>)}
          {cursosFiltrados.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><p className="font-semibold text-slate-700">Nenhum curso encontrado</p><p className="mt-1 text-sm text-slate-500">Tente mudar a pesquisa ou o filtro.</p></div>}
        </div>
      </section>

      <aside className="h-fit rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)] md:sticky md:top-5">
        <div className="flex items-center justify-between"><h2 className="font-bold text-[#10213a]">Alunos dos cursos</h2><span className="rounded-full bg-[#eaf3ff] px-2 py-1 text-xs font-semibold text-[#1760b5]">{alunosVisiveis.length}</span></div>
        <p className="mt-1 text-xs text-slate-500">{cursoSelecionado || 'Alunos matriculados'}</p>
        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600">
          <span>Somente alunos dos meus cursos</span><input type="checkbox" checked={somenteMeusAlunos} onChange={(event) => setSomenteMeusAlunos(event.target.checked)} className="size-4 accent-[#2875df]" />
        </label>
        <label className="relative mt-3 block"><span className="sr-only">Buscar aluno</span><Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Icon><input value={buscaAluno} onChange={(event) => setBuscaAluno(event.target.value)} placeholder="Buscar aluno..." className="h-10 w-full rounded-lg border border-[#d2deeb] pl-9 pr-3 text-xs outline-none focus:border-[#3980e6]" /></label>
        {cursoSelecionado && <button onClick={() => setCursoSelecionado(null)} className="mt-2 text-xs font-semibold text-[#1767d2] hover:underline">Limpar curso selecionado</button>}
        <ul className="mt-3 divide-y divide-slate-100">
          {alunosMostrados.map((aluno) => <li key={aluno.id} className="flex items-center gap-3 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaf3ff] text-xs font-bold text-[#315f91]">{aluno.inicial}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-700">{aluno.nome}</span><span className="block truncate text-xs text-slate-500">{aluno.curso}</span></span></li>)}
          {alunosVisiveis.length === 0 && <li className="py-6 text-center text-xs text-slate-500">Nenhum aluno corresponde à pesquisa.</li>}
        </ul>
        {alunosVisiveis.length > 5 && <button type="button" onClick={() => setVerTodosAlunos((atual) => !atual)} className="mt-3 text-xs font-semibold text-[#1767d2] hover:underline">{verTodosAlunos ? 'Mostrar menos' : 'Ver todos os alunos'} →</button>}
      </aside>
    </div>
  )
}
