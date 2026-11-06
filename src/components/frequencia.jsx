import { useState } from 'react'
import { alunos, cursos } from '../data/dadosAcademicos.js'
import { addAttendance, checklistAula, optionsForCourse, updateAttendance, useAcademicData } from '../data/academicoStore.js'

// Classes utilitárias comuns mantêm os campos e indicadores visualmente consistentes.
const input = 'mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
const pill = 'rounded-lg border border-slate-200 bg-white p-4'

// Separa a conversão do formulário da gravação para manter o formato do registro consistente.
function buildAttendanceRows(form, students) {
  return students
    .filter((student) => form.has(`include-${student.id}`))
    .map((student) => ({
      studentId: student.id,
      name: student.nome,
      status: form.get(`status-${student.id}`) || 'Presente',
      reason: form.get(`reason-${student.id}`) || '',
      checks: checklistAula.filter((_, index) =>
        form.get(`check-${student.id}-${index}`),
      ),
      note: form.get(`note-${student.id}`) || '',
    }))
}

export default function Frequencia() {
  const data = useAcademicData()
  const [courseId, setCourseId] = useState(cursos[0].id)
  const [studentId, setStudentId] = useState('')
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('')
  const [period, setPeriod] = useState('')
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const course = cursos.find((item) => item.id === Number(courseId))
  const students = optionsForCourse(course.nome, alunos)
  // Os filtros são combinados sobre as chamadas do curso selecionado.
  const sessions = data.attendance.filter((session) => session.courseId === course.id && (!className || session.className === className) && (!subject || session.subject === subject) && (!period || session.date.startsWith(period)))
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
    <header><h3 className="text-xl font-bold">Controle de frequência</h3><p className="mt-1 text-sm text-slate-600">Registre presenças por aula, consulte o histórico e corrija lançamentos.</p></header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><article className={pill}><p className="text-xs text-slate-500">Presença nas aulas registradas</p><strong className="mt-1 block text-2xl">{rate === null ? '—' : `${rate}%`}</strong></article><article className={pill}><p className="text-xs text-slate-500">Faltas e faltas justificadas</p><strong className="mt-1 block text-2xl">{absent}</strong></article><article className={pill}><p className="text-xs text-slate-500">Aulas registradas</p><strong className="mt-1 block text-2xl">{sessions.length}</strong></article><article className={pill}><p className="text-xs text-slate-500">Alunos abaixo de 75%</p><strong className="mt-1 block text-2xl">{students.filter((student) => { const rows = entries.filter((row) => row.studentId === student.id); return rows.length > 0 && rows.filter((row) => row.status === 'Presente' || row.status === 'Atraso').length / rows.length < 0.75 }).length}</strong></article></div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,1fr)]">
      <form onSubmit={saveSession} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h4 className="font-bold">{editing ? 'Corrigir chamada' : 'Registrar aula'}</h4>{editing && <button type="button" className="text-sm text-blue-700" onClick={() => setEditing(null)}>Cancelar edição</button>}</div>{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Curso<select className={input} value={courseId} onChange={(e) => setCourseId(Number(e.target.value))}>{cursos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label className="text-xs font-semibold">Disciplina<input className={input} required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Digite a disciplina" /></label><label className="text-xs font-semibold">Turma<input className={input} required value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Digite a turma" /></label><label className="text-xs font-semibold">Data<input className={input} name="date" type="date" required defaultValue={editing?.date || new Date().toISOString().slice(0, 10)} key={editing?.id || 'new-date'} /></label><label className="text-xs font-semibold sm:col-span-2">Aula/horário<input className={input} name="lesson" required placeholder="Ex.: Aula 3 · 08:00" defaultValue={editing?.lesson || ''} key={editing?.id || 'new-lesson'} /></label></div>
        <fieldset className="max-h-[450px] space-y-3 overflow-auto rounded-lg border border-slate-100 p-3"><legend className="px-1 text-xs font-semibold text-slate-600">Alunos desta chamada</legend>{students.map((student) => { const prior = editing?.students.find((row) => row.studentId === student.id); return <article key={student.id} className="rounded-lg bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name={`include-${student.id}`} defaultChecked={editing ? Boolean(prior) : true} />{student.nome}</label><select name={`status-${student.id}`} defaultValue={prior?.status || 'Presente'} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs"><option>Presente</option><option>Ausente</option><option>Falta justificada</option><option>Atraso</option></select></div><input name={`reason-${student.id}`} defaultValue={prior?.reason || ''} className={`${input} h-9`} placeholder="Justificativa (se aplicável)" /><div className="mt-2 grid gap-1 sm:grid-cols-2">{checklistAula.map((item, index) => <label key={item} className="flex items-center gap-2 text-[11px] text-slate-600"><input type="checkbox" name={`check-${student.id}-${index}`} defaultChecked={prior?.checks?.includes(item)} />{item}</label>)}</div><input name={`note-${student.id}`} defaultValue={prior?.note || ''} className={`${input} h-9`} placeholder="Observação adicional" /></article>})}</fieldset><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{editing ? 'Salvar correção' : 'Salvar frequência'}</button>
      </form>
      <aside className="space-y-4"><div className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-bold">Filtros e histórico</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><label className="text-xs font-semibold">Filtrar disciplina<input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Todas" /></label><label className="text-xs font-semibold">Filtrar turma<input className={input} value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Todas" /></label><label className="text-xs font-semibold">Período<input className={input} type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></label><label className="text-xs font-semibold">Histórico por aluno<select className={input} value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Todos</option>{students.map((student) => <option key={student.id} value={student.id}>{student.nome}</option>)}</select></label></div>{selectedStudent && <p className="mt-3 text-xs text-slate-600">{entries.filter((row) => row.studentId === selectedStudent.id).length} registros · {entries.filter((row) => row.studentId === selectedStudent.id && row.status === 'Ausente').length} faltas não justificadas · {entries.filter((row) => row.studentId === selectedStudent.id && row.status === 'Atraso').length} atrasos</p>}</div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-bold">Aulas recentes</h4><div className="mt-3 space-y-2">{sessions.map((session) => <article key={session.id} className="rounded-lg border border-slate-100 p-3"><div className="flex items-start justify-between gap-2"><div><strong className="text-sm">{session.date} · {session.lesson}</strong><p className="text-xs text-slate-500">{session.subject} · {session.className}</p></div><button type="button" className="text-xs font-semibold text-blue-700" onClick={() => { setEditing(session); setClassName(session.className); setSubject(session.subject); setCourseId(session.courseId); setMessage('') }}>Editar</button></div><ul className="mt-2 space-y-1 text-xs text-slate-600">{session.students.filter((row) => !studentId || row.studentId === studentId).map((row) => <li key={row.studentId}><strong>{row.name}:</strong> {row.status}{row.reason ? ` · ${row.reason}` : ''}{row.note ? ` · ${row.note}` : ''}</li>)}</ul></article>)}{sessions.length === 0 && <p className="py-5 text-center text-sm text-slate-500">Ainda não há aulas registradas para esses filtros.</p>}</div></div></aside>
    </div><p className="text-xs text-slate-500">Dados salvos localmente neste navegador; não sincronizam com outros dispositivos. O limite de alerta é 75% e precisa ser ajustado conforme a regra da instituição.</p>
  </div>
}
