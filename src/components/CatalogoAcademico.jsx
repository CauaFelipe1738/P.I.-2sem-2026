// Lista compacta usada quando se abre a página de catálogo pelo menu acadêmico.
import { cursos } from '../data/dadosAcademicos.js'

export default function CatalogoAcademico({ onAbrirVisaoGeral = () => {} }) {
  return <div><h2 className="text-xl font-bold">Cursos cadastrados</h2><p className="mb-4 mt-1 text-sm text-slate-600">Selecione um curso para abrir seu acompanhamento acadêmico.</p><div className="grid gap-3 sm:grid-cols-2">{cursos.map((curso) => <button key={curso.id} onClick={() => onAbrirVisaoGeral(curso)} className="rounded-lg border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50"><strong>{curso.nome}</strong><span className="mt-1 block text-xs text-slate-600">{curso.alunos} alunos · {curso.carga} · {curso.status}</span></button>)}</div></div>
}
