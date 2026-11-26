import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getStoredToken, setStoredToken } from '../services/apiClient.js'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getStoredToken()))
  const [sessionNotice, setSessionNotice] = useState('')

  const clearSession = useCallback((notice = '') => {
    setStoredToken(null)
    setUsuario(null)
    if (notice) setSessionNotice(notice)
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return undefined

    const controller = new AbortController()
    authService
      .getMe(controller.signal)
      .then((me) => {
        setUsuario(me)
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          clearSession()
        }
      })
      .finally(() => {
        setIsBootstrapping(false)
      })

    return () => controller.abort()
  }, [clearSession])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession('Sua sessão expirou. Entre novamente.')
    }
    window.addEventListener('edulytics:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('edulytics:unauthorized', handleUnauthorized)
  }, [clearSession])

  const login = useCallback(async ({ email, senha }) => {
    setSessionNotice('')
    const data = await authService.login({ email, senha })
    setUsuario(data.usuario)
    return data.usuario
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUsuario(null)
    setSessionNotice('')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargo: usuario?.cargo || null,
        isAuthenticated: Boolean(usuario),
        isBootstrapping,
        sessionNotice,
        clearNotice: () => setSessionNotice(''),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.')
  return ctx
}
