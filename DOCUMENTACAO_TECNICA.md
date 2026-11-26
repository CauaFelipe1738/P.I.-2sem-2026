# Documentação Técnica — EDULYTICS

## 1. Visão Geral

**EDULYTICS** é uma aplicação web SPA construída com **React 19**, **Vite 8**, **Tailwind CSS 4** e **React Router DOM** para monitoramento integral do desempenho acadêmico de estudantes. A arquitetura separa claramente camada de apresentação (`pages/`, `components/`), estado compartilhado (`contexts/`), hooks de dados (`hooks/`), camada de integração REST `/api/v1` (`services/`) e regras puras de cálculo e formatação (`utils/`).

---

## 2. Organização dos Módulos

```text
.
├── .env.example                          # Variáveis VITE_API_URL e VITE_API_MODE
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx                          # Montagem React (StrictMode)
│   ├── App.jsx                           # BrowserRouter, Providers e rotas protegidas
│   ├── App.css / index.css               # Estilos globais e animações do shell
│   ├── utils/
│   │   ├── checklists.js                 # Domínios canônicos (status, tipos, corte 75%)
│   │   └── academicMetrics.js            # Cálculos puros (frequência, média ponderada, CSV)
│   ├── services/
│   │   ├── apiClient.js                  # Cliente HTTP fetch + Bearer JWT + timeout 408 + RFC 7807 + mock
│   │   ├── healthService.js              # Consulta de saúde /actuator/health e latência da API
│   │   ├── mockApiServer.js              # Simulador fiel ao contrato /api/v1 e seed PostgreSQL
│   │   ├── authService.js                # /auth/login, /auth/me, /auth/logout
│   │   ├── academicoService.js           # /cursos, /periodos, /turmas, /disciplinas, /alunos
│   │   ├── aulasService.js               # /aulas e /frequencias
│   │   ├── avaliacoesService.js          # /avaliacoes e /notas
│   │   ├── comentariosService.js         # /comentarios e /planos-acompanhamento
│   │   └── indicadoresService.js         # /indicadores/desempenho, /relatorios/academico, /me/desempenho
│   ├── contexts/
│   │   ├── AuthContext.jsx               # Sessão JWT, restauração /auth/me e evento 401
│   │   └── AcademicContext.jsx           # Contexto acadêmico ativo (curso, turma, disciplina, período)
│   ├── hooks/
│   │   └── useApiQuery.js                # Hook com AbortController, loading, error e refetch
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx              # Menu lateral, header, badge HTTP/Mock, contexto e logout
│   │   │   └── ProtectedRoute.jsx        # Guarda de autenticação e autorização por cargo
│   │   └── ui/
│   │       ├── MetricCard.jsx
│   │       ├── Pagination.jsx
│   │       └── StateViews.jsx            # LoadingState, ErrorBanner, EmptyState, StatusBadge
│   └── pages/
│       ├── LoginPage.jsx                 # /login
│       ├── CursosProfessorPage.jsx       # /professor/cursos
│       ├── VisaoGeralPage.jsx            # /professor/visao-geral
│       ├── FrequenciaPage.jsx            # /professor/frequencia
│       ├── AvaliacoesPage.jsx            # /professor/avaliacoes
│       ├── AprendizagemPage.jsx          # /professor/aprendizagem
│       ├── DesempenhoPage.jsx            # /professor/desempenho
│       ├── RelatoriosPage.jsx            # /professor/relatorios
│       └── PainelAlunoPage.jsx           # /aluno
├── scripts/
│   └── mock-http-server.mjs              # Servidor HTTP local /api/v1 + /actuator/health + CORS
└── tests/
    ├── academicMetrics.test.js           # Testes unitários de métricas e CSV
    ├── apiClient.test.js                 # Testes unitários do cliente HTTP e ProblemDetail
    ├── servicesIntegration.test.js       # Testes de integração do contrato /api/v1 e RBAC/LGPD
    ├── httpContractIntegration.test.js   # Testes HTTP reais sobre TCP/fetch + CORS + 408/409/422
    └── devops.test.js                    # Quality gates DevOps (segredos, CI, Docker, smoke E2E)
```

