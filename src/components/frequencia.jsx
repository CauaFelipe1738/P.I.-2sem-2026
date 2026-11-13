import { useState } from 'react'
import { alunos, cursos } from '../data/dadosAcademicos.js'
import { addAttendance, checklistAula, optionsForCourse, updateAttendance, useAcademicData } from '../data/academicoStore.js'

// Classes utilitárias comuns mantêm os campos e indicadores visualmente consistentes.
const input = 'mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
const pill = 'rounded-lg border border-slate-200 bg-white p-4'

function formatLocalDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// Separa a conversão do formulário da gravação para manter o formato do registro consistente.
function buildAttendanceRows(form, students) {
  return students
    .filter((student) => form.has(`include-${student.id}`))
    .map((student) => ({
      studentId: student.id,
      name: student.nome,
      status: form.get(`status-${student.id}`) || 'Presente',
      reason: form.get(`reason-${student.id}`) || '',
      checks: form.get(`activity-${student.id}`) ? [form.get(`activity-${student.id}`)] : [],
      note: '',
    }))
}

export default function Frequencia() {
  const data = useAcademicData()
  const [courseId, setCourseId] = useState(cursos[0].id)
  const [studentId, setStudentId] = useState('')
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('')
  const [daysBack, setDaysBack] = useState('30')
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const course = cursos.find((item) => item.id === Number(courseId))
  const students = optionsForCourse(course.nome, alunos)
  const subjects = [...new Set([course.nome, ...data.attendance.filter((row) => row.courseId === course.id).map((row) => row.subject)])]
  const classes = [...new Set(['Turma A', 'Turma B', ...data.attendance.filter((row) => row.courseId === course.id).map((row) => row.className)])]
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - Number(daysBack || 0))
  const cutoffDate = formatLocalDate(cutoff)
  const todayDate = formatLocalDate(new Date())
  // Os filtros são combinados sobre as chamadas do curso selecionado.
  const sessions = data.attendance.filter((session) => session.courseId === course.id && (!className || session.className === className) && (!subject || session.subject === subject) && (daysBack === 'all' || (session.date >= cutoffDate && session.date <= todayDate))).sort((first, second) => second.date.localeCompare(first.date))
  const entries = sessions.flatMap((session) => session.students.map((student) => ({ ...student, session })))
  const present = entries.filter((row) => row.status === 'Presente' || row.status === 'Atraso').length
  const rate = entries.length ? Math.round(100 * present / entries.length) : null
  const absent = entries.length - present
  const selectedStudent = students.find((student) => student.id === studentId)

  function saveSession(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    // Registra apenas os alunos selecionados para esta chamada, inclusive ao corrigir.
    const rows = buildAttendanceRows(form, students)

    if (!rows.length) {
      setMessage('Selecione ao menos um aluno para registrar a chamada.')
      return
    }

    const session = {
      id: editing?.id || crypto.randomUUID(),
      courseId: course.id,
      courseName: course.nome,
      className,
      subject,
      date: form.get('date'),
      lesson: form.get('lesson'),
      students: rows,
      createdAt: editing?.createdAt || new Date().toISOString(),
    }

    if (editing) {
      updateAttendance(editing.id, session)
      setMessage('Registro atualizado.')
    } else {
      addAttendance(session)
      setMessage('Frequência salva.')
    }

    setEditing(null)
  }

  // A taxa considera presente e atraso como comparecimento; justificativas não contam como presença.
  return <div className="space-y-5 text-[#10213a]">
    <header className="border-l-4 border-emerald-500 pl-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Registro rápido</p><h3 className="mt-1 text-xl font-bold">Chamada da turma</h3><p className="mt-1 text-sm text-slate-600">Marque a presença e acompanhe as aulas registradas.</p></header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><article className={pill}><p className="text-xs text-slate-500">Presença nas aulas registradas</p><strong className="mt-1 block text-2xl">{rate === null ? '—' : `${rate}%`}</strong></article><article className={pill}><p className="text-xs text-slate-500">Faltas e faltas justificadas</p><strong className="mt-1 block text-2xl">{absent}</strong></article><article className={pill}><p className="text-xs text-slate-500">Aulas registradas</p><strong className="mt-1 block text-2xl">{sessions.length}</strong></article><article className={pill}><p className="text-xs text-slate-500">Alunos abaixo de 75%</p><strong className="mt-1 block text-2xl">{students.filter((student) => { const rows = entries.filter((row) => row.studentId === student.id); return rows.length > 0 && rows.filter((row) => row.status === 'Presente' || row.status === 'Atraso').length / rows.length < 0.75 }).length}</strong></article></div>
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,1fr)]">
      <form onSubmit={saveSession} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h4 className="font-bold">{editing ? 'Corrigir chamada' : 'Registrar aula'}</h4>{editing && <button type="button" className="text-sm text-blue-700" onClick={() => setEditing(null)}>Cancelar edição</button>}</div>{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Curso<select className={input} value={courseId} onChange={(e) => { setCourseId(Number(e.target.value)); setClassName(''); setSubject('') }}>{cursos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label className="text-xs font-semibold">Disciplina<select className={input} required value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Selecione</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold">Turma<select className={input} required value={className} onChange={(e) => setClassName(e.target.value)}><option value="">Selecione</option>{classes.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold">Data<input className={input} name="date" type="date" required defaultValue={editing?.date || new Date().toISOString().slice(0, 10)} key={editing?.id || 'new-date'} /></label><label className="text-xs font-semibold sm:col-span-2">Aula<select className={input} name="lesson" required defaultValue={editing?.lesson || 'Aula 1 · Manhã'} key={editing?.id || 'new-lesson'}>{editing?.lesson && !['Aula 1 · Manhã', 'Aula 2 · Manhã', 'Aula 1 · Tarde', 'Aula 2 · Tarde'].includes(editing.lesson) && <option>{editing.lesson}</option>}{['Aula 1 · Manhã', 'Aula 2 · Manhã', 'Aula 1 · Tarde', 'Aula 2 · Tarde'].map((item) => <option key={item}>{item}</option>)}</select></label></div>
        <fieldset className="h-[520px] space-y-2 overflow-y-auto rounded-lg border border-slate-100 p-3"><legend className="px-1 text-xs font-semibold text-slate-600">Chamada rápida · selecione quem não está presente</legend>{students.map((student) => { const prior = editing?.students.find((row) => row.studentId === student.id); const reasons = ['Saúde', 'Compromisso familiar', 'Transporte', 'Outro']; return <article key={student.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name={`include-${student.id}`} defaultChecked={editing ? Boolean(prior) : true} />{student.nome}</label><div className="flex gap-2"><select name={`status-${student.id}`} defaultValue={prior?.status || 'Presente'} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs"><option>Presente</option><option>Ausente</option><option>Falta justificada</option><option>Atraso</option></select><select name={`reason-${student.id}`} defaultValue={prior?.reason || ''} className="h-9 max-w-40 rounded-lg border border-slate-300 bg-white px-2 text-xs"><option value="">Sem justificativa</option>{prior?.reason && !reasons.includes(prior.reason) && <option>{prior.reason}</option>}{reasons.map((item) => <option key={item}>{item}</option>)}</select></div><select name={`activity-${student.id}`} defaultValue={prior?.checks?.[0] || ''} className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"><option value="">Atividade (opcional)</option>{checklistAula.map((item) => <option key={item}>{item}</option>)}</select></article> })}</fieldset><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{editing ? 'Salvar correção' : 'Salvar frequência'}</button>
      </form>
      <aside className="space-y-4">
        <section className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Consulta</p><h4 className="mt-1 font-bold">Filtrar registros</h4></div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{sessions.length} aulas</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <label className="text-xs font-semibold">Disciplina<select className={input} value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Todas</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold">Turma<select className={input} value={className} onChange={(e) => setClassName(e.target.value)}><option value="">Todas</option>{classes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold">Período<select className={input} value={daysBack} onChange={(e) => setDaysBack(e.target.value)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="all">Todo o histórico</option></select></label>
            <label className="text-xs font-semibold">Aluno<select className={input} value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Todos</option>{students.map((student) => <option key={student.id} value={student.id}>{student.nome}</option>)}</select></label>
          </div>
          {selectedStudent && <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">{entries.filter((row) => row.studentId === selectedStudent.id).length} registros · {entries.filter((row) => row.studentId === selectedStudent.id && row.status === 'Ausente').length} faltas não justificadas · {entries.filter((row) => row.studentId === selectedStudent.id && row.status === 'Atraso').length} atrasos</p>}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 border-b border-slate-100 pb-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Arquivo de chamadas</p><h4 className="mt-1 font-bold">Histórico de frequência</h4></div>
          <div className="h-[520px] space-y-2 overflow-y-auto pr-1">
            {sessions.map((session) => {
              const displayedStudents = session.students.filter((row) => !studentId || row.studentId === studentId)
              const attendedCount = displayedStudents.filter((row) => ['Presente', 'Atraso'].includes(row.status)).length
              const absenceCount = displayedStudents.length - attendedCount

              return (
                <article key={session.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-sm font-bold text-slate-800">{session.date} <span className="font-medium text-slate-500">· {session.lesson}</span></p><p className="mt-1 truncate text-xs text-slate-500">{session.subject} · {session.className}</p><p className="mt-2 text-xs"><span className="font-semibold text-emerald-700">{attendedCount} presentes</span><span className="px-1.5 text-slate-300">|</span><span className="font-semibold text-rose-700">{absenceCount} faltas</span></p></div>
                    <button type="button" className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50" onClick={() => { setEditing(session); setClassName(session.className); setSubject(session.subject); setCourseId(session.courseId); setDaysBack('all'); setMessage('') }}>Editar</button>
                  </div>
                  <details className="mt-2 border-t border-slate-200/70 pt-2">
                    <summary className="cursor-pointer text-xs font-medium text-slate-600">Ver chamada ({displayedStudents.length} alunos)</summary>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600">{displayedStudents.map((row) => <li key={row.studentId} className="flex justify-between gap-2"><span className="truncate">{row.name}</span><span className={['Presente', 'Atraso'].includes(row.status) ? 'text-emerald-700' : 'text-rose-700'}>{row.status}</span></li>)}</ul>
                  </details>
                </article>
              )
            })}
            {sessions.length === 0 && <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Não há chamadas neste período e com estes filtros.</p>}
          </div>
        </section>
      </aside>
    </div><p className="text-xs text-slate-500">Dados salvos localmente neste navegador; não sincronizam com outros dispositivos. O limite de alerta é 75% e precisa ser ajustado conforme a regra da instituição.</p>
  </div>
}
