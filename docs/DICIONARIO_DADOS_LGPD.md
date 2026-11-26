# Dicionário de Dados e Governança LGPD — EDULYTICS

> Este documento atende à issue `#38` e ao critério 4 da issue `#40`. Todos os exemplos utilizam **dados estritamente fictícios**, alinhados ao schema versionado em Flyway ([`V1__schema_inicial.sql`](../backend_spring/src/main/resources/db/migration/V1__schema_inicial.sql) e [`V2__extensoes_v1_e_planos.sql`](../backend_spring/src/main/resources/db/migration/V2__extensoes_v1_e_planos.sql)) e ao modelo AWS (`monitoramento_academico.sql`, sem perfil `COORDENADOR` e sem entidade `SALA`).

---

## 1. Matriz de Privacidade e Base Legal (LGPD — Lei nº 13.709/2018)

| Tabela | Campos Pessoais / Sensíveis | Finalidade | Base Legal LGPD | Perfis com Acesso | Retenção Sugerida | Proteção Técnica |
|---|---|---|---|---|---|---|
| `usuario` | `email`, `senha_hash`, `nome_completo`, `ultimo_acesso` | Autenticação, autorização RBAC e controle de sessão | Execução de contrato educacional (Art. 7º, V) / Legítimo interesse de segurança (Art. 7º, IX) | Próprio usuário; sistema backend | Enquanto ativo + 5 anos após desligamento (log de acesso) | `BCrypt` (custo 10), JWT HS256 stateless, `senha_hash` nunca serializado |
| `professor` | `nome_completo`, `formacao` | Identificação docente nas ofertas, aulas, avaliações e pareceres | Execução de contrato (Art. 7º, V) | Docentes e alunos (somente nome em aulas/comentários) | Vínculo institucional + prazo legal | RBAC via JWT + HTTPS em trânsito |
| `aluno` | `nome_completo`, `data_nascimento`, `data_ingresso`, `matricula` | Identificação acadêmica, emissão de histórico e acompanhamento pedagógico | Execução de contrato educacional (Art. 7º, V) | `Professor` (turmas vinculadas) e próprio `Aluno` (`/me/desempenho`) | Permanente para histórico escolar; dados operacionais até 5 anos pós-conclusão | RBAC (`403` para perfil `Aluno` em rotas docentes) + CORS restrito |
| `frequencia` | `status_presenca`, `justificativa`, `observacao`, `checklist_aula` | Controle de assiduidade (corte 75%) e justificativa de faltas | Cumprimento de obrigação legal educacional (Art. 7º, II) | `Professor` (da turma) e próprio `Aluno` (somente próprios registros) | 5 anos letivos | Constraint `UNIQUE(aula_id, aluno_id)` + `AuditoriaService` |
| `comentario` | `titulo`, `tipo` (`SAUDE`/`COMPORTAMENTO`/`SOCIAL`), `descricao`, `visivel_aluno` | Acompanhamento pedagógico integral e sinalização de apoio estudantil | Exercício regular / Tutela educacional e consentimento/dever de sigilo (Art. 7º, V e Art. 11 quando `tipo = SAUDE`) | `Professor`; `Aluno` acessa **exclusivamente** registros com `visivel_aluno = true` | 2 anos letivos após encerramento da turma | `visivel_aluno = false` por padrão + filtro obrigatório em `ComentarioService` e `/me/desempenho` |
| `plano_acompanhamento` | `dificuldade`, `objetivo`, `acao_proposta`, `resultado` | Registro de intervenções pedagógicas para alunos com baixo desempenho/risco | Execução de contrato educacional (Art. 7º, V) | `Professor` | 2 anos letivos após conclusão do plano | Acesso bloqueado (`403`) ao perfil `Aluno` e rotas não autenticadas |
| `auditoria` | `id_usuario`, `tabela_modificada`, `dados_anteriores`, `dados_novos`, `endereco_ip`, `data_hora` | Rastreabilidade de alterações críticas e resposta a incidentes LGPD | Cumprimento de obrigação legal e segurança da informação (Art. 7º, II e IX) | `Professor` (leitura auditável via `/api/v1/auditoria`) / Administrador DBA | Mínimo 6 meses a 5 anos | Sanitização prévia (nunca grava `senhaHash` ou tokens JWT) |

> Nota sobre CPF: o sistema **não coleta nem armazena CPF**, respeitando o princípio da **minimização de dados** da LGPD (Art. 6º, III).

---

## 2. Catálogo Completo de Tabelas e Colunas

### 2.1 Autenticação e Perfis (`usuario`, `professor`, `aluno`)

