import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { LoadingState } from '../ui/StateViews.jsx'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, isBootstrapping, cargo } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="loading-screen" role="status" aria-label="Verificando sessão">
        <LoadingState label="Validando sessão..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(cargo)) {
    const fallback = cargo === 'Aluno' ? '/aluno' : '/professor/cursos'
    return <Navigate to={fallback} replace />
  }

  return children
}
