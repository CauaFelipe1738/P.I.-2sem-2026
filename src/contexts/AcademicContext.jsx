import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as academicoService from '../services/academicoService.js'
import { useAuth } from './AuthContext.jsx'

const AcademicContext = createContext(null)

export function AcademicProvider({ children }) {
  const { isAuthenticated, cargo } = useAuth()
  const isProfessor = isAuthenticated && cargo === 'Professor'

  const [cursos, setCursos] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const [cursoIdState, setCursoId] = useState(null)
  const [turmaIdState, setTurmaId] = useState(null)
  const [disciplinaTurmaIdState, setDisciplinaTurmaId] = useState(null)
  const [periodoIdState, setPeriodoId] = useState(null)
  const [loadingContexto, setLoadingContexto] = useState(false)
  const [erroContexto, setErroContexto] = useState(null)

  const cursosAtivos = useMemo(() => (isProfessor ? cursos : []), [isProfessor, cursos])
  const periodosAtivos = useMemo(() => (isProfessor ? periodos : []), [isProfessor, periodos])
  const turmasAtivas = useMemo(() => (isProfessor ? turmas : []), [isProfessor, turmas])
  const disciplinasAtivas = useMemo(
    () => (isProfessor ? disciplinas : []),
    [isProfessor, disciplinas],
  )

  const cursoId = useMemo(
    () =>
      cursoIdState && cursosAtivos.some((c) => c.id === cursoIdState)
        ? cursoIdState
        : cursosAtivos[0]?.id ?? null,
    [cursoIdState, cursosAtivos],
  )

  const periodoId = useMemo(
    () =>
      periodoIdState && periodosAtivos.some((p) => p.id === periodoIdState)
        ? periodoIdState
        : periodosAtivos[0]?.id ?? null,
    [periodoIdState, periodosAtivos],
  )

  const turmaId = useMemo(
    () =>
      turmaIdState && turmasAtivas.some((t) => t.id === turmaIdState)
        ? turmaIdState
        : turmasAtivas[0]?.id ?? null,
    [turmaIdState, turmasAtivas],
  )

  const disciplinaTurmaId = useMemo(
    () =>
      disciplinaTurmaIdState &&
      disciplinasAtivas.some((d) => d.disciplinaTurmaId === disciplinaTurmaIdState)
        ? disciplinaTurmaIdState
        : disciplinasAtivas[0]?.disciplinaTurmaId ?? null,
    [disciplinaTurmaIdState, disciplinasAtivas],
  )

  const carregarBase = useCallback(async (signal) => {
    if (!isProfessor) return
    setLoadingContexto(true)
    setErroContexto(null)
    try {
      const [cursosRes, periodosRes] = await Promise.all([
        academicoService.listCursos({ page: 0, size: 50 }, signal),
        academicoService.listPeriodos(signal),
      ])
      setCursos(cursosRes?.content || [])
      setPeriodos(Array.isArray(periodosRes) ? periodosRes : [])
    } catch (error) {
      if (error?.name !== 'AbortError') setErroContexto(error)
    } finally {
      setLoadingContexto(false)
    }
  }, [isProfessor])

  useEffect(() => {
    if (!isProfessor) return undefined
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) carregarBase(controller.signal)
    })
    return () => controller.abort()
  }, [isProfessor, carregarBase])

  useEffect(() => {
    if (!cursoId || !isProfessor) return undefined
    const controller = new AbortController()
    academicoService
      .listTurmasByCurso(cursoId, undefined, controller.signal)
      .then((lista) => {
        if (!controller.signal.aborted) setTurmas(Array.isArray(lista) ? lista : [])
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setErroContexto(error)
      })
    return () => controller.abort()
  }, [cursoId, isProfessor])

  useEffect(() => {
    if (!turmaId || !isProfessor) return undefined
    const controller = new AbortController()
    academicoService
      .listDisciplinasByTurma(turmaId, controller.signal)
      .then((lista) => {
        if (!controller.signal.aborted) setDisciplinas(Array.isArray(lista) ? lista : [])
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setErroContexto(error)
      })
    return () => controller.abort()
  }, [turmaId, isProfessor])

  const cursoAtual = useMemo(() => cursosAtivos.find((c) => c.id === cursoId) || null, [cursosAtivos, cursoId])
  const turmaAtual = useMemo(() => turmasAtivas.find((t) => t.id === turmaId) || null, [turmasAtivas, turmaId])
  const disciplinaAtual = useMemo(
    () => disciplinasAtivas.find((d) => d.disciplinaTurmaId === disciplinaTurmaId) || null,
    [disciplinasAtivas, disciplinaTurmaId],
  )

  return (
    <AcademicContext.Provider
      value={{
        cursos: cursosAtivos,
        periodos: periodosAtivos,
        turmas: turmasAtivas,
        disciplinas: disciplinasAtivas,
        cursoId,
        turmaId,
        disciplinaTurmaId,
        periodoId,
        cursoAtual,
        turmaAtual,
        disciplinaAtual,
        loadingContexto,
        erroContexto,
        setCursoId,
        setTurmaId,
        setDisciplinaTurmaId,
        setPeriodoId,
        recarregarContexto: () => carregarBase(),
      }}
    >
      {children}
    </AcademicContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAcademic() {
  const ctx = useContext(AcademicContext)
  if (!ctx) throw new Error('useAcademic deve ser utilizado dentro de AcademicProvider.')
  return ctx
}
