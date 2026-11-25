import { useEffect, useState } from 'react'

const guideSteps = [
  { title: 'Comece pela visão geral', page: 'visao', body: 'Escolha curso, turma, disciplina e período. Os indicadores refletem as chamadas e observações registradas neste navegador.', action: 'Abrir visão geral' },
  { title: 'Registre a frequência', page: 'frequencia', body: 'Selecione curso, disciplina, turma e data. Marque a situação dos estudantes e use o checklist para anotar atividades da aula.', action: 'Abrir frequência' },
  { title: 'Acompanhe o desempenho', page: 'desempenho', body: 'Compare a frequência observada, consulte estudantes que precisam de acompanhamento e combine os filtros da turma.', action: 'Abrir desempenho' },
  { title: 'Registre observações', page: 'aprendizagem', body: 'Use categorias, checklists e próximos passos para manter um histórico pedagógico objetivo por estudante.', action: 'Abrir aprendizagem' },
]

const pageTips = {
  visao: ['Os filtros de período e disciplina atualizam os indicadores e a lista de alertas.', 'Os alertas usam frequência abaixo de 75% após dois registros, dificuldades recorrentes ou plano em andamento.', 'Selecione “Ver perfil” para consultar o histórico individual.'],
  frequencia: ['Escolha disciplina e turma antes de salvar a chamada.', 'A situação de cada estudante e o checklist de atividade ficam no histórico local.', 'Use os filtros laterais para localizar e corrigir registros anteriores.'],
  desempenho: ['Combine curso, turma, disciplina, estudante e mês para restringir os indicadores.', 'Os percentuais usam apenas registros encontrados no período selecionado.', 'O limite de 75% é demonstrativo e deve ser confirmado pela instituição.'],
  aprendizagem: ['Selecione uma categoria e marque apenas os itens do checklist observados.', 'O plano de acompanhamento é associado ao histórico do estudante.', 'As observações ficam neste navegador; compartilhamento institucional requer integração.'],
}

const pageNames = { visao: 'Visão geral', frequencia: 'Frequência', desempenho: 'Desempenho', aprendizagem: 'Aprendizagem' }

export default function HelpCenter({ open, mode = 'center', page = 'visao', onClose, onNavigate }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('guide')
  const [showTutorial, setShowTutorial] = useState(mode === 'tutorial')
  const tutorial = mode === 'tutorial' || showTutorial
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose?.(tutorial) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose, tutorial])
  if (!open) return null
  const step = guideSteps[stepIndex]

  function finish() { onClose?.(tutorial) }

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/35 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) finish() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="help-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#d9e1eb] bg-white p-5 shadow-2xl sm:p-6">
      <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">EDULYTICS · Ajuda</p><h2 id="help-title" className="mt-1 text-xl font-bold text-[#10213a]">{tutorial ? 'Conheça o sistema' : 'Central de ajuda'}</h2><p className="mt-1 text-sm text-slate-500">{tutorial ? 'Um guia rápido para as tarefas mais usadas.' : `Ajuda contextual · ${pageNames[page] || 'Área acadêmica'}`}</p></div><button onClick={finish} aria-label="Fechar ajuda" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-50">×</button></header>

      {tutorial ? <>
        <div className="mt-5 flex items-center gap-1.5" aria-label={`Etapa ${stepIndex + 1} de ${guideSteps.length}`}>{guideSteps.map((item, index) => <span key={item.page} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-[#2875df]' : 'bg-slate-100'}`} />)}</div>
        <article className="mt-5 rounded-xl border border-blue-100 bg-[#f5f9ff] p-5"><span className="flex size-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-blue-700 shadow-sm">{stepIndex + 1}</span><h3 className="mt-4 text-lg font-bold text-slate-800">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p><button onClick={() => onNavigate?.(step.page)} className="mt-4 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">{step.action}</button></article>
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3"><button onClick={finish} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Pular tutorial</button><div className="flex gap-2"><button disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40">Voltar</button><button onClick={() => stepIndex === guideSteps.length - 1 ? finish() : setStepIndex((current) => current + 1)} className="rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">{stepIndex === guideSteps.length - 1 ? 'Concluir' : 'Próxima etapa'}</button></div></footer>
      </> : <>
        <div className="mt-5 flex gap-2 border-b border-slate-100 pb-2"><button onClick={() => setActiveTab('guide')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'guide' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Dicas desta tela</button><button onClick={() => setActiveTab('faq')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'faq' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>Perguntas rápidas</button></div>
        {activeTab === 'guide' ? <div className="mt-3 space-y-2">{(pageTips[page] || pageTips.visao).map((tip, index) => <article key={tip} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span><p className="text-sm leading-5 text-slate-600">{tip}</p></article>)}<button onClick={() => { setStepIndex(0); setActiveTab('guide'); setShowTutorial(true); }} className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900">Iniciar tutorial guiado →</button></div> : <div className="mt-3 space-y-2">{[
          ['Onde os registros ficam salvos?', 'Frequência e aprendizagem são mantidas no armazenamento deste navegador. A sincronização entre usuários depende do backend.'],
          ['Como os alertas são calculados?', 'O painel destaca frequência abaixo de 75% após pelo menos duas chamadas, duas observações de dificuldade ou plano de acompanhamento não concluído. São critérios demonstrativos.'],
          ['Por que não vejo médias ou notas?', 'O projeto ainda não tem avaliações e notas integradas aos dados do front-end. O sistema evita calcular ou estimar esses valores.'],
        ].map(([question, answer]) => <details key={question} className="group rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-700">{question}</summary><p className="mt-2 text-sm leading-5 text-slate-600">{answer}</p></details>)}</div>}
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">Dica da tela: {pageNames[page] || 'Área acadêmica'}</span><button onClick={finish} className="rounded-lg bg-[#2875df] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Entendi</button></footer>
      </>}
    </section>
  </div>
}
