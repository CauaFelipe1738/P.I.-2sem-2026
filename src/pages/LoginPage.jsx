import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getApiMode } from '../services/apiClient.js'

export default function LoginPage() {
  const { isAuthenticated, cargo, login, sessionNotice, clearNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const apiMode = getApiMode()

  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false)
  const [lembrarEmail, setLembrarEmail] = useState(() => {
    try {
      return Boolean(localStorage.getItem('edulytics.email-salvo'))
    } catch {
      return false
    }
  })
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('edulytics.email-salvo') || ''
    } catch {
      return ''
    }
  })
  const [senha, setSenha] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [erroLogin, setErroLogin] = useState('')
  const [avisoRecuperacao, setAvisoRecuperacao] = useState('')

  if (isAuthenticated) {
    const destino = cargo === 'Aluno' ? '/aluno' : '/professor/cursos'
    return <Navigate to={destino} replace />
  }

  const params = new URLSearchParams(location.search)
  const sessaoExpirada = params.get('expired') === '1'

  async function handleSubmit(event) {
    event.preventDefault()
    setErroLogin('')
    clearNotice()
    setSubmitting(true)

    try {
      if (lembrarEmail) {
        localStorage.setItem('edulytics.email-salvo', email)
      } else {
        localStorage.removeItem('edulytics.email-salvo')
      }
    } catch {
      // Ignora storage bloqueado
    }

    try {
      const usuario = await login({ email, senha })
      const destino = usuario?.cargo === 'Aluno' ? '/aluno' : '/professor/cursos'
      navigate(destino, { replace: true })
    } catch (error) {
      setErroLogin(error?.detail || error?.message || 'Não foi possível autenticar.')
    } finally {
      setSubmitting(false)
    }
  }

  function preencherDemo(demoEmail) {
    setEmail(demoEmail)
    setSenha('123456')
    setErroLogin('')
  }

  function handleRecoverySubmit(event) {
    event.preventDefault()
    setAvisoRecuperacao(
      'Solicitação registrada. Caso sua instituição não utilize envio automático, procure a secretaria acadêmica para redefinição da senha.',
    )
  }

  if (mostrarRecuperacao) {
    return (
      <main className="login-background flex min-h-dvh items-center justify-center px-4 py-8 text-[#10233f]">
        <section className="w-full max-w-[475px] rounded-[20px] border border-[#d3e1f1] bg-white px-6 py-7 shadow-[0_22px_60px_rgba(31,54,82,0.11)] sm:px-[53px] sm:py-9">
          <Brand />
          <header className="mb-8 text-center">
            <p className="mb-2 text-sm font-bold text-[#1767d2]">Recuperação de acesso</p>
            <h1 className="text-[30px] font-bold leading-tight text-[#10233f]">Esqueceu a senha?</h1>
            <p className="mt-2 text-[15px] leading-5 text-[#71819a]">
              Informe seu e-mail institucional para receber instruções de recuperação.
            </p>
          </header>

          <form onSubmit={handleRecoverySubmit} className="space-y-5">
            <div>
              <label htmlFor="email-recuperacao" className="mb-1 block text-sm font-bold text-[#18304e]">
                E-mail institucional
              </label>
              <input
                id="email-recuperacao"
                name="email-recuperacao"
                type="email"
                autoComplete="email"
                required
                placeholder="voce@escola.edu.br"
                className="h-12 w-full rounded-lg border border-[#d2deeb] bg-white px-4 text-[15px] text-[#17304f] outline-none transition placeholder:text-[#9aa9bd] focus:border-[#3980e6] focus:ring-3 focus:ring-[#3980e6]/15"
              />
            </div>

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-[#2875dc] text-[15px] font-bold text-white transition hover:bg-[#1e65c2]"
            >
              Enviar instruções
            </button>

            {avisoRecuperacao && (
              <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                {avisoRecuperacao}
              </p>
            )}
          </form>

          <button
            type="button"
            onClick={() => setMostrarRecuperacao(false)}
            className="mx-auto mt-6 flex items-center gap-2 text-sm font-semibold text-[#1767d2] hover:underline"
          >
            <span aria-hidden="true">←</span> Voltar ao login
          </button>
          <Footer />
        </section>
      </main>
    )
  }

  return (
    <main className="login-background flex min-h-dvh items-center justify-center px-4 py-4 text-[#10233f]">
      <section className="w-full max-w-[475px] rounded-[20px] border border-[#d3e1f1] bg-white px-6 py-6 shadow-[0_22px_60px_rgba(31,54,82,0.11)] sm:px-[53px] sm:py-7">
        <Brand />

        <header className="mb-7 text-center">
          <p className="mb-2 text-sm font-bold text-[#1767d2]">Acesso ao painel</p>
          <h1 className="text-[32px] font-bold leading-tight text-[#10233f]">Boas-vindas</h1>
          <p className="mt-2 text-[15px] leading-5 text-[#71819a]">
            Entre com suas credenciais institucionais para continuar.
          </p>
        </header>

        {(sessionNotice || sessaoExpirada) && (
          <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {sessionNotice || 'Sua sessão expirou. Entre novamente.'}
          </p>
        )}

        {erroLogin && (
          <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
            {erroLogin}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-bold text-[#18304e]">
              E-mail institucional
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@escola.edu.br"
              className="h-11 w-full rounded-lg border border-[#d2deeb] bg-white px-4 text-[15px] text-[#17304f] outline-none transition placeholder:text-[#9aa9bd] focus:border-[#3980e6] focus:ring-3 focus:ring-[#3980e6]/15"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-bold text-[#18304e]">
              Senha
            </label>
            <div className="relative">
              <input
                id="senha"
                name="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="h-[52px] w-full rounded-lg border border-[#d2deeb] bg-white px-4 pr-12 text-[15px] text-[#17304f] outline-none transition placeholder:text-[#9aa9bd] focus:border-[#3980e6] focus:ring-3 focus:ring-[#3980e6]/15"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((atual) => !atual)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8191a7] hover:text-[#286fd1]"
              >
                {mostrarSenha ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-[#203753]">
              <input
                type="checkbox"
                checked={lembrarEmail}
                onChange={(event) => setLembrarEmail(event.target.checked)}
                className="size-[17px] rounded border-[#aab8c8] accent-[#2876df]"
              />
              Lembrar meu e-mail
            </label>
            <button
              type="button"
              onClick={() => setMostrarRecuperacao(true)}
              className="text-[13px] font-medium text-[#1767d2] hover:underline"
            >
              Esqueceu a senha?
            </button>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-[#2875dc] text-[15px] font-bold text-white transition hover:bg-[#1e65c2] disabled:opacity-60"
            >
              {submitting ? 'Autenticando...' : 'Entrar no painel'}
            </button>
          </div>
        </form>

        {apiMode === 'mock' && (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-slate-700">
            <p className="font-semibold text-[#1767d2]">
              Ambiente integrado em modo Mock /api/v1 (seed AWS):
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => preencherDemo('ana@exemplo.com')}
                className="rounded-md border border-blue-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-blue-50"
              >
                Professor (ana@exemplo.com)
              </button>
              <button
                type="button"
                onClick={() => preencherDemo('carla@exemplo.com')}
                className="rounded-md border border-blue-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-blue-50"
              >
                Aluno (carla@exemplo.com)
              </button>
            </div>
          </div>
        )}

        <Footer />
      </section>
    </main>
  )
}

function Brand() {
  return (
    <div className="mb-8 flex items-center justify-center gap-3.5">
      <div className="flex size-[53px] items-center justify-center rounded-2xl bg-[#e0edff] text-[#2474df]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
          <path d="m2.8 9.3 9.2-5 9.2 5-9.2 5-9.2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path
            d="M6.5 11.5v4.2c3.4 2.8 7.6 2.8 11 0v-4.2M21.2 9.5v5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-[19px] font-bold leading-6 tracking-[0.02em] text-[#0c1b31]">EDULYTICS</p>
        <p className="mt-0.5 text-sm text-[#71819a]">Painel escolar</p>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-3 text-[13px] text-[#8998aa]">
      <span>SENAI Gaspar Ricardo Júnior</span>
      <span aria-hidden="true">·</span>
      <span>Ambiente educacional</span>
    </footer>
  )
}
