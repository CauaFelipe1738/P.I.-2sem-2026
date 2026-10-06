import { useState } from 'react'
import Login from './components/Login.jsx'

function App() {
  const [paginaAtual, setPaginaAtual] = useState('login')

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {paginaAtual === 'login' ? (
        <Login onLogin={() => setPaginaAtual('alunos')} />
      ) : (
        <></>
      )}
    </div>
  )
}

export default App
