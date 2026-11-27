import { useMemo, useRef, useState } from 'react'
import aprenderIcon from '../assets/aprender.png'
import { alunos } from '../data/dadosAcademicos.js'
import {
  allocateCourseId,
  buildCourseRecord,
  getAvailableStudents,
  getStudentsForCourse,
  saveCourseCatalog,
  useCourseCatalog,
  validateCourseDraft,
} from '../data/courseStore.js'

function Icon({ children, className = 'size-5' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
}

function SearchIcon({ className = 'size-4' }) {
  return <Icon className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Icon>
}

function formatHours(value) {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} h`
}

function CourseDialog({ mode, course, courses, onClose, onSave, onEdit, onOpenDashboard }) {
  const [draft, setDraft] = useState(() => ({
    nome: course?.nome || '',
    descricao: course?.descricao || '',
    cargaHoraria: course?.cargaHoraria ? String(course.cargaHoraria) : '',
    studentIds: course ? getStudentsForCourse(course, alunos).map((student) => String(student.id)) : [],
  }))
  const [studentSearch, setStudentSearch] = useState('')
  const [error, setError] = useState('')
  const saving = useRef(false)
  const editing = mode === 'edit' || mode === 'create'
  const enrolled = useMemo(() => getStudentsForCourse({ ...course, nome: draft.nome || course?.nome || '', studentIds: draft.studentIds }, alunos), [course, draft.nome, draft.studentIds])
  const candidates = useMemo(() => getAvailableStudents(draft.studentIds, alunos)
    .filter((student) => student.nome.toLocaleLowerCase('pt-BR').includes(studentSearch.toLocaleLowerCase('pt-BR'))), [draft.studentIds, studentSearch])

  function toggleStudent(studentId) {
    const selected = new Set(draft.studentIds)
    if (selected.has(String(studentId))) selected.delete(String(studentId))
    else selected.add(String(studentId))
    setDraft((current) => ({ ...current, studentIds: [...selected] }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateCourseDraft(draft, courses, alunos, course?.id ?? null)
    if (validationMessage) {
      setError(validationMessage)
      return
    }
    setError('')
    if (saving.current) return
    saving.current = true
    onSave(draft)
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="course-dialog-title" className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Gerenciamento de cursos</p><h2 id="course-dialog-title" className="mt-1 text-xl font-bold text-[#10213a]">{mode === 'create' ? 'Criar curso' : mode === 'edit' ? 'Editar curso' : 'Detalhes do curso'}</h2></div>
        <button type="button" onClick={onClose} aria-label="Fechar" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-50">×</button>
      </header>

      {editing ? <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Nome do curso<input autoFocus name="nome" value={draft.nome} onChange={(event) => setDraft((current) => ({ ...current, nome: event.target.value }))} maxLength={120} required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Ex.: Desenvolvimento Web" /></label>
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Descrição <span className="font-normal text-slate-400">(opcional)</span><textarea name="descricao" value={draft.descricao} onChange={(event) => setDraft((current) => ({ ...current, descricao: event.target.value }))} maxLength={1000} rows={3} className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Finalidade e conteúdo do curso" /></label>
          <label className="text-xs font-semibold text-slate-700">Carga horária<input name="cargaHoraria" type="number" min="0.01" step="any" inputMode="decimal" value={draft.cargaHoraria} onChange={(event) => setDraft((current) => ({ ...current, cargaHoraria: event.target.value }))} required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Ex.: 80" /><span className="mt-1 block font-normal text-slate-500">Horas</span></label>
        </div>

        <section aria-labelledby="course-students-title" className="rounded-xl border border-slate-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 id="course-students-title" className="text-sm font-bold text-[#10213a]">Alunos participantes</h3><p className="mt-1 text-xs text-slate-500">Selecione cadastros já existentes no catálogo.</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{enrolled.length} selecionados</span></div>
          {enrolled.length > 0 && <ul className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto" aria-label="Alunos selecionados">{enrolled.map((student) => <li key={student.id}><button type="button" onClick={() => toggleStudent(student.id)} aria-label={`Remover ${student.nome} do curso`} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-900 hover:bg-blue-100">{student.nome}<span className="text-[10px] font-normal text-blue-700">· {student.cursoOrigem}</span><span aria-hidden="true">×</span></button></li>)}</ul>}
          <label className="relative mt-3 block"><span className="sr-only">Buscar alunos para adicionar</span><SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-600" /><input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Buscar alunos..." className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
          <div className="mt-2 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
            {candidates.map((student) => <label key={student.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50"><input type="checkbox" checked={draft.studentIds.includes(String(student.id))} onChange={() => toggleStudent(student.id)} className="size-4 shrink-0 accent-[#2875df]" /><span className="min-w-0 flex-1 truncate font-medium text-slate-700">{student.nome}</span><span className="max-w-36 truncate text-right text-[10px] text-slate-400">{student.curso}</span></label>)}
            {!candidates.length && <p className="px-3 py-5 text-center text-xs text-slate-500">{studentSearch ? 'Nenhum aluno disponível corresponde à busca.' : 'Todos os alunos disponíveis já foram selecionados.'}</p>}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-500">O catálogo de alunos atual é demonstrativo. Remover alguém daqui remove apenas o vínculo com este curso.</p>
        </section>

        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button><button type="submit" className="h-10 rounded-lg bg-[#2875df] px-5 text-sm font-semibold text-white hover:bg-blue-700">Salvar curso</button></footer>
      </form> : <div className="mt-4">
        <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nome</dt><dd className="mt-1 text-base font-bold text-[#10213a]">{course.nome}</dd></div><div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Descrição</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-700">{course.descricao || 'Sem descrição.'}</dd></div><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Carga horária</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatHours(course.cargaHoraria)}</dd></div><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Participantes</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{enrolled.length} alunos</dd></div></dl>
        <section className="mt-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-[#10213a]">Alunos vinculados</h3><button type="button" onClick={onEdit} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Gerenciar alunos</button></div>
          {enrolled.length ? <ul className="mt-2 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">{enrolled.map((student) => <li key={student.id} className="flex items-center gap-3 px-3 py-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf3ff] text-[10px] font-bold text-[#315f91]">{student.inicial}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-700">{student.nome}</span><span className="block truncate text-[10px] text-slate-500">Cadastro demonstrativo · {student.cursoOrigem}</span></span></li>)}</ul> : <p className="mt-2 rounded-lg border border-dashed border-slate-200 px-4 py-7 text-center text-sm text-slate-500">Este curso ainda não tem alunos vinculados.</p>}
        </section>
        <p className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-[11px] leading-4 text-blue-900">Os dados de cursos e alunos são salvos neste navegador. A integração com um serviço institucional ainda depende do backend.</p>
        <footer className="mt-4 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Fechar</button><button type="button" onClick={onOpenDashboard} className="h-10 rounded-lg border border-blue-200 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50">Abrir indicadores</button><button type="button" onClick={onEdit} className="h-10 rounded-lg bg-[#2875df] px-5 text-sm font-semibold text-white hover:bg-blue-700">Editar curso</button></footer>
      </div>}
    </section>
  </div>
}

export default function Professor({ onAbrirVisaoGeral = () => {} }) {
  const courses = useCourseCatalog()
  const studentsCatalog = useMemo(() => getAvailableStudents([], alunos), [])
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('Todos')
  const [ordenacao, setOrdenacao] = useState('Nome (A-Z)')
  const [pagina, setPagina] = useState(1)
  const [buscaAluno, setBuscaAluno] = useState('')
  const [somenteMeusAlunos, setSomenteMeusAlunos] = useState(true)
  const [dialog, setDialog] = useState(null)
  const [message, setMessage] = useState('')

  const cursosFiltrados = useMemo(() => courses.filter((course) => {
    const texto = `${course.nome} ${course.descricao}`.toLocaleLowerCase('pt-BR')
    return texto.includes(busca.toLocaleLowerCase('pt-BR')) && (status === 'Todos' || course.status === status)
  }).sort((a, b) => ordenacao === 'Nome (Z-A)' ? b.nome.localeCompare(a.nome, 'pt-BR') : ordenacao === 'Mais alunos' ? b.studentIds.length - a.studentIds.length : a.nome.localeCompare(b.nome, 'pt-BR')), [busca, courses, ordenacao, status])
  const paginasTotais = Math.max(1, Math.ceil(cursosFiltrados.length / 3))
  const cursosVisiveis = cursosFiltrados.slice((pagina - 1) * 3, pagina * 3)
  const totalAlunosCursos = courses.reduce((total, course) => total + course.studentIds.length, 0)
  const cursosEmAndamento = courses.filter((course) => course.status === 'Em andamento').length
  const alunosVisiveis = useMemo(() => studentsCatalog.filter((student) => {
    const course = courses.find((item) => item.nome === student.curso)
    return (!somenteMeusAlunos || course?.id !== 4 && course?.id !== 6) && `${student.nome} ${student.curso}`.toLocaleLowerCase('pt-BR').includes(buscaAluno.toLocaleLowerCase('pt-BR'))
  }), [buscaAluno, courses, somenteMeusAlunos, studentsCatalog])

  function openEdit(course) { setDialog({ mode: 'edit', course }) }

  function saveCourse(draft) {
    const existingCourse = dialog?.course || null
    const courseId = existingCourse?.id ?? allocateCourseId()
    const updatedCourse = buildCourseRecord(draft, courseId, existingCourse)
    const nextCourses = existingCourse
      ? courses.map((course) => course.id === existingCourse.id ? updatedCourse : course)
      : [...courses, updatedCourse]
    const persisted = saveCourseCatalog(nextCourses)
    setDialog(null)
    setPagina(1)
    setMessage(persisted
      ? `Curso ${existingCourse ? 'atualizado' : 'criado'} e salvo neste navegador.`
      : `Curso ${existingCourse ? 'atualizado' : 'criado'} nesta sessão; o navegador não permitiu persistir a alteração.`)
  }

  function deleteCourse(course) {
    const confirmed = window.confirm(`Excluir o curso “${course.nome}” do catálogo? Os alunos e registros acadêmicos existentes serão preservados.`)
    if (!confirmed) return
    const persisted = saveCourseCatalog(courses.filter((item) => item.id !== course.id))
    setPagina((current) => Math.min(current, Math.max(1, Math.ceil((cursosFiltrados.length - 1) / 3))))
    setMessage(persisted
      ? 'Curso removido do catálogo. Alunos e registros acadêmicos foram preservados.'
      : 'Curso removido nesta sessão, mas o navegador não permitiu persistir a alteração.')
  }

  return <div className="professor-page -mx-6 grid min-h-[calc(100vh-190px)] gap-4 bg-[#f7f9fc] px-6 py-3 text-[#10213a] lg:grid-cols-[minmax(0,1fr)_318px] lg:gap-3 lg:py-2">
    <section className="min-w-0">
      <header className="mb-3 lg:mb-2">
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#eaf3ff] lg:mb-1 lg:size-8"><img src={aprenderIcon} alt="EDULYTICS" className="size-7 object-contain lg:size-6" /></div>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-[27px] font-bold tracking-tight text-[#10213a]">Cursos</h1><p className="mt-0.5 text-sm text-slate-700">Gerencie e acompanhe os cursos da sua instituição.</p><p className="mt-1 max-w-3xl text-xs leading-[18px] text-slate-500">Visualize participantes, edite os dados dos cursos e acompanhe as informações cadastradas.</p></div><button type="button" onClick={() => { setMessage(''); setDialog({ mode: 'create', course: null }) }} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#2875df] px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><span aria-hidden="true" className="text-lg leading-none">+</span>Criar curso</button></div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500" aria-label="Resumo dos cursos"><span className="inline-flex items-center gap-1.5 rounded-md border border-[#e1eaf5] bg-white px-2 py-1"><strong className="text-[#1767d2]">{courses.length}</strong> cursos</span><span className="inline-flex items-center gap-1.5 rounded-md border border-[#d8eee8] bg-[#f4fbf8] px-2 py-1"><span className="size-1.5 rounded-full bg-emerald-500" /><strong className="text-emerald-700">{cursosEmAndamento}</strong> em andamento</span><span className="inline-flex items-center gap-1.5 rounded-md border border-[#e1eaf5] bg-white px-2 py-1"><strong className="text-[#10213a]">{totalAlunosCursos}</strong> matrículas</span></div>
      </header>

      <p aria-live="polite" className="sr-only">{message}</p>
      {message && <div role="status" className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">{message}</div>}
      <div className="mb-3 grid gap-2 rounded-xl border border-[#d9e1eb] bg-white p-2 shadow-[0_2px_8px_rgba(15,23,42,0.035)] sm:grid-cols-[minmax(0,1fr)_160px_170px] lg:mb-2 lg:p-1.5">
        <label className="relative block"><span className="sr-only">Buscar cursos</span><SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-[17px] -translate-y-1/2 text-[#2875df]" /><input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1) }} placeholder="Buscar cursos..." className="h-9 w-full rounded-lg border border-[#d2deeb] bg-[#fbfdff] pl-10 pr-3 text-xs text-[#10213a] outline-none transition focus:border-[#3980e6] focus:ring-2 focus:ring-[#3980e6]/10 placeholder:text-slate-400" /></label>
        <label className="flex items-center gap-2 text-[10px] text-slate-600"><span className="shrink-0">Filtrar:</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPagina(1) }} className="h-9 min-w-0 flex-1 rounded-lg border border-[#d2deeb] bg-[#fbfdff] px-2 text-xs text-[#10213a] outline-none transition focus:border-[#3980e6] focus:ring-2 focus:ring-[#3980e6]/10"><option>Todos</option><option>Em andamento</option><option>Em breve</option><option>Concluído</option></select></label>
        <label className="flex items-center gap-2 text-[10px] text-slate-600"><span className="shrink-0">Ordenar:</span><select value={ordenacao} onChange={(event) => { setOrdenacao(event.target.value); setPagina(1) }} className="h-9 min-w-0 flex-1 rounded-lg border border-[#d2deeb] bg-[#fbfdff] px-2 text-xs text-[#10213a] outline-none transition focus:border-[#3980e6] focus:ring-2 focus:ring-[#3980e6]/10"><option>Nome (A-Z)</option><option>Nome (Z-A)</option><option>Mais alunos</option></select></label>
      </div>

      <div className="space-y-2.5">
        {cursosVisiveis.map((course) => <article key={course.id} className="grid gap-3 overflow-hidden rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_3px_10px_rgba(15,23,42,0.035)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:p-3">
          <button type="button" onClick={() => setDialog({ mode: 'details', course })} className="group relative min-w-0 border-l-4 border-transparent pl-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2875df]">
            <span className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-bold tracking-[-0.01em] text-[#10213a] transition-colors group-hover:text-[#1767d2]">{course.nome}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${course.status === 'Em andamento' ? 'bg-emerald-50 text-emerald-700' : course.status === 'Concluído' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}><span className={`size-1.5 rounded-full ${course.status === 'Em andamento' ? 'bg-emerald-500' : course.status === 'Concluído' ? 'bg-slate-400' : 'bg-blue-500'}`} />{course.status}</span></span>
            <span className="mt-1.5 block line-clamp-2 max-w-3xl text-xs leading-[18px] text-slate-600">{course.descricao || 'Sem descrição.'}</span>
            <span className="mt-2 inline-flex text-[10px] font-medium uppercase tracking-[0.06em] text-[#7890aa]">Detalhes do curso <span className="ml-1 text-[#2875df] transition-transform group-hover:translate-x-1">→</span></span>
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <div className="flex gap-2"><span className="rounded-lg bg-[#f5f8fc] px-2.5 py-2 text-[11px] text-slate-600"><strong className="font-semibold text-[#10213a]">{course.studentIds.length}</strong> alunos</span><span className="rounded-lg bg-[#f5f8fc] px-2.5 py-2 text-[11px] text-slate-600"><strong className="font-semibold text-[#10213a]">{formatHours(course.cargaHoraria)}</strong></span></div>
            <div className="flex gap-1"><button type="button" onClick={() => openEdit(course)} aria-label={`Editar ${course.nome}`} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Editar</button><button type="button" onClick={() => deleteCourse(course)} aria-label={`Excluir ${course.nome}`} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Excluir</button></div>
          </div>
        </article>)}
        {cursosFiltrados.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-700">{courses.length ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}</p><p className="mt-1 text-xs text-slate-500">{courses.length ? 'Tente mudar a busca ou os filtros.' : 'Crie o primeiro curso para começar a organizar participantes.'}</p>{!courses.length && <button type="button" onClick={() => setDialog({ mode: 'create', course: null })} className="mt-4 rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Criar primeiro curso</button>}</div>}
      </div>
      {cursosFiltrados.length > 0 && <nav aria-label="Paginação dos cursos" className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600"><button onClick={() => setPagina((atual) => Math.max(1, atual - 1))} disabled={pagina === 1} className="px-1 text-[#2875df] disabled:opacity-40" aria-label="Página anterior">‹</button>{Array.from({ length: paginasTotais }, (_, indice) => indice + 1).map((numero) => <button key={numero} onClick={() => setPagina(numero)} aria-current={pagina === numero ? 'page' : undefined} className={`size-8 rounded-md ${pagina === numero ? 'bg-[#2875df] text-white' : 'hover:bg-slate-100'}`}>{numero}</button>)}<button onClick={() => setPagina((atual) => Math.min(paginasTotais, atual + 1))} disabled={pagina === paginasTotais} className="px-1 text-[#2875df] disabled:opacity-40" aria-label="Próxima página">›</button></nav>}
      <p className="mt-3 text-[10px] leading-4 text-slate-500">Alterações do catálogo ficam salvas apenas neste navegador até a integração com um backend.</p>
    </section>

    <aside>
      <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)] lg:p-3">
        <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-[#10213a]"><Icon className="size-[18px] text-[#2875df]"><><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></></Icon>Alunos do catálogo</h2></div>
        <div className="mt-3 flex items-center -space-x-2" aria-hidden="true">{alunosVisiveis.slice(0, 5).map((student, index) => <span key={student.id} className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white ${['bg-blue-500', 'bg-sky-700', 'bg-slate-500', 'bg-violet-500', 'bg-indigo-400'][index]}`}>{student.inicial}</span>)}{alunosVisiveis.length > 5 && <span className="ml-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#eaf3ff] text-[9px] text-[#315f91]">+{alunosVisiveis.length - 5}</span>}</div>
        <p className="mt-2 text-xs text-slate-600">{alunosVisiveis.length} cadastros demonstrativos</p>
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#d9e1eb] bg-slate-50 px-2.5 py-2 text-[10px] text-slate-600"><span>Apenas alunos do professor</span><input type="checkbox" checked={somenteMeusAlunos} onChange={(event) => setSomenteMeusAlunos(event.target.checked)} className="size-4 accent-[#2875df]" /></label>
        <label className="relative mt-2.5 block"><span className="sr-only">Buscar aluno</span><SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#2875df]" /><input value={buscaAluno} onChange={(event) => setBuscaAluno(event.target.value)} placeholder="Buscar aluno..." className="h-9 w-full rounded-lg border border-[#d2deeb] bg-white pl-8 pr-2 text-[11px] text-[#10213a] outline-none placeholder:text-slate-400 focus:border-[#3980e6]" /></label>
        <ul className="mt-2 max-h-72 divide-y divide-slate-100 overflow-y-auto overscroll-contain pr-1">{alunosVisiveis.map((student) => <li key={student.id} className="flex items-center gap-2 py-2 lg:py-1.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d4e1f1] bg-[#eaf3ff] text-[9px] font-bold text-[#315f91]">{student.inicial}</span><span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-slate-700">{student.nome}</span><span className="block text-[10px] text-emerald-600">● Ativo</span></span></li>)}{alunosVisiveis.length === 0 && <li className="py-4 text-center text-[11px] text-slate-500">Nenhum aluno corresponde à pesquisa.</li>}</ul>
        <p className="mt-2 text-[10px] leading-4 text-slate-500">Os nomes são usados para seleção nos cursos. O catálogo atual não fornece matrículas institucionais.</p>
      </section>
    </aside>

    {dialog && <CourseDialog key={`${dialog.mode}-${dialog.course?.id ?? 'new'}`} mode={dialog.mode} course={dialog.course} courses={courses} onClose={() => setDialog(null)} onEdit={() => openEdit(dialog.course)} onOpenDashboard={() => { onAbrirVisaoGeral(dialog.course); setDialog(null) }} onSave={saveCourse} />}
  </div>
}
