import { useState } from 'react'
import { alunos, cursos } from '../data/dadosAcademicos.js'
import {
  addLearning,
  checklistAprendizagem,
  optionsForCourse,
  updateLearning,
  useAcademicData,
} from '../data/academicoStore.js'

const field = 'mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm'
const emptyForm = {
  difficulty: '',
  goal: '',
  action: '',
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  status: 'Pendente',
  result: '',
}

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </article>
  )
}

export default function Aprendizagem() {
  const data = useAcademicData()
  const [courseId, setCourseId] = useState(cursos[0].id)
  const [studentId, setStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Desenvolvimento de habilidade')
  const [editingId, setEditingId] = useState(null)
  const [planForm, setPlanForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const course = cursos.find((item) => item.id === Number(courseId))
  const students = optionsForCourse(course.nome, alunos)

  // Observações e planos compartilham a coleção para compor o histórico individual.
  const records = data.learning.filter(
    (item) =>
      item.courseId === course.id &&
      (!studentId || item.studentId === studentId) &&
      (!subject || item.subject === subject),
  )
  const plans = records.filter((item) => item.plan)
  const activePlans = plans.filter((item) => item.plan.status !== 'Concluído')
  const editingRecord = data.learning.find((item) => item.id === editingId)
  const byCategory = Object.entries(
    records.reduce(
      (counts, item) => ({
        ...counts,
        [item.category]: (counts[item.category] || 0) + 1,
      }),
      {},
    ),
  )
  const difficultyCount = records.filter(
    (item) => item.category === 'Dificuldade',
  ).length

  function saveObservation(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const student = students.find((item) => item.id === form.get('studentId'))

    // Na edição, preserva o vínculo com o plano e a data original de criação.
    const record = {
      id: editingId || crypto.randomUUID(),
      courseId: course.id,
      courseName: course.nome,
      studentId: student.id,
      studentName: student.nome,
      subject,
      date: form.get('date'),
      category,
      checks: checklistAprendizagem.filter((_, index) =>
        form.get(`check-${index}`),
      ),
      description: form.get('description'),
      action: form.get('action'),
      teacher: form.get('teacher') || 'Professor',
      plan: editingRecord?.plan || null,
      createdAt: editingRecord?.createdAt || new Date().toISOString(),
    }

    if (editingId) {
      updateLearning(editingId, record)
      setMessage('Observação atualizada.')
    } else {
      addLearning(record)
      setMessage('Observação pedagógica registrada.')
    }

    setEditingId(null)
    event.currentTarget.reset()
  }

  function savePlan(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const student = students.find((item) => item.id === form.get('studentId'))
    const plan = Object.fromEntries(
      ['difficulty', 'goal', 'action', 'startDate', 'dueDate', 'status', 'result'].map(
        (key) => [key, form.get(key)],
      ),
    )

    // Atualiza o plano já associado ao aluno em vez de criar outro registro duplicado.
    const existing = plans.find((item) => item.studentId === student.id)

    if (existing) {
      updateLearning(existing.id, { plan })
    } else {
      addLearning({
        id: crypto.randomUUID(),
        courseId: course.id,
        courseName: course.nome,
        studentId: student.id,
        studentName: student.nome,
        subject,
        date: plan.startDate,
        category: 'Plano de acompanhamento',
        description: plan.difficulty,
        checks: [],
        action: plan.action,
        teacher: 'Professor',
        plan,
        createdAt: new Date().toISOString(),
      })
    }

    setPlanForm(emptyForm)
    setMessage('Plano de acompanhamento salvo.')
  }

  return (
    <div className="space-y-5 text-[#10213a]">
      <header>
        <h3 className="text-xl font-bold">Acompanhamento da aprendizagem</h3>
        <p className="mt-1 text-sm text-slate-600">
          Registre o processo de aprendizagem, habilidades, dificuldades e ações
          pedagógicas.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Registros pedagógicos" value={records.length} />
        <SummaryCard label="Dificuldades registradas" value={difficultyCount} />
        <SummaryCard label="Planos ativos" value={activePlans.length} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold">
            Curso
            <select
              className={field}
              value={courseId}
              onChange={(event) => {
                setCourseId(Number(event.target.value))
                setStudentId('')
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
            Filtrar disciplina
            <input
              className={field}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Todas"
            />
          </label>

          <label className="text-xs font-semibold">
            Histórico do aluno
            <select
              className={field}
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              <option value="">Turma inteira</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {byCategory.map(([name, count]) => (
            <span
              key={name}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-800"
            >
              {name}: {count}
            </span>
          ))}
          {!byCategory.length && (
            <p className="text-sm text-slate-500">Sem registros nesta seleção.</p>
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <form
          key={editingId || 'new'}
          onSubmit={saveObservation}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold">
              {editingId ? 'Editar observação' : 'Nova observação pedagógica'}
            </h4>
            {editingId && (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-xs text-blue-700"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Aluno
              <select
                name="studentId"
                required
                className={field}
                defaultValue={editingRecord?.studentId || studentId}
              >
                {students.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold">
              Data
              <input
                name="date"
                type="date"
                required
                defaultValue={
                  editingRecord?.date || new Date().toISOString().slice(0, 10)
                }
                className={field}
              />
            </label>

            <label className="text-xs font-semibold">
              Disciplina
              <input
                className={field}
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </label>

            <label className="text-xs font-semibold">
              Categoria
              <select
                className={field}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>Desenvolvimento de habilidade</option>
                <option>Dificuldade</option>
                <option>Participação</option>
                <option>Evolução</option>
                <option>Necessita de reforço</option>
              </select>
            </label>

            <label className="text-xs font-semibold">
              Professor responsável
              <input
                name="teacher"
                className={field}
                defaultValue={editingRecord?.teacher || ''}
                placeholder="Nome do professor"
              />
            </label>
          </div>

          <div className="grid gap-1 sm:grid-cols-2">
            {checklistAprendizagem.map((item, index) => (
              <label
                key={item}
                className="flex items-center gap-2 py-1 text-xs text-slate-600"
              >
                <input
                  type="checkbox"
                  name={`check-${index}`}
                  defaultChecked={editingRecord?.checks.includes(item)}
                />
                {item}
              </label>
            ))}
          </div>

          <label className="block text-xs font-semibold">
            Descrição
            <textarea
              name="description"
              required
              className={`${field} h-20 py-2`}
              defaultValue={editingRecord?.description || ''}
            />
          </label>

          <label className="block text-xs font-semibold">
            Ação de acompanhamento
            <textarea
              name="action"
              className={`${field} h-16 py-2`}
              defaultValue={editingRecord?.action || ''}
              placeholder="Próximo passo pedagógico"
            />
          </label>

          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Salvar observação
          </button>
          {message && (
            <p role="status" className="ml-3 inline text-sm text-emerald-700">
              {message}
            </p>
          )}
        </form>

        <form
          onSubmit={savePlan}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <h4 className="font-bold">Plano de acompanhamento</h4>

          <label className="block text-xs font-semibold">
            Aluno
            <select name="studentId" required className={field}>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold">
            Dificuldade identificada
            <input
              name="difficulty"
              required
              className={field}
              value={planForm.difficulty}
              onChange={(event) =>
                setPlanForm({ ...planForm, difficulty: event.target.value })
              }
            />
          </label>

          <label className="block text-xs font-semibold">
            Objetivo de aprendizagem
            <input
              name="goal"
              required
              className={field}
              value={planForm.goal}
              onChange={(event) =>
                setPlanForm({ ...planForm, goal: event.target.value })
              }
            />
          </label>

          <label className="block text-xs font-semibold">
            Ação proposta
            <textarea
              name="action"
              required
              className={`${field} h-16 py-2`}
              value={planForm.action}
              onChange={(event) =>
                setPlanForm({ ...planForm, action: event.target.value })
              }
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Início
              <input
                type="date"
                name="startDate"
                required
                className={field}
                value={planForm.startDate}
                onChange={(event) =>
                  setPlanForm({ ...planForm, startDate: event.target.value })
                }
              />
            </label>

            <label className="text-xs font-semibold">
              Prazo
              <input
                type="date"
                name="dueDate"
                required
                className={field}
                value={planForm.dueDate}
                onChange={(event) =>
                  setPlanForm({ ...planForm, dueDate: event.target.value })
                }
              />
            </label>
          </div>

          <label className="block text-xs font-semibold">
            Situação
            <select
              name="status"
              className={field}
              value={planForm.status}
              onChange={(event) =>
                setPlanForm({ ...planForm, status: event.target.value })
              }
            >
              <option>Pendente</option>
              <option>Em acompanhamento</option>
              <option>Concluído</option>
            </select>
          </label>

          <label className="block text-xs font-semibold">
            Resultado observado
            <input
              name="result"
              className={field}
              value={planForm.result}
              onChange={(event) =>
                setPlanForm({ ...planForm, result: event.target.value })
              }
            />
          </label>

          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Salvar plano
          </button>
        </form>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="font-bold">Histórico de aprendizagem</h4>
        <div className="mt-3 space-y-2">
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-lg border border-slate-100 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong className="text-sm">
                    {record.studentName} · {record.category}
                  </strong>
                  <p className="text-xs text-slate-500">
                    {record.date} · {record.subject} · {record.teacher}
                  </p>
                </div>
                <button
                  className="text-xs font-semibold text-blue-700"
                  onClick={() => {
                    setEditingId(record.id)
                    setCategory(record.category)
                  }}
                >
                  Editar
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-700">{record.description}</p>
              {record.checks.length > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                  Checklist: {record.checks.join(' · ')}
                </p>
              )}
              {record.action && (
                <p className="mt-1 text-xs text-slate-600">
                  Acompanhamento: {record.action}
                </p>
              )}
              {record.plan && (
                <p className="mt-2 rounded bg-amber-50 p-2 text-xs">
                  Plano: {record.plan.goal} · {record.plan.status} · prazo{' '}
                  {record.plan.dueDate}
                  {record.plan.result ? ` · Resultado: ${record.plan.result}` : ''}
                </p>
              )}
            </article>
          ))}
          {!records.length && (
            <p className="py-6 text-center text-sm text-slate-500">
              Nenhum registro pedagógico encontrado.
            </p>
          )}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Os registros são compartilhados entre as áreas neste navegador. A
        sincronização institucional requer backend e autenticação.
      </p>
    </div>
  )
}
