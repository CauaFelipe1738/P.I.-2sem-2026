import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { AcademicProvider } from './contexts/AcademicContext.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import AppShell from './components/layout/AppShell.jsx'
import './App.css'

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const CursosProfessorPage = lazy(() => import('./pages/CursosProfessorPage.jsx'))
const VisaoGeralPage = lazy(() => import('./pages/VisaoGeralPage.jsx'))
const FrequenciaPage = lazy(() => import('./pages/FrequenciaPage.jsx'))
const AvaliacoesPage = lazy(() => import('./pages/AvaliacoesPage.jsx'))
const AprendizagemPage = lazy(() => import('./pages/AprendizagemPage.jsx'))
const DesempenhoPage = lazy(() => import('./pages/DesempenhoPage.jsx'))
const RelatoriosPage = lazy(() => import('./pages/RelatoriosPage.jsx'))
const PainelAlunoPage = lazy(() => import('./pages/PainelAlunoPage.jsx'))

const CarregandoTela = (
  <div className="loading-screen" role="status" aria-label="Carregando página">
    <span className="loading-spinner" aria-hidden="true" />
  </div>
)

function HomeRedirect() {
  const { isAuthenticated, isBootstrapping, cargo } = useAuth()
  if (isBootstrapping) return CarregandoTela
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={cargo === 'Aluno' ? '/aluno' : '/professor/cursos'} replace />
}

function ProfessorRoute({ children, showContextBar = true }) {
  return (
    <ProtectedRoute allowedRoles={['Professor']}>
      <AppShell showContextBar={showContextBar}>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AcademicProvider>
        <BrowserRouter>
          <Suspense fallback={CarregandoTela}>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/professor/cursos"
                element={
                  <ProfessorRoute showContextBar={false}>
                    <CursosProfessorPage />
                  </ProfessorRoute>
                }
              />
              <Route
                path="/professor/visao-geral"
                element={
                  <ProfessorRoute>
                    <VisaoGeralPage />
                  </ProfessorRoute>
                }
              />
              <Route
                path="/professor/frequencia"
                element={
                  <ProfessorRoute>
                    <FrequenciaPage />
                  </ProfessorRoute>
                }
              />
              <Route
                path="/professor/avaliacoes"
                element={
                  <ProfessorRoute>
                    <AvaliacoesPage />
                  </ProfessorRoute>
                }
              />
              <Route
                path="/professor/aprendizagem"
                element={
                  <ProfessorRoute>
                    <AprendizagemPage />
                  </ProfessorRoute>
                }
              />
              <Route
                path="/professor/desempenho"
                element={
                  <ProfessorRoute>
                    <DesempenhoPage />
                  </ProfessorRoute>
                }
              />
              <Route
                path="/professor/relatorios"
                element={
                  <ProfessorRoute>
                    <RelatoriosPage />
                  </ProfessorRoute>
                }
              />

              <Route
                path="/aluno"
                element={
                  <ProtectedRoute allowedRoles={['Aluno']}>
                    <PainelAlunoPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AcademicProvider>
    </AuthProvider>
  )
}
