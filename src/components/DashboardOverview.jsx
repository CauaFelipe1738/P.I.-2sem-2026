import { useEffect, useId, useMemo, useState } from 'react'
import { alunos } from '../data/dadosAcademicos.js'
import { getStudentsForCourse, useCourseCatalog } from '../data/courseStore.js'
import { deriveAcademicAlerts, isPresentStatus } from '../data/academicInsights.js'
import { useAcademicData } from '../data/academicoStore.js'

const inputClass = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
const percentPresent = isPresentStatus
const FILTERS_KEY = 'edulytics.dashboard.filters.v1'
const categoryPalette = ['#2875df', '#21877a', '#c58b18', '#1760b5', '#c65b68']

function readDashboardFilters() {
  try {
    const value = JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}')
    return { className: value.className || '', subject: value.subject || '', period: value.period || 'all', view: value.view || 'overview' }
  } catch {
    return { className: '', subject: '', period: 'all', view: 'overview' }
  }
}

function dateInRange(date, period) {
  if (!date || period === 'all') return true
  const value = new Date(`${date}T00:00:00`)
  if (Number.isNaN(value.getTime())) return false
  const today = new Date()
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  cutoff.setDate(cutoff.getDate() - Number(period))
  return value >= cutoff && value <= today
}

function formatDate(date) {
  if (!date) return 'Data não informada'
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('pt-BR').format(parsed)
}

function Metric({ label, value, detail, tone = 'blue' }) {
  const tones = {
    blue: 'border-[#d9e1eb] bg-white',
    green: 'border-emerald-100 bg-white',
    amber: 'border-amber-100 bg-white',
    rose: 'border-rose-100 bg-white',
  }
  return <article className={`metric-card metric-card-${tone} rounded-xl border p-4 shadow-[0_2px_5px_rgba(15,23,42,0.04)] ${tones[tone]}`}>
    <p className="text-xs font-medium text-slate-600">{label}</p>
    <strong className="mt-1.5 block text-2xl leading-none tracking-tight text-slate-950">{value}</strong>
    <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
  </article>
}

function TrendChart({ data, title, valueLabel, color = '#2875df', formatValue = (value) => String(value) }) {
  const [activePoint, setActivePoint] = useState(null)
  const fillId = `trend-fill-${useId().replace(/:/g, '')}`
  const values = data.map((item) => item.value).filter(Number.isFinite)
  const maxValue = Math.max(100, ...values)
  const points = data.map((item, index) => ({
    ...item,
    x: data.length < 2 ? 300 : 42 + (index * 516) / (data.length - 1),
    y: 144 - (Math.max(0, item.value) / maxValue) * 112,
  }))
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const areaPath = points.length ? `${path} L ${points.at(-1).x} 148 L ${points[0].x} 148 Z` : ''

  return <section className="chart-panel rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)] sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-xs text-slate-500">{valueLabel} · baseado nos registros salvos</p></div>
      {activePoint && <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800" aria-live="polite">{activePoint.label}: {formatValue(activePoint.value)}</span>}
    </div>
    {data.some((item) => item.value > 0) ? <div className="mt-4 overflow-x-auto">
      <svg viewBox="0 0 600 190" role="group" aria-roledescription="gráfico de linhas" aria-label={`${title}. ${data.map((point) => `${point.label}: ${formatValue(point.value)}`).join('; ')}`} className="h-[210px] min-w-[540px] w-full overflow-visible">
        <title>{title}</title>
        <defs><linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".2" /><stop offset="100%" stopColor={color} stopOpacity=".015" /></linearGradient></defs>
        {[0, 1, 2, 3].map((line) => { const y = 32 + line * 37; return <g key={line}><line x1="35" x2="574" y1={y} y2={y} stroke="#e8edf3" strokeDasharray="3 4" /><text x="27" y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="9">{formatValue(Math.round(maxValue * (3 - line) / 3))}</text></g> })}
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => <g key={point.label} onMouseEnter={() => setActivePoint(point)} onMouseLeave={() => setActivePoint(null)} onFocus={() => setActivePoint(point)} onBlur={() => setActivePoint(null)} tabIndex="0" role="button" aria-label={`${point.label}: ${formatValue(point.value)}`} className="cursor-pointer">
          <circle cx={point.x} cy={point.y} r="12" fill="transparent" />
          <circle cx={point.x} cy={point.y} r={activePoint?.label === point.label ? 6 : 4} fill="white" stroke={color} strokeWidth="2.5" />
          <text x={point.x} y="174" textAnchor="middle" fill="#64748b" fontSize="10">{point.label}</text>
        </g>)}
      </svg>
    </div> : <div className="mt-4 flex min-h-[190px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center"><p className="max-w-sm text-sm text-slate-500">Ainda não há registros suficientes para mostrar uma evolução neste recorte.</p></div>}
  </section>
}

