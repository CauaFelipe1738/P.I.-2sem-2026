# 02 — Arquitetura de Backend (Spring Boot)

> Este documento especifica a arquitetura, contratos REST, segurança, regras de negócio e estratégia de testes do serviço em `backend_spring/`, partindo do esqueleto existente (`AlunoController`, `AlunoService`, `AlunoRepository`, `Aluno`), das rotas propostas em `origin/feature/alunos:DOCUMENTACAO_BACKEND.md`, das issues `#52`–`#60`, `#76`–`#94` e da matriz de testes da issue `#55`.

---

## 1. Stack, Correções Prévias e Estrutura de Pastas

### 1.1 Correções obrigatórias no estado atual (`backend_spring/`)
1. **Corrigir `Aluno.java`**: atualmente definido como `@Entity public record Aluno(...)`, o que é **inválido para JPA/Hibernate** (exige classe não-final e construtor sem argumentos). Converter para `@Entity @Table(name = "aluno") public class Aluno` mapeada para as colunas de [01-modelo-dados.md](./01-modelo-dados.md#34-aluno).
2. **Alinhar `backend_spring/build.gradle`**:
   - Resolver conflito potencial entre `org.springframework.boot` `4.1.1` e `springdoc-openapi-starter-webmvc-ui:2.6.0` (recomenda-se estabilizar em **Spring Boot 3.4.x / 3.5.x LTS** `[PROPOSTA]`, ou atualizar `springdoc` para versão 3.x compatível caso mantenha Spring Boot 4.x — ver Pergunta 9 em [04-perguntas-abertas.md](./04-perguntas-abertas.md)).
   - Adicionar dependências `[PROPOSTA]`: `org.springframework.boot:spring-boot-starter-validation`, `org.springframework.boot:spring-boot-starter-actuator`, `org.postgresql:postgresql`, `org.flywaydb:flyway-core`, `org.flywaydb:flyway-database-postgresql`, e `io.jsonwebtoken:jjwt-*` (ou `spring-boot-starter-oauth2-resource-server`).
3. **Configuração por ambiente (`src/main/resources/`)**: substituir H2 fixo em `application.properties` por variáveis de ambiente (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`), mantendo `application-test.properties` isolado para testes e `spring.jpa.hibernate.ddl-auto=validate` em `dev`/`prod`.
4. **Padronizar `AlunoController`**: mover de `/alunos` para `/api/v1/alunos`, torná-lo `public` e retornar `PageResponse<AlunoResponseDTO>` em vez de `List<Aluno>`.

### 1.2 Estrutura de Pastas Proposta
Mantém o padrão **package-by-feature** definido na issue `#54` (uma pasta por domínio contendo Entity, Controller, Service, Repository), acrescido de subpacote `dto/` e dos pacotes transversais `common/` e `security/` `[PROPOSTA]`:

```text
backend_spring/src/main/
├── java/com/edulytics/backend_spring/
│   ├── BackendSpringApplication.java
│   ├── common/                          # [PROPOSTA] Transversal
│   │   ├── config/                      # OpenAPI, CorsConfig, JacksonConfig
│   │   ├── dto/                         # PageResponse<T>
│   │   └── exception/                   # GlobalExceptionHandler, DomainRuleException, ResourceNotFoundException, ConflictException
│   ├── security/                        # [PROPOSTA]
│   │   ├── SecurityConfig.java          # SecurityFilterChain stateless, BCrypt
│   │   ├── JwtService.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── AuthenticatedUser.java       # Wrapper com usuarioId, cargo, professorId/alunoId
│   ├── auth/                            # Issue #76
│   ├── usuarios/                        # Usuario, Cargo
│   ├── alunos/                          # Já existe (refatorar Aluno + DTOs)
│   ├── professores/                     # Professor, ProfessorDisciplinaTurma [PROPOSTA]
│   ├── cursos/                          # Curso (Issues #53, #58)
│   ├── periodos/                        # Periodo
│   ├── turmas/                          # Turma (Issue #77)
│   ├── disciplinas/                     # Disciplina, DisciplinaTurma (Issue #78)
│   ├── matriculas/                      # Matricula (Issue #55 ALU-001..010)
│   ├── aulas/                           # Aula (Issues #79, #80, #81)
│   ├── frequencias/                     # Frequencia (Issues #83, #84, #85)
│   ├── avaliacoes/                      # Avaliacao, AlunoAvaliacao (Issues #89-#93)
│   ├── comentarios/                     # Comentario (Issues #86, #87, #88)
│   ├── planos/                          # [PROPOSTA] PlanoAcompanhamento
│   ├── indicadores/                     # Indicadores (Issues #50, #94)
│   ├── relatorios/                      # RelatorioController/Service
│   └── auditoria/                       # Auditoria, AuditoriaService (LGPD)
└── resources/
    ├── application.properties
    ├── application-dev.properties
    ├── application-prod.properties
    └── db/migration/                    # V1__, V2__, V3__ (Flyway)
```

---

## 2. Catálogo de Endpoints (`/api/v1`)

> Todos os endpoints de listagem retornam `PageResponse<T>` (`{ content, page, size, totalElements, totalPages }`) `[PROPOSTA]`, aceitando `page` (default `0`), `size` (default `20`, max `100`) e `sort`.

### 2.1 Autenticação (`auth/`)
| Método | Rota | Acesso | Entrada | Saída (`200`/`204`) | Erros | Origem |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Público | `{ email, senha }` | `200`: `{ accessToken, tokenType: "Bearer", expiresIn, usuario: { id, email, cargo, perfilId, nomeCompleto } }` | `400`, `401`, `403` | `#76`, `DOC_BACKEND` |
| `GET` | `/api/v1/auth/me` | Autenticado | Header `Authorization: Bearer` | `200`: `{ idUsuario, email, cargo, professorId?, alunoId?, nomeCompleto }` | `401` | `DOC_BACKEND` |
| `POST` | `/api/v1/auth/logout` | Autenticado | Header `Authorization: Bearer` | `204 No Content` (registra evento em `auditoria`) | `401` | `DOC_BACKEND` |

### 2.2 Estrutura Acadêmica e Matrículas
| Método | Rota | Acesso | Entrada | Saída | Erros | Origem |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/cursos` | Autenticado | Query: `status?`, `q?`, `somenteMeus?`, `page`, `size`, `sort` | `200`: `PageResponse<CursoResumoDTO>` (`id, nome, descricao, cargaHoraria, status, totalAlunos`) | `401` | `#53`, `#58` |
| `GET` | `/api/v1/periodos` | Autenticado | Query: `vigente?`, `anoLetivo?` | `200`: `List<PeriodoDTO>` | `401` | `[PROPOSTA]` |
| `GET` | `/api/v1/cursos/{cursoId}/turmas` | Autenticado | Path `cursoId`; Query: `periodoId?` | `200`: `List<TurmaDTO>` | `401`, `404` | `#77` |
| `GET` | `/api/v1/turmas/{turmaId}/disciplinas` | Autenticado | Path `turmaId` | `200`: `List<DisciplinaTurmaDTO>` (`disciplinaTurmaId, turmaId, disciplina: { id, nome, descricao, cargaHoraria }`) | `401`, `404` | `#78` |
| `GET` | `/api/v1/turmas/{turmaId}/alunos` | Professor | Path `turmaId`; Query: `status?` (default `ATIVA`) | `200`: `List<AlunoTurmaDTO>` (`alunoId, matriculaId, nomeCompleto, matriculaEscolar, statusMatricula`) | `401`, `403`, `404` | `[PROPOSTA]` |
| `GET` | `/api/v1/alunos` | Professor | Query: `q?`, `turmaId?`, `cursoId?`, `somenteMeus?`, `page`, `size` | `200`: `PageResponse<AlunoDTO>` | `401`, `403` | `#52`, `#60` |
| `PATCH` | `/api/v1/matriculas/{id}/status` | Professor | Path `id`; Body `{ acao: "CONCLUIR"\|"CANCELAR"\|"TRANCAR" }` | `200`: `MatriculaDTO` (atualiza `status` e `dataDesligamento`) | `400`, `401`, `403`, `404`, `422` | `[PROPOSTA]` (`#55` `ALU-*`) |

### 2.3 Aulas e Frequência (`aulas/`, `frequencias/`)
| Método | Rota | Acesso | Entrada | Saída | Erros | Origem |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/aulas` | Autenticado | Query: `disciplinaTurmaId?`, `professorId?`, `dataInicio?`, `dataFim?`, `status?`, `page`, `size` | `200`: `PageResponse<AulaDTO>` | `401` | `#79` |
| `POST` | `/api/v1/aulas` | Professor | `{ disciplinaTurmaId, dataAula, horarioInicio, horarioFim, conteudo?, status? }` | `201`: `AulaDTO` (`professorId` da sessão) | `400`, `401`, `403`, `404`, `422` | `#80` |
| `PUT` | `/api/v1/aulas/{id}` | Professor da aula | `{ dataAula, horarioInicio, horarioFim, conteudo, status }` | `200`: `AulaDTO` | `400`, `401`, `403`, `404`, `422` | `#81` |
| `PATCH` | `/api/v1/aulas/{id}/realizar` | Professor da aula | `{ conteudo? }` | `200`: `AulaDTO` (status → `REALIZADA`) | `401`, `403`, `404`, `422` | `[PROPOSTA]` (`#55` `AUL-001..007`) |
| `PATCH` | `/api/v1/aulas/{id}/cancelar` | Professor da aula | — | `200`: `AulaDTO` (status → `CANCELADA`, preserva conteúdo) | `401`, `403`, `404`, `422` | `[PROPOSTA]` (`#55` `AUL-002..006`) |
| `GET` | `/api/v1/aulas/{id}/frequencias` | Autenticado (Aluno só vê a própria) | Path `id` (`id_aula`) | `200`: `List<FrequenciaItemDTO>` | `401`, `403`, `404` | `#83` |
| `POST` | `/api/v1/aulas/{id}/frequencias` | Professor da aula | `{ itens: [{ alunoId, statusPresenca, justificativa?, checklistAula?, observacao? }] }` | `201`: `List<FrequenciaItemDTO>` (upsert/rejeita duplicado no payload) | `400`, `401`, `403`, `404`, `409`, `422` | `#84` |
| `PUT` | `/api/v1/frequencias/{id}` | Professor da aula | `{ statusPresenca, justificativa?, checklistAula?, observacao? }` | `200`: `FrequenciaItemDTO` | `400`, `401`, `403`, `404`, `422` | `#85` |

### 2.4 Avaliações e Notas (`avaliacoes/`)
| Método | Rota | Acesso | Entrada | Saída | Erros | Origem |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/avaliacoes` | Autenticado | Query: `disciplinaTurmaId?`, `professorId?`, `periodoId?`, `status?`, `page`, `size` | `200`: `PageResponse<AvaliacaoDTO>` | `401` | `#89` |
| `POST` | `/api/v1/avaliacoes` | Professor | `{ disciplinaTurmaId, periodoId, nomeAvaliacao, tipoAvaliacao, descricao?, dataAvaliacao, valorTotal, peso, status? }` | `201`: `AvaliacaoDTO` | `400`, `401`, `403`, `404`, `422` | `#90` |
| `PUT` | `/api/v1/avaliacoes/{id}` | Professor responsável | `{ nomeAvaliacao, tipoAvaliacao, descricao?, dataAvaliacao, valorTotal, peso, status }` | `200`: `AvaliacaoDTO` | `400`, `401`, `403`, `404`, `422` | `#91` |
| `PATCH` | `/api/v1/avaliacoes/{id}/corrigir` | Professor responsável | — | `200`: `AvaliacaoDTO` (status → `CORRIGIDA`) | `401`, `403`, `404`, `422` | `[PROPOSTA]` (`#55` `AVA-*`) |
| `GET` | `/api/v1/avaliacoes/{id}/notas` | Autenticado (Aluno só vê a própria) | Path `id` (`id_avaliacao`) | `200`: `List<AlunoAvaliacaoDTO>` | `401`, `403`, `404` | `#92` |
| `PUT` | `/api/v1/avaliacoes/{id}/notas/{alunoId}` | Professor responsável | `{ nota, observacao? }` (`0 <= nota <= valorTotal`) | `200`: `AlunoAvaliacaoDTO` | `400`, `401`, `403`, `404`, `422` | `#93` |

### 2.5 Comentários Pedagógicos e Planos (`comentarios/`, `planos/`)
| Método | Rota | Acesso | Entrada | Saída | Erros | Origem |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/comentarios` | Professor (ou Aluno apenas próprios + `visivelAluno=true` `[CONFIRMADO]`) | Query: `alunoId?`, `professorId?`, `disciplinaTurmaId?`, `tipo?`, `classificacao?`, `dataInicio?`, `dataFim?`, `page`, `size` | `200`: `PageResponse<ComentarioDTO>` | `401`, `403` | `#86` |
| `POST` | `/api/v1/comentarios` | Professor | `{ alunoId, disciplinaTurmaId?, titulo, tipo, classificacao?, descricao, checklistItens?, acaoAcompanhamento?, visivelAluno? }` | `201`: `ComentarioDTO` | `400`, `401`, `403`, `404` | `#87` + `[CONFIRMADO]` |
| `PUT` | `/api/v1/comentarios/{id}` | Professor autor | `{ titulo, tipo, classificacao?, descricao, checklistItens?, acaoAcompanhamento?, visivelAluno? }` | `200`: `ComentarioDTO` | `400`, `401`, `403`, `404` | `#88` + `[CONFIRMADO]` |
| `GET` / `POST` / `PUT` | `/api/v1/planos-acompanhamento` (`/{id}`) | Professor | `{ alunoId, disciplinaTurmaId?, dificuldade, objetivo, acaoProposta, dataInicio, prazo, status, resultado? }` | `200`/`201`: `PlanoDTO` | `400`, `401`, `403`, `404`, `422` | `[CONFIRMADO]` (`aprendizagem.jsx`) |

### 2.6 Indicadores, Relatórios e Área do Aluno (`indicadores/`, `relatorios/`, `me/`)
| Método | Rota | Acesso | Entrada | Saída | Erros | Origem |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/indicadores/desempenho` | Professor | Query: `cursoId?`, `turmaId?`, `disciplinaTurmaId?`, `alunoId?`, `periodoId?`, `dataInicio?`, `dataFim?` | `200`: `{ taxaFrequenciaMedia, percentualAbaixoLimite, limitePresencaPercentual: 75, mediaNotasPonderada, totalAulasRegistradas, totalAlunosAvaliados, alertas: [...] }` | `401`, `403` | `#50`, `#94` |
| `GET` | `/api/v1/relatorios/academico` | Professor | Query: mesmos filtros acima + `categoria` | `200`: `RelatorioAcademicoDTO` (resumo + frequência + comentários + notas) | `401`, `403` | `DOC_BACKEND` `[CONFIRMADO]` |
| `GET` | `/api/v1/me/desempenho` | Aluno | Query: `periodoId?`, `disciplinaTurmaId?` | `200`: resumo pessoal do aluno autenticado (frequência, média, notas e comentários com `visivelAluno=true` `[CONFIRMADO]`) | `401`, `403` | `[PROPOSTA]` (`alunos.jsx`) |

#### Fórmulas dos Indicadores (`GET /api/v1/indicadores/desempenho`, `#50`) `[CONFIRMADO]`
- **Taxa de frequência**: $\frac{\text{registros com } \text{status\_presenca} \in \{\text{PRESENTE}, \text{ATRASO}\}}{\text{total de registros de frequência}} \times 100$ (retorna `null` se denominador for `0`, nunca `0%` enganoso; `FALTA_JUSTIFICADA` e `AUSENTE` não contam como presença).
- **Percentual abaixo de 75% (corte oficial confirmado)**: $\frac{\text{alunos com taxa individual} < 75\%}{\text{alunos com ao menos 1 registro}} \times 100$.
- **Média ponderada normalizada (escala 0–10)**: $\frac{\sum (\frac{\text{nota}_i}{\text{valorTotal}_i} \times 10 \times \text{peso}_i)}{\sum \text{peso}_i}$ para notas não nulas.
- **Escopo negativo**: *taxa de ocupação de salas* (`#50`) não entra na v1 `[CONFIRMADO]`.

---

## 3. Autenticação e Autorização

- **Mecanismo e Hospedagem `[CONFIRMADO]`**: **JWT Bearer stateless** (`Authorization: Bearer <token>`, expiração de 8h, assinatura HS256 via `JWT_SECRET` injetada por variável de ambiente), com backend hospedado na **Amazon EC2** (mesma VPC do Amazon RDS) e **alinhamento HTTPS** com o frontend (CORS restrito à origem HTTPS do frontend, evitando *Mixed Content* e protegendo credenciais/tokens em trânsito conforme LGPD).
  - *Justificativa sobre sessão por cookie*: o frontend e o backend estarão em origens distintas na AWS; JWT no header `Authorization` evita restrições de cookies `SameSite` cross-site.
- **Hash de senhas**: `BCryptPasswordEncoder` (custo 10).
- **Fluxo de login**: valida `email` e `senha`; se `usuario.ativo == false`, rejeita acesso (`USU-003`); caso válido, chama `usuario.registrarAcesso()` (`ultimo_acesso = Instant.now()`) e grava evento `LOGIN` em `auditoria`. Credencial inválida retorna `401` genérico sem indicar se o e-mail existe.
- **Matriz de Autorização (RBAC + Propriedade)**:
  - `ROLE_PROFESSOR`: acesso aos módulos docentes; mutações em `Aula`, `Frequencia`, `Avaliacao`, `AlunoAvaliacao` e `Comentario` validam propriedade (`recurso.professor.id == auth.professorId`) e vínculo em `professor_disciplina_turma` `[PROPOSTA]`.
  - `ROLE_ALUNO`: bloqueado (`403`) em rotas de escrita e listagens gerais da turma; acessa apenas `/api/v1/auth/me`, `/api/v1/me/desempenho` e consultas filtradas estritamente pelo seu `alunoId`.

---

## 4. Validações de Entrada e Formato Padrão de Erro

- **Validação declarativa**: todos os DTOs de requisição usam Java `record` com Bean Validation (`@NotNull`, `@NotBlank`, `@Email`, `@Size`, `@Positive`, `@DecimalMin("0.00")`, `@Valid`).
- **Formato padrão de erro — RFC 7807 (`ProblemDetail` nativo do Spring)** `[PROPOSTA]`, centralizado em `GlobalExceptionHandler` (`@RestControllerAdvice`):
  ```json
  {
    "type": "https://edulytics.api/errors/validation",
    "title": "Dados inválidos",
    "status": 400,
    "detail": "Um ou mais campos falharam na validação.",
    "instance": "/api/v1/avaliacoes/1/notas/2",
    "timestamp": "2026-11-25T22:10:00Z",
    "errors": { "nota": "A nota não pode ultrapassar o valor total (10.00)." }
  }
  ```
- **Mapeamento HTTP**: `400` (`MethodArgumentNotValidException` / JSON malformado), `401` (`AuthenticationException`), `403` (`AccessDeniedException`), `404` (`ResourceNotFoundException`), `409` (`ConflictException` / violação de `UNIQUE` como chamada duplicada), `422` (`DomainRuleException`, ex.: transição de status inválida), `500` (mensagem genérica sem expor SQL, classes ou senhas).

---

## 5. Serviços, Camadas e Regras de Negócio

- **Fluxo**: `Controller` (validação sintática + HTTP) → `Service` (`@Transactional`, orquestração cross-entity, checagem de propriedade e auditoria) → `Entity` (invariantes e métodos de domínio) + `Repository` (queries Spring Data JPA com `@EntityGraph`/projections para evitar N+1).
- **Regras em Entidades (conforme Diagrama `#31` e testes `#55`)**:
  - `Usuario.registrarAcesso()`: atualiza apenas `ultimoAcesso`, preservando `dataCriacao` e `ativo`.
  - `Matricula.concluir()`, `cancelar()`, `trancar()`: validam transições permitidas (ex.: matrícula `CANCELADA` não pode concluir/trancar; `CONCLUIDA` não pode cancelar) e preenchem `dataDesligamento`.
  - `Aula.realizar(conteudo)` e `Aula.cancelar()`: validam `horarioFim > horarioInicio`, impedem realizar aula cancelada ou cancelar aula realizada, exigem `conteudo` não vazio ao realizar e preservam conteúdo ao cancelar.
  - `Avaliacao.corrigir()`: impede corrigir avaliação `CANCELADA` e define comportamento explícito para `CORRIGIDA` (ver Pergunta 11 em [04-perguntas-abertas.md](./04-perguntas-abertas.md)).
- **Auditoria LGPD (`AuditoriaService`)**: invocado nos `Services` após `save`/`update`, serializando snapshots anterior e novo em `JSONB` (omitindo sempre `senhaHash`), capturando `id_usuario` do `SecurityContext` e `endereco_ip` do `HttpServletRequest`.
- **Observabilidade (Issue `#40` critério 8)**: `/actuator/health` liberado para health check + logs SLF4J estruturados sem dados sensíveis.

---

## 6. Estratégia de Testes (Issues `#47`, `#55`, `#56`)

1. **Testes Unitários (JUnit 5 + Mockito)**:
   - Cobrir integralmente a matriz da issue `#55`: `UsuarioTest` (`USU-001..005`), `MatriculaTest` (`ALU-001..010`), `AulaTest` (`AUL-001..008`), `AvaliacaoTest` (`AVA-001..010`) e serviços de frequência/comentário/indicadores (`#50`).
2. **Testes de Integração (`@SpringBootTest` + `MockMvc` + Testcontainers PostgreSQL `[PROPOSTA]`)**:
   - Caso o ambiente de CI não disponha de Docker para Testcontainers, usar H2 em modo `PostgreSQL` (`MODE=PostgreSQL`) com Flyway habilitado como fallback.
   - Fluxos principais: (a) login JWT e bloqueio de usuário inativo; (b) CRUD de aula + lançamento em lote de frequência + tentativa duplicada (`409`); (c) criação de avaliação + lançamento de nota > `valorTotal` (`422`) + recálculo de indicadores em `/api/v1/indicadores/desempenho`; (d) isolamento `ROLE_ALUNO` (`403` ao acessar rota docente); (e) verificação de registro gravado em `auditoria`.
3. **Documentação OpenAPI**: manter `/swagger-ui.html` funcional com esquema `BearerAuth` configurado em `OpenApiConfig` (rubrica `#1`).
