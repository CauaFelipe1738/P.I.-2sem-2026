import { useState } from 'react'
import Login from './components/Login.jsx'
import Alunos from './components/alunos.jsx'
import Aprendizagem from './components/aprendizagem.jsx'
import Configuracoes from './components/configuracoes.jsx'
import Desempenho from './components/desempenho.jsx'
import Frequencia from './components/frequencia.jsx'
import Registro from './components/registro.jsx'
import Relatorio from './components/relatorio.jsx'

const paginas = [
  { id: 'alunos', nome: 'Alunos', Componente: Alunos },
  { id: 'frequencia', nome: 'Frequência', Componente: Frequencia },
  { id: 'desempenho', nome: 'Desempenho', Componente: Desempenho },
  { id: 'aprendizagem', nome: 'Aprendizagem', Componente: Aprendizagem },
  { id: 'registro', nome: 'Registro', Componente: Registro },
  { id: 'relatorio', nome: 'Relatório', Componente: Relatorio },
  { id: 'configuracoes', nome: 'Configurações', Componente: Configuracoes },
]

function App() {
  const [paginaAtual, setPaginaAtual] = useState('login')
  const PaginaAtual = paginas.find((pagina) => pagina.id === paginaAtual)?.Componente

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {paginaAtual === 'login' ? (
        <Login onLogin={() => setPaginaAtual('alunos')} />
      ) : (
        <>
          <header className="border-b border-slate-200 bg-white">
            <nav
              aria-label="Navegação principal"
              className="mx-auto flex max-w-6xl flex-wrap gap-2 p-4"
            >
              {paginas.map(({ id, nome }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaginaAtual(id)}
                  aria-current={paginaAtual === id ? 'page' : undefined}
                  className={`rounded px-3 py-2 text-sm font-medium ${
                    paginaAtual === id
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {nome}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPaginaAtual('login')}
                className="ml-auto rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sair
              </button>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl p-4 sm:p-6">
            {PaginaAtual && <PaginaAtual />}
          </main>
        </>
      )}
    </div>
  )
}

export default App
