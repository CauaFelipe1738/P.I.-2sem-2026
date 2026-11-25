import { useMemo, useState } from 'react'
import { alunos } from '../data/dadosAcademicos.js'
import { deriveAcademicAlerts } from '../data/academicInsights.js'
import { useAcademicData } from '../data/academicoStore.js'

const STORAGE_KEY = 'edulytics.notifications.read.v1'

function readIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export default function NotificationCenter({ onOpenStudent }) {
  const data = useAcademicData()
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState(readIds)
  const entries = useMemo(() => {
    const attendance = data.attendance.flatMap((session) => (session.students || []).map((student) => ({ ...student, date: session.date, courseId: session.courseId, sessionId: session.id })))
    return deriveAcademicAlerts(alunos, attendance, data.learning)
  }, [data.attendance, data.learning])
  const unread = entries.filter((item) => !read.has(item.id))

  function saveRead(next) {
    setRead(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next].slice(-200))) } catch { /* A lista continua disponível na sessão atual. */ }
  }

  function markAllRead() { saveRead(new Set([...read, ...entries.map((item) => item.id)])) }
  function openAlert(alert) {
    saveRead(new Set([...read, alert.id]))
    setOpen(false)
    onOpenStudent?.(alert)
  }

  return <div className="relative">
    <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={`Notificações${unread.length ? `, ${unread.length} não lidas` : ''}`} className="relative flex h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-slate-600 hover:bg-slate-50">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      {unread.length > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">{unread.length > 9 ? '9+' : unread.length}</span>}
    </button>
    {open && <section aria-label="Central de notificações" className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-36px))] overflow-hidden rounded-xl border border-[#d9e1eb] bg-white shadow-xl">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="text-sm font-bold text-slate-800">Acompanhamento</h2><p className="mt-1 text-xs text-slate-500">{unread.length ? `${unread.length} alertas não lidos` : 'Tudo em dia'}</p></div>{unread.length > 0 && <button onClick={markAllRead} className="text-[11px] font-semibold text-blue-700 hover:text-blue-900">Marcar todas como lidas</button>}</header>
      <div className="max-h-[min(60dvh,440px)] divide-y divide-slate-100 overflow-y-auto">
        {entries.slice(0, 12).map((item) => <button key={item.id} onClick={() => openAlert(item)} className="flex w-full items-start gap-3 p-3 text-left hover:bg-slate-50"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.priority === 'Alta' ? 'bg-rose-500' : item.priority === 'Média' ? 'bg-amber-500' : 'bg-blue-500'}`} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-xs text-slate-800">{item.student.nome}</strong><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.priority === 'Alta' ? 'bg-rose-50 text-rose-700' : item.priority === 'Média' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>{item.priority}</span></span><span className="mt-0.5 block truncate text-[11px] text-slate-600">{item.kind} · {item.message}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{item.courseName} · abrir perfil</span></span>{!read.has(item.id) && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue-600" aria-label="Não lida" />}</button>)}
        {!entries.length && <p className="px-4 py-9 text-center text-sm text-slate-500">Nenhum alerta acadêmico com os registros atuais.</p>}
      </div>
      <p className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] leading-4 text-slate-500">Alertas locais. Frequência baixa usa limite demonstrativo de 75% com pelo menos duas chamadas.</p>
    </section>}
  </div>
}
