
export default function Login({ onLogin }) {
  function handleSubmit(event) {
    event.preventDefault()
    onLogin?.()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg bg-white p-8 shadow"
      >
        <h1 className="text-2xl font-bold">Entrar</h1>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="senha" className="mb-1 block text-sm font-medium">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
        >
          Fazer login
        </button>
      </form>
    </main>
  )
}
