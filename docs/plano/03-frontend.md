# 03 — Arquitetura de Frontend (React + Vite)

> Este documento planeja a evolução do frontend atual (`src/`) de protótipo em `localStorage` para aplicação integrada aos endpoints de [02-backend.md](./02-backend.md), atendendo às issues `#13`, `#20`, `#24`, `#25`, `#26`, `#46` e `#57`.

---

## 1. Princípio de Evolução e Mudança de Roteamento

- **Reaproveitamento visual**: manter o Design System construído com **Tailwind CSS 4**, tipografia, paleta azul/ardósia (`#2875df`, `#10213a`, `#f7f9fc`) e componentes de formulário já existentes em `src/components/`.
- **Mudança de padrão `[PROPOSTA]` — Adoção do `react-router-dom` (Issue `#25`)**:
  - *Substitui*: controle manual por estado `paginaAtual` + `window.history.pushState` em `src/App.jsx`.
  - *Justificativa*: preserva a rota ao recarregar a página (F5 — o S3 já está configurado com `index.html` como Error Document em `docs/frontend-s3.md`), habilita `ProtectedRoute` por cargo (`Professor` / `Aluno`) e permite parâmetros de URL (`/professor/turmas/:turmaId/...`).
- **Remoções e ajustes de fluxo da v1**:
  - Remover `src/components/coodernador.jsx` e a opção Coordenação da UI (conforme issue `#67` e banco real).
  - Remover a tela intermediária manual *"Como deseja continuar?"* (`src/App.jsx` linhas 134–165); após o login, redirecionar automaticamente conforme `usuario.cargo` retornado por `POST /api/v1/auth/login` ou `GET /api/v1/auth/me` `[PROPOSTA]`.

---

## 2. Lista de Telas e Rotas

| Rota | Página (`src/pages/`) | Perfil | Objetivo | Dados Exibidos | Origem |
|---|---|---|---|---|---|
| `/login` | `LoginPage` | Público | Autenticar usuário na API e restaurar sessão | E-mail salvo (`localStorage`), erro de credencial e aviso em recuperação de senha | Evolui `Login.jsx` |
| `/professor/cursos` | `CursosProfessorPage` | Professor | Selecionar curso/turma/disciplina e consultar alunos | Cursos paginados, busca/filtro, turmas do curso e lista lateral de alunos da turma selecionada | Evolui `professor.jsx` |
| `/professor/visao-geral` | `VisaoGeralPage` | Professor | Painel resumo do contexto selecionado | Seletor Curso → Turma → Disciplina, KPIs reais da oferta e comentários recentes | Evolui bloco `visao` de `App.jsx` |
| `/professor/frequencia` | `FrequenciaPage` | Professor | Criar/editar aulas e lançar chamada | KPIs de presença (corte 75%), formulário de aula, lista de alunos matriculados na turma com 4 status (`Presente`, `Ausente`, `Falta justificada`, `Atraso`), `checklistAula` e histórico | Evolui `frequencia.jsx` `[CONFIRMADO]` |
| `/professor/avaliacoes` | `AvaliacoesPage` | Professor | Gerenciar avaliações e lançar notas | Lista de avaliações da `disciplinaTurma`, formulário criar/editar/corrigir e grade de notas por aluno | **`[PROPOSTA]`** (cobre `#89`–`#93`) |
| `/professor/aprendizagem` | `AprendizagemPage` | Professor | Registrar comentários pedagógicos e planos | Filtros, resumo por categoria/tipo, formulário de comentário (`COMENTARIO` + flag `visivelAluno`) e `plano_acompanhamento` | Evolui `aprendizagem.jsx` `[CONFIRMADO]` |
| `/professor/desempenho` | `DesempenhoPage` | Professor | Analisar indicadores e alertas de risco | KPIs do backend (frequência média, % < 75%, média notas), gráficos por aula/categoria e lista de atenção | Evolui `desempenho.jsx` |
| `/professor/relatorios` | `RelatoriosPage` | Professor | Visualizar prévia consolidada e exportar | Resumo por turma/aluno, listagens combinadas, botão **Exportar CSV** (`;` + BOM) e **Imprimir/PDF** | Evolui `relatorio.jsx` **`[CONFIRMADO na v1]`** |
| `/aluno` | `PainelAlunoPage` | Aluno | Consultar próprio percurso acadêmico | Turmas matriculadas, taxa de presença, faltas, notas em avaliações e comentários com `visivelAluno=true` | Evolui `alunos.jsx` `[CONFIRMADO]` |

---

## 3. Fluxos Principais do Usuário

