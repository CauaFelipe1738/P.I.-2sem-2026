import { useEffect, useId, useMemo, useState } from 'react'
import { alunos, cursos } from '../data/dadosAcademicos.js'
import { useAcademicData } from '../data/academicoStore.js'
import { filterStudentAttendance, isAbsence, isPresent, summarizeStudentAttendance } from '../data/studentInsights.js'

const PREFERENCES_KEY = 'edulytics.student-view.v1'
const DEMO_STUDENT = alunos.find((student) => student.id === '0-0')
const DEMO_COURSE = cursos.find((course) => course.nome === DEMO_STUDENT?.curso) || cursos[0]
const tabs = [
  { id: 'overview', label: 'Resumo' },
  { id: 'grades', label: 'Notas' },
  { id: 'attendance', label: 'Frequência' },
  { id: 'activities', label: 'Atividades' },
  { id: 'profile', label: 'Perfil' },
]

function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')
    return {
      year: Number(value.year) || new Date().getFullYear(),
      semester: value.semester === '1' || value.semester === '2' ? value.semester : String(new Date().getMonth() < 6 ? 1 : 2),
      subject: typeof value.subject === 'string' ? value.subject : '',
      tab: tabs.some((tab) => tab.id === value.tab) ? value.tab : 'overview',
    }
  } catch {
    return { year: new Date().getFullYear(), semester: String(new Date().getMonth() < 6 ? 1 : 2), subject: '', tab: 'overview' }
  }
}

function formatDate(date) {
  if (!date) return 'Data não informada'
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('pt-BR').format(parsed)
}

function MetricCard({ label, value, detail, tone = 'blue', onClick, help }) {
  const tones = {
    blue: 'border-[#d9e1eb] bg-white',
    green: 'border-emerald-100 bg-white',
    amber: 'border-amber-100 bg-white',
    slate: 'border-slate-200 bg-white',
  }
  const content = <>
    <span className="flex items-start justify-between gap-2"><span className="text-xs font-medium text-slate-600">{label}</span>{help && <span title={help} aria-label={help} className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">i</span>}</span>
    <strong className="mt-1.5 block text-2xl leading-none tracking-tight text-slate-950">{value}</strong>
    <span className="mt-2 block text-[11px] leading-4 text-slate-500">{detail}</span>
  </>
  const className = `metric-card metric-card-${tone} min-h-[104px] rounded-xl border p-4 text-left shadow-[0_2px_5px_rgba(15,23,42,0.04)] ${tones[tone]} ${onClick ? 'transition hover:border-blue-200 hover:bg-blue-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2875df]' : ''}`
  return onClick ? <button type="button" onClick={onClick} title={help} className={className}>{content}</button> : <article className={className}>{content}</article>
}

function EmptyState({ title, detail }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-9 text-center"><p className="text-sm font-semibold text-slate-700">{title}</p><p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">{detail}</p></div>
}

function FrequencyTrend({ rows }) {
  const [active, setActive] = useState(null)
  const fillId = `student-frequency-fill-${useId().replace(/:/g, '')}`
  const months = [...new Set(rows.map((row) => row.date?.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month)))].sort()
  const points = months.map((month, index) => {
    const records = rows.filter((row) => row.date?.startsWith(month))
    const present = records.filter(isPresent).length
    const date = new Date(`${month}-01T00:00:00`)
    const label = `${new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '')} ${month.slice(2, 4)}`
    return { label, value: Math.round(100 * present / records.length), x: months.length < 2 ? 300 : 42 + index * 516 / (months.length - 1) }
  }).map((point) => ({ ...point, y: 144 - point.value * 1.12 }))
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const areaPath = points.length ? `${path} L ${points.at(-1).x} 148 L ${points[0].x} 148 Z` : ''

  if (!points.length) return <EmptyState title="Sem histórico de frequência neste período" detail="Quando houver chamadas registradas para este perfil, a evolução aparecerá aqui." />

  return <section className="chart-panel rounded-xl border border-[#d9e1eb] bg-white p-4">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-bold">Evolução da frequência</h3><p className="mt-1 text-xs text-slate-500">Presenças por mês, conforme chamadas registradas.</p></div>{active && <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800" aria-live="polite">{active.label}: {active.value}%</span>}</div>
    <div className="mt-3 overflow-x-auto"><svg viewBox="0 0 600 190" role="group" aria-roledescription="gráfico de linhas" aria-label={`Frequência por mês: ${points.map((point) => `${point.label}, ${point.value}%`).join('; ')}`} className="h-[200px] min-w-[520px] w-full overflow-visible"><title>Evolução da frequência no semestre</title>
      <defs><linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2875df" stopOpacity=".2" /><stop offset="100%" stopColor="#2875df" stopOpacity=".015" /></linearGradient></defs>
      {[0, 1, 2, 3].map((line) => { const y = 32 + line * 37; const tick = 100 - line * 100 / 3; return <g key={line}><line x1="35" x2="574" y1={y} y2={y} stroke="#e8edf3" strokeDasharray="3 4" /><text x="27" y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="9">{Math.round(tick)}%</text></g> })}
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path d={path} fill="none" stroke="#2875df" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point) => <g key={point.label} onMouseEnter={() => setActive(point)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(point)} onBlur={() => setActive(null)} tabIndex="0" role="button" aria-label={`${point.label}: ${point.value}%`} className="cursor-pointer"><circle cx={point.x} cy={point.y} r="12" fill="transparent" /><circle cx={point.x} cy={point.y} r={active?.label === point.label ? 6 : 4} fill="white" stroke="#2875df" strokeWidth="2.5" /><text x={point.x} y="174" textAnchor="middle" fill="#64748b" fontSize="10">{point.label}</text></g>)}
    </svg></div>
  </section>
}