| Tabela | Coluna | Tipo SQL | Obrigatória | Regra / Domínio | Exemplo Fictício |
|---|---|---|---|---|---|
| `usuario` | `id` | `BIGINT` (PK, Identity) | Sim | Chave primária | `1` |
| `usuario` | `email` | `VARCHAR(150)` (`UNIQUE`) | Sim | E-mail institucional único | `ana@exemplo.com` |
| `usuario` | `senha_hash` | `VARCHAR(255)` | Sim | Hash BCrypt (nunca texto puro) | `$2a$10$...` |
| `usuario` | `nome_completo` | `VARCHAR(150)` | Sim | Nome de exibição | `Ana Martins` |
| `usuario` | `cargo` | `VARCHAR(40)` | Sim | `Professor` \| `Aluno` (sem `Coordenador`) | `Professor` |
| `usuario` | `perfil_id` | `BIGINT` | Não | Referencia ID do professor ou aluno | `1` |
| `usuario` | `ativo` | `BOOLEAN` | Sim | Default `TRUE`; `FALSE` bloqueia login (`422`) | `true` |
| `usuario` | `data_criacao` | `TIMESTAMP` | Sim | Imutável após criação (`USU-004`) | `2026-02-01T10:00:00Z` |
| `usuario` | `ultimo_acesso` | `TIMESTAMP` | Não | Atualizado em `LOGIN` (`USU-001`) | `2026-05-18T19:05:00Z` |
| `professor` | `id` | `BIGINT` (PK) | Sim | Chave primária | `1` |
| `professor` | `usuario_id` | `BIGINT` (FK → `usuario.id`) | Sim | Conta associada | `1` |
| `professor` | `nome_completo` | `VARCHAR(150)` | Sim | Nome do docente | `Ana Martins` |
| `professor` | `formacao` | `VARCHAR(150)` | Não | Titulação/especialidade | `Mestrado em Computação` |
| `aluno` | `id` | `BIGINT` (PK) | Sim | Chave primária | `1` |
| `aluno` | `usuario_id` | `BIGINT` | Não | Conta associada (`REL-013`) | `3` |
| `aluno` | `nome_completo` | `VARCHAR(150)` | Sim | Nome do estudante | `Carla Souza` |
| `aluno` | `data_nascimento` | `DATE` | Não | Formato ISO `YYYY-MM-DD` | `2004-05-12` |
| `aluno` | `data_ingresso` | `DATE` | Sim | Data de entrada na instituição | `2026-02-02` |
| `aluno` | `matricula` | `VARCHAR(50)` (`UNIQUE`) | Sim | Código único de matrícula escolar | `2026001` |

### 2.2 Estrutura Acadêmica e Matrículas (`periodo`, `curso`, `turma`, `disciplina`, `disciplina_turma`, `professor_disciplina_turma`, `matricula`)

| Tabela | Coluna | Tipo SQL | Obrigatória | Regra / Domínio | Exemplo Fictício |
|---|---|---|---|---|---|
| `periodo` | `id`, `nome_periodo`, `ano_letivo`, `data_inicio`, `data_fim` | `BIGINT`, `VARCHAR(80)`, `INTEGER`, `DATE`, `DATE` | Sim | `data_fim >= data_inicio` | `1º Semestre` · `2026` |
| `curso` | `id`, `nome`, `descricao`, `carga_horaria`, `status` | `BIGINT`, `VARCHAR(160)`, `VARCHAR(1000)`, `INTEGER`, `VARCHAR(30)` | Sim (exceto `descricao`) | `ATIVO` \| `INATIVO` \| `CONCLUIDO` | `Tecnologia em Sistemas para Internet` (`2000h`) |
| `turma` | `id`, `curso_id` (FK), `periodo_id` (FK), `nome_turma`, `turno`, `status` | `BIGINT`, `BIGINT`, `BIGINT`, `VARCHAR(80)`, `VARCHAR(30)`, `VARCHAR(30)` | Sim | Turno `MATUTINO`/`NOTURNO`; Status `ATIVA`/`ENCERRADA` | `TSI-1A` (`NOTURNO`) |
| `disciplina` | `id`, `nome`, `descricao`, `carga_horaria` | `BIGINT`, `VARCHAR(160)`, `VARCHAR(1000)`, `INTEGER` | Sim (exceto `descricao`) | Carga horária positiva | `Desenvolvimento Web com React` (`80h`) |
| `disciplina_turma` | `id`, `disciplina_id` (FK), `turma_id` (FK) | `BIGINT` | Sim | Oferta da disciplina na turma | `1` |
| `professor_disciplina_turma` | `id`, `professor_id` (FK), `disciplina_turma_id` (FK) | `BIGINT` | Sim | Alocação docente para filtro `somenteMeus` | `1` |
| `matricula` | `id`, `aluno_id` (FK), `turma_id` (FK), `status`, `data_matricula`, `data_desligamento` | `BIGINT`, `BIGINT`, `BIGINT`, `VARCHAR(20)`, `DATE`, `DATE` | Sim (exceto `data_desligamento`) | `ATIVA`, `TRANCADA`, `CONCLUIDA`, `CANCELADA` (matriz `ALU-001..010`) | `ATIVA` · `2026-02-02` |

