import { useMemo, useState } from 'react'
import { alunos, cursos } from '../data/dadosAcademicos.js'
import { useAcademicData } from '../data/academicoStore.js'

const input = 'mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm'

function MetricCard({ label, value }) {
  return (
    <article className="rounded-lg border border-blue-100 border-l-4 border-l-blue-500 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </article>
  )
}

export default function Desempenho() {
  const data = useAcademicData()
  const [courseId, setCourseId] = useState(cursos[0].id)
  const [studentId, setStudentId] = useState('')
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('')
  const [period, setPeriod] = useState('')
  const course = cursos.find((item) => item.id === Number(courseId))
  const students = alunos.filter((item) => item.curso === course.nome)

  // Os indicadores só usam registros existentes; notas não são estimadas pelo protótipo.
  const sessions = useMemo(
    () =>
      data.attendance
        .filter(
          (row) =>
            row.courseId === course.id &&
            (!className || row.className === className) &&
            (!subject || row.subject === subject) &&
            (!period || row.date.startsWith(period)),
        )
        .flatMap((row) =>
          row.students.map((student) => ({
            ...student,
            date: row.date,
            subject: row.subject,
            className: row.className,
          })),
        ),
    [data.attendance, course.id, className, subject, period],
  )
  const visibleSessions = sessions.filter(
    (row) => !studentId || row.studentId === studentId,
  )
  const learning = data.learning.filter(
    (row) =>
      row.courseId === course.id &&
      (!studentId || row.studentId === studentId) &&
      (!subject || row.subject === subject) &&
      (!period || row.date.startsWith(period)),
  )
  const activeStudents = students.filter((student) =>
    visibleSessions.some((row) => row.studentId === student.id),
  )
  const presentCount = visibleSessions.filter((row) =>
    ['Presente', 'Atraso'].includes(row.status),
  ).length
  const attendanceRate = visibleSessions.length
    ? Math.round((100 * presentCount) / visibleSessions.length)
    : null
  const studentAttendance = students
    .filter((student) => !studentId || student.id === studentId)
    .map((student) => {
      const records = visibleSessions.filter((row) => row.studentId === student.id)
      const absences = records.filter((row) => ['Ausente', 'Falta justificada'].includes(row.status)).length

      return {
        ...student,
        absences,
        total: records.length,
        attendanceRate: records.length ? Math.round((100 * (records.length - absences)) / records.length) : 100,
      }
    })
  const activities = visibleSessions.flatMap((row) => row.checks || [])
  const deliveredActivities = activities.filter(
    (item) => item === 'Entregou atividade solicitada',
  ).length
  const activityRate = activities.length
    ? Math.round((100 * deliveredActivities) / activities.length)
    : null

  // O limite é demonstrativo; a instituição deve definir a regra oficial de alerta.
  const risk = activeStudents
    .map((student) => {
      const studentSessions = visibleSessions.filter(
        (row) => row.studentId === student.id,
      )
      const attendedCount = studentSessions.filter((row) =>
        ['Presente', 'Atraso'].includes(row.status),
      ).length
      const presentRate = studentSessions.length
        ? attendedCount / studentSessions.length
        : 1
      const difficulties = learning.filter(
        (row) => row.studentId === student.id && row.category === 'Dificuldade',
      ).length

      return { student, presentRate, difficulties }
    })
    .filter((row) => row.presentRate < 0.75 || row.difficulties > 0)

  const classes = [
    ...new Set(
      ['Turma A', 'Turma B', ...data.attendance
        .filter((row) => row.courseId === course.id)
        .map((row) => row.className)],
    ),
  ]
  const subjects = [
    ...new Set([
      course.nome,
      ...data.attendance
        .filter((row) => row.courseId === course.id)
        .map((row) => row.subject),
      ...data.learning
        .filter((row) => row.courseId === course.id)
        .map((row) => row.subject),
    ]),
  ]
  return (
    <div className="space-y-5 text-[#10213a]">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Leitura dos dados</p>
        <h3 className="mt-1 text-xl font-bold">Indicadores da turma</h3>
        <p className="mt-1 text-sm text-slate-600">
          Indicadores derivados dos registros de frequência e aprendizagem. Não há
          notas ou avaliações cadastradas.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Alunos com registros" value={activeStudents.length} />
        <MetricCard
          label="Frequência observada"
          value={attendanceRate === null ? '—' : `${attendanceRate}%`}
        />
        <MetricCard
          label="Checklist de entrega"
          value={activityRate === null ? '—' : `${activityRate}%`}
        />
        <MetricCard label="Precisam de atenção*" value={risk.length} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="font-bold">Filtros combinados</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold">
            Curso
            <select
              className={input}
              value={courseId}
              onChange={(event) => {
                setCourseId(Number(event.target.value))
                setStudentId('')
                setClassName('')
                setSubject('')
              }}
            >
              {cursos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold">
            Turma
            <select
              className={input}
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            ><option value="">Todas</option>{classes.map((name) => <option key={name}>{name}</option>)}</select>
          </label>

          <label className="text-xs font-semibold">
            Disciplina
            <select
              className={input}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            ><option value="">Todas</option>{subjects.map((name) => <option key={name}>{name}</option>)}</select>
          </label>

          <label className="text-xs font-semibold">
            Aluno
            <select
              className={input}
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              <option value="">Todos</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold">
            Período
            <input
              type="month"
              className={input}
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            />
          </label>

          <p className="self-center text-xs text-slate-500">
            Notas e avaliações ainda não estão cadastradas.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold">Frequência por aluno</h4>
            <p className="mt-1 text-xs text-slate-500">Parte de 100% e diminui conforme as faltas registradas nos filtros.</p>
          </div>
          <span className="text-xs text-slate-500">{visibleSessions.length} presenças e faltas registradas</span>
        </div>
        <div className="mt-2 divide-y divide-slate-100">
          {studentAttendance.map((student) => (
            <div key={student.id} className="grid grid-cols-[minmax(0,1fr)_minmax(80px,180px)_70px] items-center gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{student.nome}</p>
                <p className="text-xs text-slate-500">{student.absences} faltas de {student.total} aulas</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${student.attendanceRate ?? 0}%` }} />
              </div>
              <strong className={`text-right text-sm ${student.attendanceRate !== null && student.attendanceRate < 75 ? 'text-rose-700' : 'text-slate-700'}`}>
                {student.attendanceRate}%
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h4 className="font-bold">Alunos que podem precisar de acompanhamento</h4>
        <p className="mt-1 text-xs text-amber-900">
          *Critério: frequência registrada abaixo de 75% ou ao menos uma
          dificuldade pedagógica anotada. Limite demonstrativo e ajustável pela
          instituição.
        </p>
        <div className="mt-3 space-y-2">
          {risk.map(({ student, presentRate, difficulties }) => (
            <article
              key={student.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3"
            >
              <div>
                <strong className="text-sm">{student.nome}</strong>
                <p className="text-xs text-slate-600">
                  {Math.round(presentRate * 100)}% de presença registrada ·{' '}
                  {difficulties} dificuldades anotadas
                </p>
              </div>
              <button
                onClick={() => setStudentId(student.id)}
                className="text-xs font-semibold text-blue-700"
              >
                Ver histórico
              </button>
            </article>
          ))}
          {!risk.length && (
            <p className="text-sm text-slate-600">
              Nenhum alerta calculável para os filtros atuais.
            </p>
          )}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Médias de notas, aprovação, evolução de avaliações e comparação de
        desempenho dependem de notas e avaliações ainda não disponíveis no
        sistema.
      </p>
    </div>
  )
}
