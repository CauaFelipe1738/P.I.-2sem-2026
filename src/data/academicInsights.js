export const isPresentStatus = (status) => ['Presente', 'Atraso'].includes(status)

/** Deriva alertas apenas dos registros existentes; limites e contagens são critérios demonstrativos. */
export function deriveAcademicAlerts(students, attendanceRows, learningRows) {
  return students.flatMap((student) => {
    const attendance = attendanceRows.filter((row) => row.studentId === student.id)
    const present = attendance.filter((row) => isPresentStatus(row.status)).length
    const rate = attendance.length ? Math.round((present / attendance.length) * 100) : null
    const difficulties = learningRows.filter((row) => row.studentId === student.id && row.category === 'Dificuldade')
    const activePlans = learningRows.filter((row) => row.studentId === student.id && row.plan && row.plan.status !== 'Concluído')
    const alerts = []

    if (attendance.length >= 2 && rate < 75) {
      const latest = attendance.map((row) => row.date).filter(Boolean).sort().at(-1) || ''
      alerts.push({ id: `attendance-${student.id}-${attendance.length}-${present}-${latest}`, student, courseName: student.curso, priority: 'Alta', kind: 'Frequência', message: `Frequência de ${rate}% em ${attendance.length} registros.`, latest })
    }
    if (difficulties.length >= 2) {
      const latest = difficulties.map((row) => row.date).filter(Boolean).sort().at(-1) || ''
      alerts.push({ id: `difficulty-${student.id}-${difficulties.length}-${latest}`, student, courseName: student.curso, priority: 'Média', kind: 'Dificuldade recorrente', message: `${difficulties.length} observações de dificuldade.`, latest })
    }
    if (activePlans.length > 0) {
      const plan = activePlans[0]
      alerts.push({ id: `plan-${student.id}-${plan.id}`, student, courseName: student.curso, priority: 'Baixa', kind: 'Plano em acompanhamento', message: plan.plan.goal || 'Plano com acompanhamento pendente.', latest: plan.date || '' })
    }
    return alerts
  }).sort((a, b) => ['Alta', 'Média', 'Baixa'].indexOf(a.priority) - ['Alta', 'Média', 'Baixa'].indexOf(b.priority))
}
