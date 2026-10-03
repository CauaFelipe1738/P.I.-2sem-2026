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
        </>
      )}
    </div>
  )
}

export default App