### 2.3 Acompanhamento Diário, Avaliações e Analytics (`aula`, `frequencia`, `avaliacao`, `aluno_avaliacao`, `comentario`, `plano_acompanhamento`, `auditoria`)

| Tabela | Coluna | Tipo SQL | Obrigatória | Regra / Domínio | Exemplo Fictício |
|---|---|---|---|---|---|
| `aula` | `id`, `disciplina_turma_id` (FK), `professor_id` (FK), `data_aula`, `horario_inicio`, `horario_fim`, `conteudo`, `status` | `BIGINT`, `BIGINT`, `BIGINT`, `DATE`, `TIME`, `TIME`, `VARCHAR(1000)`, `VARCHAR(20)` | Sim (exceto `conteudo`) | `horario_fim > horario_inicio`; `PLANEJADA`, `REALIZADA`, `CANCELADA` (`AUL-001..008`) | `2026-05-04` `19:00`–`20:40` (`REALIZADA`) |
| `frequencia` | `id`, `aula_id` (FK), `aluno_id` (FK), `presente`, `status_presenca`, `justificativa`, `checklist_aula`, `observacao` | `BIGINT`, `BIGINT`, `BIGINT`, `BOOLEAN`, `VARCHAR(30)`, `VARCHAR(500)`, `VARCHAR(2000)`, `VARCHAR(1000)` | `aula_id`, `aluno_id`, `presente`, `status_presenca` | `UNIQUE(aula_id, aluno_id)`; `PRESENTE` e `ATRASO` implicam `presente=TRUE`; `AUSENTE` e `FALTA_JUSTIFICADA` implicam `presente=FALSE` | `ATRASO` (`presente=true`) |
| `avaliacao` | `id`, `disciplina_turma_id` (FK), `professor_id`, `periodo_id`, `nome_avaliacao`, `tipo_avaliacao`, `descricao`, `data_avaliacao`, `valor_total`, `peso`, `status` | `BIGINT`, `VARCHAR(...)`, `DATE`, `NUMERIC(5,2)`, `VARCHAR(20)` | Sim (exceto `descricao`) | `CHECK(valor_total > 0)`, `CHECK(peso > 0)`; `PLANEJADA`, `ABERTA`, `APLICADA`, `CORRIGIDA`, `CANCELADA` | `Prova 1` (`10.00`, peso `2.00`) |
| `aluno_avaliacao` | `id`, `avaliacao_id` (FK), `aluno_id` (FK), `nota`, `observacao` | `BIGINT`, `BIGINT`, `BIGINT`, `NUMERIC(5,2)`, `VARCHAR(1000)` | `avaliacao_id`, `aluno_id` | `UNIQUE(avaliacao_id, aluno_id)`; `0 <= nota <= valor_total` | `9.00` (`Ótimo domínio`) |
| `comentario` | `id`, `aluno_id` (FK), `professor_id` (FK), `disciplina_turma_id`, `titulo`, `tipo`, `classificacao`, `descricao`, `checklist_itens`, `acao_acompanhamento`, `visivel_aluno`, `data_comentario` | `BIGINT`, `VARCHAR(...)`, `BOOLEAN`, `TIMESTAMP` | Sim (exceto opcionais) | `tipo` ∈ `{COMPORTAMENTO, DESEMPENHO, SAUDE, SOCIAL}`; `visivel_aluno` default `FALSE` (LGPD) | `DESEMPENHO` · `POSITIVO` · `visivel_aluno=true` |
| `plano_acompanhamento` | `id`, `aluno_id` (FK), `professor_id` (FK), `disciplina_turma_id`, `dificuldade`, `objetivo`, `acao_proposta`, `data_inicio`, `prazo`, `status`, `resultado` | `BIGINT`, `VARCHAR(...)`, `DATE`, `DATE`, `VARCHAR(30)` | Sim (exceto `disciplina_turma_id`, `resultado`) | `CHECK(prazo >= data_inicio)`; `PENDENTE`, `EM_ACOMPANHAMENTO`, `CONCLUIDO` | `EM_ACOMPANHAMENTO` · `2026-06-15` |
| `auditoria` | `id`, `id_usuario`, `tabela_modificada`, `operacao`, `dados_anteriores`, `dados_novos`, `data_hora`, `endereco_ip` | `BIGINT`, `BIGINT`, `VARCHAR(100)`, `VARCHAR(30)`, `VARCHAR(4000)`, `TIMESTAMP`, `VARCHAR(45)` | `tabela_modificada`, `operacao`, `data_hora` | Snapshot sanitizado sem senhas | `usuario` · `LOGIN` |