---

## 3. Camada de Integração (`/api/v1`) e Decisões Técnicas

### 3.1 Transporte Dual (`http` e `mock`)
- **`src/services/apiClient.js`** centraliza todas as chamadas REST sob o prefixo `/api/v1`:
  - Quando `VITE_API_URL` está configurada (e `VITE_API_MODE` não é `mock`), utiliza `fetch` nativo enviando `Authorization: Bearer <token>` e suportando cancelamento via `AbortController`.
  - Quando `VITE_API_URL` não está informada ou `VITE_API_MODE=mock`, delega exatamente o mesmo contrato (`method`, `path`, `query`, `body`, `token`) para `mockApiServer.js`, populado com os registros equivalentes ao dump `monitoramento_academico.sql`.
- **Tratamento padronizado de erros (RFC 7807)**: respostas de erro são convertidas em `ApiError` contendo `status`, `title`, `detail` e `errors`. Respostas `401` disparam `edulytics:unauthorized` para encerrar a sessão e redirecionar ao login com `?expired=1`.

### 3.2 Gerenciamento de Estado
- **Estado Global de Autenticação (`AuthContext`)**: persiste o token apenas em `sessionStorage` (`edulytics.access-token`), valida a sessão em `GET /api/v1/auth/me` ao recarregar a página e bloqueia acesso cruzado via `ProtectedRoute`.
- **Estado Global de Contexto Acadêmico (`AcademicContext`)**: mantém `cursoId`, `turmaId`, `disciplinaTurmaId` e `periodoId` sincronizados ao navegar entre as páginas do painel docente.
- **Estado de Servidor (`useApiQuery`)**: executa buscas assíncronas com cancelamento automático ao desmontar/trocar filtros.
- **Estado Local (`useState`)**: controla rascunhos de formulários, filtros de tela e edições pontuais.

### 3.3 Regras de Negócio e LGPD Aplicadas
- **Frequência e Corte Oficial**: `PRESENTE` e `ATRASO` contabilizam comparecimento; `AUSENTE` e `FALTA_JUSTIFICADA` contabilizam ausência nos indicadores, com limite oficial de **75%**.
- **Notas**: validadas no intervalo `0 <= nota <= valorTotal` e consolidadas por média ponderada normalizada na escala `0–10`.
- **Privacidade (LGPD)**: `comentario.visivelAluno` inicia como `false` por padrão; consultas do perfil `Aluno` (`/api/v1/me/desempenho` e `/api/v1/comentarios`) exibem apenas registros explicitamente marcados com `visivelAluno = true`, impedindo exposição de anotações internas ou de saúde.

---

## 4. Testes e Validação Executados

Os testes automatizados utilizam o runner nativo do Node.js (`node --test tests/*.test.js`), complementados por verificação estática (`eslint`) e empacotamento de produção (`vite build`):

| Verificação | Comando | Escopo Coberto | Resultado Observado |
|---|---|---|---|
| **Testes unitários e integração** | `npm test` | `academicMetrics.test.js`, `apiClient.test.js`, `servicesIntegration.test.js`, `httpContractIntegration.test.js`, `devops.test.js` e `realBackendE2E.test.js` (executado contra Spring Boot real no workflow `fullstack-e2e.yml`). | **22/22 locais aprovados** + **E2E Real verde em CI** |
| **Observabilidade e Auditoria** | `GET /actuator/metrics`, `GET /api/v1/auditoria` | `RequestLoggingFilter` (SLF4J estruturado sem vazar credenciais) e trilha de auditoria LGPD paginada para docentes. | **Validado via MockMvc e E2E** |
| **Análise estática (Lint)** | `npm run lint` | Regras ESLint (`recommended`, `react-hooks`, `react-refresh`) em todos os arquivos `.js`/`.jsx`. | **0 erros e 0 warnings** |
| **Build de produção** | `npm run build` | Transformação e empacotamento Vite + Tailwind CSS 4 de todos os módulos e chunks lazy. | **61 módulos compilados com sucesso** |