1. **Login e Restauração de Sessão**: usuário envia `email` + `senha` em `/login` → `AuthContext` chama `POST /api/v1/auth/login`, armazena `accessToken` JWT em memória + `sessionStorage` → redireciona `Professor` para `/professor/cursos` e `Aluno` para `/aluno`. Ao abrir a aplicação com token salvo, `AuthContext` valida via `GET /api/v1/auth/me`.
2. **Seleção de Contexto e Registro de Chamada**: em `/professor/cursos` (ou no seletor superior do `AppShell`), professor escolhe Curso → Turma → Disciplina (`disciplinaTurmaId`, salvo em `AcademicContext`) → navega para `/professor/frequencia` → cria a aula (`POST /aulas`), marca presença/`Atraso`/falta + checklist dos alunos matriculados na turma e salva (`POST /aulas/{id}/frequencias`), ou edita um lançamento anterior (`PUT /frequencias/{id}`).
3. **Avaliações e Notas**: em `/professor/avaliacoes`, professor cria avaliação (`POST /avaliacoes`), abre a grade de notas da turma, digita notas respeitando `0 <= nota <= valorTotal` (`PUT /avaliacoes/{id}/notas/{alunoId}`) e finaliza clicando em *Marcar como corrigida* (`PATCH /avaliacoes/{id}/corrigir`).
4. **Acompanhamento Pedagógico**: em `/professor/aprendizagem`, professor seleciona aluno da turma, preenche categoria/tipo, classificação, checklist, opção `visivelAluno` (padrão `false`) e descrição (`POST /comentarios`), além de cadastrar/atualizar planos em `/api/v1/planos-acompanhamento`.
5. **Indicadores, Relatório e Visão do Aluno**: professor acessa `/professor/desempenho` para identificar alunos em atenção (`< 75%` ou dificuldade registrada) e exporta CSV/PDF em `/professor/relatorios`; o estudante autenticado acessa `/aluno` e visualiza apenas os próprios indicadores e comentários marcados com `visivelAluno=true` via `GET /api/v1/me/desempenho`.

---

## 4. Estrutura de Pastas, Componentes e Estado

### 4.1 Organização Proposta em `src/` (Issue `#24`)
```text
src/
├── main.jsx
├── App.jsx                      # RouterProvider + AuthProvider + AcademicProvider
├── services/                    # [PROPOSTA] Camada HTTP (VITE_API_URL em HTTPS alinhado com EC2 [CONFIRMADO])
│   ├── apiClient.js             # fetch wrapper, VITE_API_URL (HTTPS), Bearer token, parse ProblemDetail
│   ├── authService.js
│   ├── academicoService.js      # cursos, turmas, disciplinas, alunos, periodos
│   ├── aulasService.js
│   ├── avaliacoesService.js
│   ├── comentariosService.js
│   └── indicadoresService.js
├── contexts/                    # [PROPOSTA] Estado global
│   ├── AuthContext.jsx
│   └── AcademicContext.jsx      # cursoId, turmaId, disciplinaTurmaId ativos
├── hooks/                       # [PROPOSTA] useApiQuery (com AbortController) / useMutation
├── components/
│   ├── layout/AppShell.jsx      # Extrai header e menu lateral de App.jsx (Issue #26)
│   ├── layout/ProtectedRoute.jsx
│   └── ui/                      # MetricCard, LoadingSpinner, ErrorBanner, EmptyState, Pagination
├── pages/                       # Telas listadas na Seção 2
└── data/
    └── checklists.js            # Apenas constantes de UI (substitui dadosAcademicos.js e academicoStore.js)
```

### 4.2 Distribuição de Estado
- **Estado Local (`useState`)**: campos em digitação nos formulários, estado de modal aberto, item atualmente em edição (`editingId`), ordenação/busca de tabela.
- **Estado Global (`React Context`)**:
  - `AuthContext`: `usuario`, `accessToken`, `cargo`, `isAuthenticated`, `isBootstrapping`, `login()`, `logout()`.
  - `AcademicContext` `[PROPOSTA]`: `cursoId`, `turmaId`, `disciplinaTurmaId`, `periodoId` — evita que o professor precise reselecionar curso/turma/disciplina ao alternar entre Frequência, Avaliações, Aprendizagem e Desempenho.
- **Estado do Servidor**: gerenciado por custom hooks (`useApiQuery` com `AbortController` + função `refetch`) para evitar adicionar dependências pesadas, ou **TanStack Query** `[PROPOSTA]` caso a equipe opte por cache automático e invalidação declarativa após `POST`/`PUT`/`PATCH`.
- **Descomissionamento**: remover `src/data/dadosAcademicos.js` e `src/data/academicoStore.js` (migrando apenas `checklistAprendizagem` e `checklistAula` para `src/data/checklists.js` se aprovados).

---

## 5. Consumo dos Endpoints por Tela

