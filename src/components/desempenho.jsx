import { useMemo, useState } from 'react'
import { alunos, cursos } from '../data/dadosAcademicos.js'
import { useAcademicData } from '../data/academicoStore.js'

const input = 'mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm'

function MetricCard({ label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </article>
  )
}

function AttendanceRow({ row }) {
  const attended = ['Presente', 'Atraso'].includes(row.status)

  return (
    <div className="grid grid-cols-[minmax(110px,1fr)_2fr_55px] items-center gap-2 text-xs">
      <span className="truncate">
        {row.name} · {row.date}
      </span>
      <div className="h-2 rounded bg-slate-100">
        <div
          className={`h-2 rounded ${attended ? 'bg-emerald-500' : 'bg-rose-400'}`}
          style={{ width: '100%' }}
        />
      </div>
      <strong>{row.status}</strong>
    </div>
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
      data.attendance
        .filter((row) => row.courseId === course.id)
        .map((row) => row.className),
    ),
  ]
  const subjects = [
    ...new Set([
      ...data.attendance
        .filter((row) => row.courseId === course.id)
        .map((row) => row.subject),
      ...data.learning
        .filter((row) => row.courseId === course.id)
        .map((row) => row.subject),
    ]),
  ]
  const learningByCategory = Object.entries(
    learning.reduce(
      (counts, row) => ({
        ...counts,
        [row.category]: (counts[row.category] || 0) + 1,
      }),
      {},
    ),
  )

  return (
    <div className="space-y-5 text-[#10213a]">
      <header>
        <h3 className="text-xl font-bold">Desempenho e acompanhamento</h3>
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
            <input
              className={input}
              list="desempenho-turmas"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Todas"
            />
            <datalist id="desempenho-turmas">
              {classes.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>

          <label className="text-xs font-semibold">
            Disciplina
            <input
              className={input}
              list="desempenho-disciplinas"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Todas"
            />
            <datalist id="desempenho-disciplinas">
              {subjects.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
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
        <h4 className="font-bold">Registros observáveis</h4>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div>
            <h5 className="text-sm font-semibold">Frequência por aula</h5>
            <div className="mt-2 space-y-2">
              {visibleSessions.map((row, index) => (
                <AttendanceRow
                  key={`${row.studentId}-${row.date}-${index}`}
                  row={row}
                />
              ))}
              {!sessions.length && (
                <p className="text-sm text-slate-500">
                  Registre chamadas para visualizar dados.
                </p>
              )}
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold">
              Observações de aprendizagem por categoria
            </h5>
            <div className="mt-2 space-y-2">
              {learningByCategory.map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>
              ))}
              {!learning.length && (
                <p className="text-sm text-slate-500">
                  Registre observações pedagógicas para consultar a evolução.
                </p>
              )}
            </div>
          </div>
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