function StudentProfile({ student, attendance, learning, onClose }) {
  useEffect(() => {
    if (!student) return
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, student])

  if (!student) return null
  const present = attendance.filter((row) => percentPresent(row.status)).length
  const rate = attendance.length ? Math.round(100 * present / attendance.length) : null
  const difficulties = learning.filter((row) => row.category === 'Dificuldade').length
  const activities = attendance.flatMap((row) => row.checks || [])
  const delivered = activities.filter((item) => item === 'Entregou atividade solicitada').length
  const months = [...new Set(attendance.map((row) => row.date?.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month)))].sort().slice(-6)
  const trend = months.map((month) => {
    const date = new Date(`${month}-01T00:00:00`)
    const entries = attendance.filter((row) => row.date?.startsWith(month))
    const presentEntries = entries.filter((row) => percentPresent(row.status)).length
    return { label: `${new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '')} ${month.slice(2, 4)}`, value: Math.round(100 * presentEntries / entries.length) }
  })
  const history = [
    ...attendance.map((row) => ({ id: `a-${row.id}-${row.date}`, date: row.date, title: row.status, detail: `${row.subject || 'Disciplina'} · ${row.className || 'Turma não informada'}${row.reason ? ` · ${row.reason}` : ''}`, type: 'Frequência' })),
    ...learning.map((row) => ({ id: `l-${row.id}`, date: row.date, title: row.category, detail: row.description || row.action || row.plan?.goal || 'Registro pedagógico', type: 'Aprendizagem' })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 12)

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="student-profile-title" className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#d9e1eb] bg-[#f7f9fc] p-4 shadow-2xl sm:p-6">
      <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Resumo individual · dados locais</p><h2 id="student-profile-title" className="mt-1 text-xl font-bold">{student.nome}</h2><p className="mt-1 text-sm text-slate-500">{student.curso}</p></div><button onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50" aria-label="Fechar perfil">×</button></header>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Frequência observada" value={rate === null ? '—' : `${rate}%`} detail={`${attendance.length} registros de aula`} tone={rate !== null && rate < 75 ? 'rose' : 'green'} />
        <Metric label="Registros pedagógicos" value={learning.length} detail={`${difficulties} apontamentos de dificuldade`} tone="blue" />
        <Metric label="Atividades marcadas" value={activities.length ? `${delivered}/${activities.length}` : '—'} detail="Entregas identificadas no checklist" tone="amber" />
      </div>
      <div className="mt-4"><TrendChart data={trend} title="Evolução individual da frequência" valueLabel="Percentual de presença por mês" formatValue={(value) => `${value}%`} /></div>
      <section className="mt-4 rounded-xl border border-[#d9e1eb] bg-white p-4"><h3 className="text-sm font-bold">Histórico recente</h3><div className="mt-2 divide-y divide-slate-100">
        {history.map((item) => <article key={item.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{item.title}<span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{item.type}</span></p><p className="mt-1 break-words text-xs text-slate-600">{item.detail}</p></div><time className="shrink-0 text-xs text-slate-500">{formatDate(item.date)}</time></article>)}
        {!history.length && <p className="py-8 text-center text-sm text-slate-500">Ainda não há registros acadêmicos para este estudante.</p>}
      </div></section>
      <p className="mt-3 text-xs text-slate-500">O sistema ainda não tem notas nem histórico de avaliações integrado. Os dados mostrados vêm dos registros locais de frequência e aprendizagem.</p>
    </section>
  </div>
}

export default function DashboardOverview({ course, onSelectCourse, onNavigate, studentToOpen, onStudentOpened }) {
  const data = useAcademicData()
  const courses = useCourseCatalog()
  const [savedFilters] = useState(readDashboardFilters)
  const [className, setClassName] = useState(savedFilters.className)
  const [subject, setSubject] = useState(savedFilters.subject)
  const [period, setPeriod] = useState(savedFilters.period)
  const [view, setView] = useState(savedFilters.view)
  const [search, setSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const students = useMemo(() => getStudentsForCourse(course, alunos), [course])
  const rawAttendance = useMemo(() => data.attendance.filter((row) => row.courseId === course.id), [data.attendance, course.id])
  const rawLearning = useMemo(() => data.learning.filter((row) => row.courseId === course.id), [data.learning, course.id])
  const classes = useMemo(() => [...new Set(rawAttendance.map((row) => row.className).filter(Boolean))], [rawAttendance])
  const subjects = useMemo(() => [...new Set([course.nome, ...rawAttendance.map((row) => row.subject), ...rawLearning.map((row) => row.subject)].filter(Boolean))], [course.nome, rawAttendance, rawLearning])
  const activeClassName = classes.includes(className) ? className : ''
  const activeSubject = subjects.includes(subject) ? subject : ''

  useEffect(() => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify({ className, subject, period, view })) } catch { /* Os filtros continuam ativos até sair desta página. */ }
  }, [className, subject, period, view])
  const attendanceRows = rawAttendance
    .filter((row) => (!activeClassName || row.className === activeClassName) && (!activeSubject || row.subject === activeSubject) && dateInRange(row.date, period))
    .flatMap((row) => (row.students || []).map((student) => ({ ...student, date: row.date, className: row.className, subject: row.subject, sessionId: row.id, checks: student.checks || [] })))
  const learningRows = rawLearning.filter((row) => (!activeSubject || row.subject === activeSubject) && dateInRange(row.date, period))
  const presentCount = attendanceRows.filter((row) => percentPresent(row.status)).length
  const attendanceRate = attendanceRows.length ? Math.round(100 * presentCount / attendanceRows.length) : null
  const activities = attendanceRows.flatMap((row) => row.checks)
  const delivered = activities.filter((item) => item === 'Entregou atividade solicitada').length
  const alerts = useMemo(() => deriveAcademicAlerts(students, attendanceRows, learningRows), [students, attendanceRows, learningRows])
  const viewedAlerts = alerts.filter((item) => item.student.nome.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).slice(0, 5)
  const selectedStudent = students.find((student) => student.id === studentToOpen?.studentId) || students.find((student) => student.id === selectedStudentId)
  const profileAttendance = selectedStudent ? rawAttendance.flatMap((session) => (session.students || []).filter((row) => row.studentId === selectedStudent.id).map((row) => ({ ...row, date: session.date, className: session.className, subject: session.subject, sessionId: session.id, checks: row.checks || [] }))) : []
  const profileLearning = selectedStudent ? rawLearning.filter((row) => row.studentId === selectedStudent.id) : []

  const chartData = useMemo(() => {
    const months = [...new Set([...attendanceRows.map((row) => row.date?.slice(0, 7)), ...learningRows.map((row) => row.date?.slice(0, 7))].filter((month) => /^\d{4}-\d{2}$/.test(month)))].sort().slice(-6)
    return months.map((month) => {
      const date = new Date(`${month}-01T00:00:00`)
      const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '')
      const sessions = attendanceRows.filter((row) => row.date?.startsWith(month))
      const present = sessions.filter((row) => percentPresent(row.status)).length
      return { label: `${label} ${month.slice(2, 4)}`, value: sessions.length ? Math.round(100 * present / sessions.length) : 0 }
    })
  }, [attendanceRows, learningRows])

  const learningTrend = useMemo(() => {
    const months = [...new Set(learningRows.map((row) => row.date?.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month)))].sort().slice(-6)
    return months.map((month) => {
      const date = new Date(`${month}-01T00:00:00`)
      return { label: `${new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '')} ${month.slice(2, 4)}`, value: learningRows.filter((row) => row.date?.startsWith(month)).length }
    })
  }, [learningRows])

  const activityByCategory = useMemo(() => {
    const counts = new Map()
    for (const record of learningRows) counts.set(record.category || 'Sem categoria', (counts.get(record.category || 'Sem categoria') || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [learningRows])

  function clearFilters() { setClassName(''); setSubject(''); setPeriod('all'); setView('overview') }
  function closeStudentProfile() { setSelectedStudentId(''); onStudentOpened?.() }
  const showFrequency = view === 'overview' || view === 'attendance'
  const showLearning = view === 'overview' || view === 'learning' || view === 'activities'

  return <div className="academic-dashboard space-y-5">
    <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Monitoramento acadêmico</p><h2 className="mt-1 text-xl font-bold">Visão geral</h2><p className="mt-1 text-sm text-slate-600">Indicadores calculados a partir das chamadas e observações registradas.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => onNavigate('frequencia', course)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Registrar frequência</button><button onClick={() => onNavigate('aprendizagem', course)} className="rounded-lg bg-[#2875df] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Nova observação</button></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-semibold text-slate-600">Curso<select className={`${inputClass} mt-1`} value={course.id} onChange={(event) => { onSelectCourse(courses.find((item) => item.id === Number(event.target.value))); setClassName(''); setSubject('') }}>{courses.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Turma<select className={`${inputClass} mt-1`} value={activeClassName} onChange={(event) => setClassName(event.target.value)}><option value="">Todas</option>{classes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Disciplina<select className={`${inputClass} mt-1`} value={activeSubject} onChange={(event) => setSubject(event.target.value)}><option value="">Todas</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Período<select className={`${inputClass} mt-1`} value={period} onChange={(event) => setPeriod(event.target.value)}><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Últimos 12 meses</option><option value="all">Todo o histórico</option></select></label>
        <label className="text-xs font-semibold text-slate-600">Informação<select className={`${inputClass} mt-1`} value={view} onChange={(event) => setView(event.target.value)}><option value="overview">Resumo</option><option value="attendance">Frequência</option><option value="learning">Aprendizagem</option><option value="activities">Atividades</option></select></label>
      </div>
      {(activeClassName || activeSubject || period !== 'all' || view !== 'overview') && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Filtros aplicados</span>{activeClassName && <span className="rounded-full bg-slate-100 px-2 py-1">{activeClassName}</span>}{activeSubject && <span className="rounded-full bg-slate-100 px-2 py-1">{activeSubject}</span>}{period !== 'all' && <span className="rounded-full bg-slate-100 px-2 py-1">Últimos {period === '365' ? '12 meses' : `${period} dias`}</span>}<button onClick={clearFilters} className="font-semibold text-blue-700 hover:text-blue-900">Limpar filtros</button></div>}
    </section>

    <section aria-label="Indicadores do curso" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Frequência observada" value={attendanceRate === null ? '—' : `${attendanceRate}%`} detail={attendanceRows.length ? `${presentCount} presenças em ${attendanceRows.length} registros` : 'Sem chamadas neste recorte'} tone={attendanceRate !== null && attendanceRate < 75 ? 'rose' : 'green'} />
      <Metric label="Aulas registradas" value={new Set(attendanceRows.map((row) => row.sessionId)).size} detail={`${students.length} estudantes no catálogo demonstrativo`} />
      <Metric label="Observações pedagógicas" value={learningRows.filter((row) => !row.plan).length} detail={`${learningRows.filter((row) => row.category === 'Dificuldade').length} marcadas como dificuldade`} tone="amber" />
      <Metric label="Estudantes em atenção" value={new Set(alerts.map((item) => item.student.id)).size} detail={`${alerts.length} alertas ativos · limite de frequência demonstrativo: 75%`} tone={alerts.length ? 'rose' : 'green'} />
    </section>

    <div className={`grid items-start gap-5 ${view === 'overview' ? 'xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]' : 'grid-cols-1'}`}>
      {showFrequency && <TrendChart data={chartData} title="Evolução da frequência" valueLabel="Percentual de presença por mês" formatValue={(value) => `${value}%`} />}
      {showLearning && (view === 'learning' ? <TrendChart data={learningTrend} title="Evolução dos registros de aprendizagem" valueLabel="Observações registradas por mês" color="#c58b18" /> : <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)] sm:p-5"><h2 className="text-sm font-bold">Registros por categoria</h2><p className="mt-1 text-xs text-slate-500">Observações no período e nos filtros selecionados.</p><div className="mt-4 space-y-4">{activityByCategory.map(([name, count], index) => <div key={name}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="text-slate-600">{name}</span><strong className="text-slate-800">{count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(8, 100 * count / Math.max(...activityByCategory.map(([, value]) => value))) }%`, backgroundColor: categoryPalette[index % categoryPalette.length] }} /></div></div>)}{!activityByCategory.length && <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Nenhuma observação neste recorte.</p>}</div><p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">Não há avaliações ou notas cadastradas para gerar médias acadêmicas.</p></section>)}
    </div>

    {view !== 'activities' && <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)] sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-bold">Estudantes que podem precisar de acompanhamento</h2><p className="mt-1 text-xs text-slate-500">Alertas baseados em registros existentes; selecione um nome para abrir o resumo individual.</p></div><label className="w-full sm:w-64"><span className="sr-only">Pesquisar estudante</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar estudante..." className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label></div>
      {viewedAlerts.length ? <div className="mt-3 divide-y divide-slate-100">{viewedAlerts.map((item, index) => <button key={`${item.student.id}-${item.kind}-${index}`} onClick={() => setSelectedStudentId(item.student.id)} className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left hover:bg-slate-50"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{item.student.nome}<span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${item.priority === 'Alta' ? 'bg-rose-50 text-rose-700' : item.priority === 'Média' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>{item.priority} · {item.kind}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{item.message}</span></span><span className="shrink-0 text-xs font-semibold text-blue-700">Ver perfil →</span></button>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Nenhum alerta para os registros deste recorte.</p>}
    </section>}

    {view === 'activities' && <section className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.03)]"><h2 className="text-sm font-bold">Checklist de atividades</h2><p className="mt-1 text-xs text-slate-500">Entregas registradas na chamada; tarefas pendentes não são cadastradas no modelo atual.</p><div className="mt-3 flex flex-wrap items-end gap-3"><strong className="text-2xl">{activities.length ? `${delivered}/${activities.length}` : '—'}</strong><span className="pb-1 text-sm text-slate-600">itens marcados · {activities.length ? `${Math.round(100 * delivered / activities.length)}% com entrega` : 'sem dados neste recorte'}</span></div></section>}

    <p className="text-[11px] leading-5 text-slate-500">O catálogo de cursos e estudantes é demonstrativo. Frequência e observações são armazenadas apenas neste navegador; notas, matrícula em turmas e sincronização institucional dependem da integração com o backend.</p>
    <StudentProfile student={selectedStudent} attendance={profileAttendance} learning={profileLearning} onClose={closeStudentProfile} />
  </div>
}
