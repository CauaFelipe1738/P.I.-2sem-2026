import { useState } from 'react'

export default function Login({ onLogin }) {
  const [mostrarSenha, setMostrarSenha] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    onLogin?.()
  }

  return (
    <main className="login-background flex min-h-dvh items-center justify-center px-4 py-3 text-[#10233f]">
      <section className="w-full max-w-[475px] rounded-[20px] border border-[#d3e1f1] bg-white px-6 py-5 shadow-[0_22px_60px_rgba(31,54,82,0.11)] sm:px-[53px] sm:py-6">
        <div className="mb-10 flex items-center justify-center gap-3.5">
          <div className="flex size-[53px] items-center justify-center rounded-2xl bg-[#e0edff] text-[#2474df]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
              <path d="m2.8 9.3 9.2-5 9.2 5-9.2 5-9.2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M6.5 11.5v4.2c3.4 2.8 7.6 2.8 11 0v-4.2M21.2 9.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[19px] font-bold leading-6 tracking-[0.02em] text-[#0c1b31]">EDULYTICS</p>
            <p className="mt-0.5 text-sm text-[#71819a]">Painel escolar</p>
          </div>
        </div>

        <header className="mb-9 text-center">
          <p className="mb-2 text-sm font-bold text-[#1767d2]">Acesso ao painel</p>
          <h1 className="text-[32px] font-bold leading-tight text-[#10233f]">Boas-vindas</h1>
          <p className="mt-2 text-[15px] leading-5 text-[#71819a]">Entre para acompanhar os registros da sua escola.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-bold text-[#18304e]">E-mail institucional</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="voce@escola.edu.br" className="h-11 w-full rounded-lg border border-[#d2deeb] bg-white px-4 text-[15px] text-[#17304f] outline-none transition placeholder:text-[#9aa9bd] focus:border-[#3980e6] focus:ring-3 focus:ring-[#3980e6]/15" />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-bold text-[#18304e]">Senha</label>
            <div className="relative">
              <input id="senha" name="senha" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" placeholder="Mínimo de 6 caracteres" className="h-[57px] w-full rounded-lg border border-[#d2deeb] bg-white px-4 pr-12 text-[15px] text-[#17304f] outline-none transition placeholder:text-[#9aa9bd] focus:border-[#3980e6] focus:ring-3 focus:ring-[#3980e6]/15" />
              <button type="button" onClick={() => setMostrarSenha((atual) => !atual)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8191a7] hover:text-[#286fd1]">
                {mostrarSenha ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.8 5 9.5 6-.3.5-1.4 2-3.1 3.4M6.2 6.2C3.9 7.7 2.7 9.6 2.5 10c.7 1 4.3 6 9.5 6 1 0 1.9-.2 2.7-.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-[-2px] text-sm">
            <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-[#203753]">
              <input type="checkbox" className="size-[17px] rounded border-[#aab8c8] accent-[#2876df]" />
              Lembrar meu e-mail
            </label>
            <button type="button" className="text-[13px] font-medium text-[#1767d2] hover:underline">Esqueceu a senha?</button>
          </div>

          <div className="pt-8">
            <button type="submit" className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-[#2875dc] text-[15px] font-bold text-white transition hover:bg-[#1e65c2] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#70a6ef]">
              Entrar no painel
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5"><path d="M4.5 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </form>

        <footer className="mt-9 flex flex-wrap items-center justify-center gap-x-3 text-[13px] text-[#8998aa]">
          <span>Escola Central</span><span aria-hidden="true">·</span><span>Ambiente demonstrativo</span>
        </footer>
      </section>
    </main>
  )
}             