function HelpDialog({ onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="student-help-title" className="help-panel max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d9e1eb] bg-white p-5 shadow-2xl sm:p-6">
      <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Ajuda do aluno</p><h2 id="student-help-title" className="mt-1 text-xl font-bold">Como acompanhar seu semestre</h2></div><button onClick={onClose} aria-label="Fechar ajuda" className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-50">×</button></header>
      <div className="mt-4 space-y-2">{[
        ['Notas', 'Esta área fica vazia enquanto não houver avaliações e notas integradas. O aluno não pode editar resultados.'],
        ['Frequência', 'Presente e atraso entram como presença, conforme o cálculo já usado no painel docente. Faltas justificadas são exibidas separadamente.'],
        ['Período e disciplina', 'Os seletores filtram as chamadas pelos meses da primeira ou segunda metade do ano. O calendário letivo oficial ainda não está cadastrado.'],
        ['Atividades', 'A lista mostra apenas marcações de entrega feitas durante a chamada. Não há prazos ou tarefas pendentes registrados no sistema.'],
      ].map(([title, body], index) => <article key={title} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span><div><h3 className="text-sm font-semibold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{body}</p></div></article>)}</div>
      <div className="mt-4 flex justify-end"><button onClick={onClose} className="rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Entendi</button></div>
    </section>
  </div>
}

export default function Alunos() {
  const data = useAcademicData()
  const [saved] = useState(readPreferences)
  const [year, setYear] = useState(saved.year)
  const [semester, setSemester] = useState(saved.semester)
  const [subject, setSubject] = useState(saved.subject)
  const [tab, setTab] = useState(saved.tab)
  const [helpOpen, setHelpOpen] = useState(false)

  const sessions = useMemo(() => data.attendance.filter((session) => session.courseId === DEMO_COURSE.id), [data.attendance])
  const studentRows = sessions.flatMap((session) => (session.students || []).filter((row) => row.studentId === DEMO_STUDENT.id).map((row) => ({
    ...row,
    date: session.date,
    subject: session.subject || 'Disciplina não informada',
    className: session.className || '',
    lesson: session.lesson || '',
    sessionId: session.id,
  })))
  const years = [...new Set([new Date().getFullYear(), ...studentRows.map((row) => Number(row.date?.slice(0, 4))).filter(Number.isFinite), year])].sort((a, b) => b - a)
  const subjects = [...new Set(studentRows.map((row) => row.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const activeSubject = subjects.includes(subject) ? subject : ''
  const periodRows = filterStudentAttendance(studentRows, { year, semester })
  const visibleRows = filterStudentAttendance(studentRows, { year, semester, subject: activeSubject }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const { presences, absences, justified, attendanceRate, lessons } = summarizeStudentAttendance(visibleRows)
  const disciplineStats = [...new Set(visibleRows.map((row) => row.subject))].map((name) => {
    const rows = visibleRows.filter((row) => row.subject === name)
    const present = rows.filter(isPresent).length
    return { name, total: rows.length, present, absences: rows.filter(isAbsence).length, rate: rows.length ? Math.round(100 * present / rows.length) : 0 }
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const delivered = visibleRows.filter((row) => (row.checks || []).includes('Entregou atividade solicitada'))

  // Persiste os filtros de consulta para manter o contexto ao alternar pelas seções.
  useEffect(() => {
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ year, semester, subject, tab })) } catch { /* O painel continua utilizável sem armazenamento local. */ }
  }, [year, semester, subject, tab])

  const semesterLabel = `${semester}º semestre de ${year}`
  const dateRangeLabel = semester === '1' ? 'jan–jun' : 'jul–dez'

  return <div className="student-dashboard space-y-5 text-[#10213a]">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Área do aluno</p><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">Olá, {DEMO_STUDENT.nome.split(' ')[0]}</h1><span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">Perfil demonstrativo</span></div><p className="mt-1 text-sm text-slate-600">Acompanhe seus registros acadêmicos em um só lugar.</p></div>
      <button onClick={() => setHelpOpen(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" aria-label="Abrir ajuda da área do aluno">Ajuda</button>
    </header>

    <section className="grid gap-3 rounded-xl border border-[#d9e1eb] bg-white p-3 shadow-[0_2px_5px_rgba(15,23,42,0.03)] sm:grid-cols-3 sm:p-4">
      <label className="text-xs font-semibold text-slate-600">Ano letivo<select value={year} onChange={(event) => setYear(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Semestre<select value={semester} onChange={(event) => setSemester(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"><option value="1">1º semestre · jan–jun</option><option value="2">2º semestre · jul–dez</option></select></label>
      <label className="text-xs font-semibold text-slate-600">Disciplina<select value={activeSubject} onChange={(event) => setSubject(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"><option value="">Todas as disciplinas</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
      <p className="text-[11px] leading-4 text-slate-500 sm:col-span-3">Período selecionado: {semesterLabel} ({dateRangeLabel}). Agrupamento pelas datas das chamadas; o calendário oficial da instituição não está cadastrado.</p>
    </section>

    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[#d9e1eb] bg-white p-1.5" aria-label="Seções da área do aluno">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? 'page' : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === item.id ? 'bg-[#e5f1ff] text-[#1760b5]' : 'text-slate-600 hover:bg-slate-50'}`}>{item.label}</button>)}</nav>

    {tab === 'overview' && <div className="space-y-4">
      <section aria-label="Resumo do semestre" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Média do semestre" value="—" detail="Notas ainda não estão disponíveis." onClick={() => setTab('grades')} help="A área de notas aguarda dados de avaliações." />
        <MetricCard label="Faltas registradas" value={visibleRows.length ? absences : '—'} detail={visibleRows.length ? `${justified} justificadas · ${lessons} aulas registradas` : 'Sem chamadas neste período.'} onClick={() => setTab('attendance')} tone="amber" />
        <MetricCard label="Frequência observada" value={attendanceRate === null ? '—' : `${attendanceRate}%`} detail={visibleRows.length ? `${presences} presenças em ${visibleRows.length} registros` : 'Sem dados para calcular.'} onClick={() => setTab('attendance')} tone="green" help="Presenças e atrasos são contados como presença, seguindo o painel docente." />
        <MetricCard label="Disciplinas com registros" value={disciplineStats.length || '—'} detail="Não representa a matrícula oficial." onClick={() => setTab('attendance')} />
        <MetricCard label="Atividades pendentes" value="—" detail="Prazos e tarefas pendentes não estão cadastrados." onClick={() => setTab('activities')} tone="slate" />
        <MetricCard label="Avaliações futuras" value="—" detail="Calendário de avaliações indisponível." onClick={() => setTab('grades')} tone="slate" />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
        <FrequencyTrend rows={visibleRows} />
        <section className="rounded-xl border border-[#d9e1eb] bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Avisos</h2><p className="mt-1 text-xs text-slate-500">Informações deste período.</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{visibleRows.length ? 'Atualizado' : 'Sem dados'}</span></div><p className="mt-3 text-sm leading-5 text-slate-600">{visibleRows.length ? `Há ${visibleRows.length} registros de chamada disponíveis. A frequência mínima não foi configurada, então o sistema não sinaliza risco acadêmico.` : 'Ainda não há registros de frequência neste período. Notas e comunicados dependem de dados institucionais integrados.'}</p><button onClick={() => setTab('attendance')} className="mt-4 text-xs font-semibold text-blue-700 hover:text-blue-900">Consultar frequência →</button></section>
      </div>
    </div>}

    {tab === 'grades' && <section className="space-y-4"><header><h2 className="text-lg font-bold">Notas e avaliações</h2><p className="mt-1 text-sm text-slate-600">Consulta somente leitura · {semesterLabel}</p></header><EmptyState title="Notas ainda não disponíveis" detail="O front-end atual não recebe avaliações, notas ou médias. Assim que esses dados forem integrados, esta seção poderá mostrar resultados por disciplina e histórico do semestre." /><p className="text-xs text-slate-500">Nenhum valor demonstrativo é apresentado como se fosse uma nota real.</p></section>}

    {tab === 'attendance' && <section className="space-y-4"><header><h2 className="text-lg font-bold">Frequência e faltas</h2><p className="mt-1 text-sm text-slate-600">Chamadas registradas em {semesterLabel}{activeSubject ? ` · ${activeSubject}` : ''}.</p></header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Aulas com registro" value={visibleRows.length ? lessons : '—'} detail="Aulas encontradas para este perfil." /><MetricCard label="Presenças" value={visibleRows.length ? presences : '—'} detail="Inclui atrasos conforme o painel docente." tone="green" /><MetricCard label="Faltas" value={visibleRows.length ? absences : '—'} detail={`${justified} justificadas`} tone="amber" /><MetricCard label="Frequência" value={attendanceRate === null ? '—' : `${attendanceRate}%`} detail="Sem limite mínimo configurado." help="O sistema não define uma regra institucional de frequência mínima." /></div>
      <FrequencyTrend rows={visibleRows} />
      <section className="rounded-xl border border-[#d9e1eb] bg-white p-4"><h3 className="text-sm font-bold">Frequência por disciplina</h3><div className="mt-2 divide-y divide-slate-100">{disciplineStats.map((item) => <article key={item.name} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(100px,1.4fr)_100px] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.present} presenças · {item.absences} faltas</p></div><div className="h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`Frequência em ${item.name}: ${item.rate}%`}><div className="h-full rounded-full bg-[#2875df]" style={{ width: `${item.rate}%` }} /></div><strong className="text-sm text-slate-700 sm:text-right">{item.rate}%</strong></article>)}{!disciplineStats.length && <div className="py-7"><EmptyState title="Sem dados por disciplina" detail="As chamadas deste semestre aparecerão aqui quando forem registradas." /></div>}</div></section>
      <section className="rounded-xl border border-[#d9e1eb] bg-white p-4"><h3 className="text-sm font-bold">Histórico de faltas</h3><div className="mt-2 divide-y divide-slate-100">{visibleRows.filter(isAbsence).map((row) => <article key={`${row.sessionId}-${row.studentId}`} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="text-sm font-semibold text-slate-800">{row.status === 'Falta justificada' ? 'Falta justificada' : 'Falta'}</p><p className="mt-0.5 text-xs text-slate-500">{row.subject}{row.lesson ? ` · ${row.lesson}` : ''}</p></div><time className="text-xs text-slate-500">{formatDate(row.date)}</time></article>)}{!visibleRows.some(isAbsence) && <p className="py-7 text-center text-sm text-slate-500">{visibleRows.length ? 'Nenhuma falta registrada neste período.' : 'Não há chamadas para exibir neste período.'}</p>}</div></section>
      <p className="text-[11px] leading-5 text-slate-500">Os valores refletem chamadas salvas localmente. O limite mínimo de frequência e o vínculo formal de matrícula ainda não estão configurados.</p>
    </section>}

    {tab === 'activities' && <section className="space-y-4"><header><h2 className="text-lg font-bold">Atividades</h2><p className="mt-1 text-sm text-slate-600">Marcações de entrega registradas durante as chamadas · {semesterLabel}.</p></header><div className="grid gap-3 sm:grid-cols-2"><MetricCard label="Entregas marcadas" value={delivered.length || '—'} detail={delivered.length ? 'Checklist da chamada.' : 'Nenhuma entrega registrada neste período.'} tone="green" /><MetricCard label="Pendências e prazos" value="—" detail="O sistema ainda não armazena tarefas ou datas de entrega." tone="slate" /></div><section className="rounded-xl border border-[#d9e1eb] bg-white p-4"><h3 className="text-sm font-bold">Histórico de entregas</h3><div className="mt-2 divide-y divide-slate-100">{delivered.map((row) => <article key={`${row.sessionId}-${row.studentId}`} className="flex flex-wrap items-center justify-between gap-2 py-3"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700" aria-hidden="true">✓</span><div><p className="text-sm font-semibold text-slate-800">Atividade marcada como entregue</p><p className="text-xs text-slate-500">{row.subject}</p></div></div><time className="text-xs text-slate-500">{formatDate(row.date)}</time></article>)}{!delivered.length && <div className="py-7"><EmptyState title="Nenhuma entrega registrada" detail="Este sistema mostra apenas as entregas marcadas nas chamadas. Não há lista de tarefas pendentes ou próximas avaliações." /></div>}</div></section></section>}

    {tab === 'profile' && <section className="space-y-4"><header><h2 className="text-lg font-bold">Meu perfil acadêmico</h2><p className="mt-1 text-sm text-slate-600">Informações disponíveis para consulta.</p></header><section className="rounded-xl border border-[#d9e1eb] bg-white p-5"><div className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-4"><span className="flex size-14 items-center justify-center rounded-full bg-[#eaf3ff] text-lg font-bold text-[#315f91]">{DEMO_STUDENT.inicial}</span><div><h3 className="text-lg font-bold">{DEMO_STUDENT.nome}</h3><p className="mt-1 text-xs text-slate-500">Perfil de demonstração · somente leitura</p></div></div><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Curso no catálogo demonstrativo</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{DEMO_COURSE.nome}</dd></div><div><dt className="text-xs text-slate-500">Período consultado</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{semesterLabel}</dd></div><div><dt className="text-xs text-slate-500">Matrícula e turma oficial</dt><dd className="mt-1 text-sm font-semibold text-slate-800">Não disponíveis</dd></div><div><dt className="text-xs text-slate-500">Disciplinas com frequência registrada</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{[...new Set(periodRows.map((row) => row.subject))].join(', ') || 'Nenhuma neste período'}</dd></div></dl></section><p className="text-xs leading-5 text-slate-500">Não há edição de dados pessoais ou acadêmicos nesta área. A autenticação e o vínculo real entre conta, matrícula e turma precisam ser fornecidos pelo backend.</p></section>}

    <footer className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-[11px] leading-5 text-blue-900">Ambiente demonstrativo. O perfil, curso e estudantes vêm do catálogo de exemplo; frequência vem das chamadas locais. Notas, calendário institucional e tarefas ainda não estão integrados.</footer>
    {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
  </div>
}