| Tela | Endpoints Consumidos ([02-backend.md](./02-backend.md)) |
|---|---|
| `LoginPage` | `POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| `AppShell` (Header/Menu) | `POST /api/v1/auth/logout`, `GET /api/v1/cursos`, `GET /api/v1/cursos/{id}/turmas`, `GET /api/v1/turmas/{id}/disciplinas` |
| `CursosProfessorPage` | `GET /api/v1/cursos`, `GET /api/v1/cursos/{id}/turmas`, `GET /api/v1/alunos` |
| `VisaoGeralPage` | `GET /api/v1/indicadores/desempenho`, `GET /api/v1/comentarios` |
| `FrequenciaPage` | `GET /api/v1/turmas/{id}/alunos`, `GET /api/v1/aulas`, `POST /api/v1/aulas`, `PUT/PATCH /api/v1/aulas/{id}`, `GET/POST /api/v1/aulas/{id}/frequencias`, `PUT /api/v1/frequencias/{id}` |
| `AvaliacoesPage` `[PROPOSTA]` | `GET /api/v1/periodos`, `GET/POST /api/v1/avaliacoes`, `PUT/PATCH /api/v1/avaliacoes/{id}`, `GET /api/v1/avaliacoes/{id}/notas`, `PUT /api/v1/avaliacoes/{id}/notas/{alunoId}` |
| `AprendizagemPage` | `GET /api/v1/turmas/{id}/alunos`, `GET/POST/PUT /api/v1/comentarios`, `GET/POST/PUT /api/v1/planos-acompanhamento` `[PROPOSTA]` |
| `DesempenhoPage` | `GET /api/v1/indicadores/desempenho`, `GET /api/v1/aulas`, `GET /api/v1/comentarios` |
| `RelatoriosPage` | `GET /api/v1/relatorios/academico` (exportação CSV gerada no cliente com dados retornados) |
| `PainelAlunoPage` | `GET /api/v1/me/desempenho` |

---

## 6. Estados de Carregamento, Erro e Vazio

- **Carregamento (Loading)**:
  - Verificação inicial do token (`/auth/me`) exibe `loading-spinner` centralizado (`App.jsx`).
  - Consultas em páginas exibem skeletons ou spinner discreto dentro da área de cards/tabelas.
  - Botões de envio (`Salvar frequência`, `Salvar nota`, `Entrar`) ficam `disabled` com texto `"Salvando..."` durante a requisição para evitar submissões duplicadas.
- **Erro**:
  - `401 Unauthorized`: `apiClient` limpa sessão no `AuthContext` e redireciona para `/login` com alerta `"Sua sessão expirou. Entre novamente."`.
  - `403 Forbidden`: exibe banner de permissão insuficiente sem quebrar a navegação.
  - `400 / 422`: extrai `ProblemDetail.errors` e exibe a mensagem específica abaixo de cada campo correspondente no formulário.
  - `404 / 500` ou falha de rede: exibe componente `ErrorBanner` (`role="alert"`) com mensagem amigável e botão **"Tentar novamente"**.
- **Vazio (Empty State)**:
  - Quando não houver aulas, avaliações, comentários ou alunos em alerta nos filtros selecionados, exibir `EmptyState` com orientação clara e botão de ação (ex.: *"Nenhuma avaliação cadastrada para esta disciplina — Criar primeira avaliação"*).
  - Indicadores sem base numérica exibem **`—`** em vez de `0%` (mantendo o padrão já adotado em `desempenho.jsx` e `frequencia.jsx`).

---

## 7. Estratégia de Testes (Issues `#46`, `#57`)

1. **Testes Unitários e de Componentes (`Vitest` + `React Testing Library` + `MSW` `[PROPOSTA]`, issue `#46`)**:
   - `apiClient.test.js`: parsing de `ProblemDetail`, envio de header `Bearer`, logout automático em `401`.
   - `LoginPage.test.jsx`: validação de campos, feedback de erro `401`, redirecionamento por cargo.
   - `FrequenciaPage.test.jsx`: impede salvar chamada sem aluno marcado, envia lote correto para `POST /aulas/{id}/frequencias`, exibe estado vazio e erro.
   - `AvaliacoesPage.test.jsx`: validação `nota <= valorTotal` no cliente e exibição de erro `422` da API.
   - `DesempenhoPage.test.jsx` e `RelatoriosPage.test.jsx`: renderização de KPIs, `—` quando sem registros e geração de CSV com BOM/ponto e vírgula.
2. **Testes End-to-End (`Playwright` `[PROPOSTA]`, issue `#57`)**:
   - Fluxo 1: Login como Professor → Selecionar Curso/Turma/Disciplina → Criar Aula → Registrar Chamada → Recarregar página e confirmar persistência.
   - Fluxo 2: Criar Avaliação → Lançar Nota → Verificar atualização da média em Desempenho.
   - Fluxo 3: Login como Aluno → Validar exibição dos próprios dados e bloqueio de rotas `/professor/*`.
3. **Gate de CI (Issue `#45`)**: executar `npm run lint`, `npm test` e `npm run build` em todo Pull Request para `develop`/`main`.
