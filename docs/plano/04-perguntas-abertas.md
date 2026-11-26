# 04 — Decisões Confirmadas e Perguntas Abertas

> Este documento consolida as decisões já aprovadas pelo dono do produto (Parte 1) e mantém o registro das decisões técnicas secundárias ainda pendentes de alinhamento antes ou durante a implementação (Parte 2).

---

## Parte 1 — Decisões Confirmadas (Fechadas em 25/11/2026)

1. **Fonte de verdade do banco (`monitoramento_academico.sql` vs. `README.md`) — CONFIRMADO: Sim**
   - Adotar `origin/infra/database-aws:monitoramento_academico.sql` (16 tabelas, com `cargo`, `periodo`, `matricula` e sem `coordenador`) como baseline oficial no Flyway (`V1`) e atualizar os diagramas do `README.md` (`#28`, `#31`, `#67`).
   - Impacto: [00-visao-geral.md](./00-visao-geral.md), [01-modelo-dados.md](./01-modelo-dados.md).

2. **Recursos pedagógicos extras do frontend — CONFIRMADO: Estender o banco**
   - Preservar os recursos já construídos em `src/components/frequencia.jsx` e `src/components/aprendizagem.jsx` estendendo o PostgreSQL via Flyway (`V3`): `status_presenca` (com `ATRASO`), `checklist_aula` e `observacao` em `frequencia`; `checklist_itens` e `acao_acompanhamento` em `comentario`; e nova tabela `plano_acompanhamento`.
   - Impacto: [01-modelo-dados.md](./01-modelo-dados.md), [02-backend.md](./02-backend.md), [03-frontend.md](./03-frontend.md).

3. **Tela de Relatórios (`relatorio.jsx`) — CONFIRMADO: Manter na v1**
   - Manter `RelatoriosPage` (`/professor/relatorios`) com prévia integrada a `GET /api/v1/relatorios/academico`, exportação CSV e impressão/PDF.
   - Impacto: [00-visao-geral.md](./00-visao-geral.md), [02-backend.md](./02-backend.md), [03-frontend.md](./03-frontend.md).

4. **Hospedagem, Autenticação e HTTPS — CONFIRMADO: JWT + EC2 + alinhamento HTTPS**
   - Usar **JWT Bearer stateless** (`Authorization: Bearer`), hospedar o backend Spring Boot na **Amazon EC2** (na mesma VPC do RDS) e alinhar **HTTPS** entre frontend e backend (evitando *Mixed Content* do bucket S3 HTTP puro e protegendo credenciais em trânsito).
   - Impacto: [00-visao-geral.md](./00-visao-geral.md), [02-backend.md](./02-backend.md), [03-frontend.md](./03-frontend.md).

5. **Regras dos indicadores (`#50`, `#94`) e visibilidade do aluno — CONFIRMADO: Sim**
   - Corte oficial de presença de **75%**, `Atraso` contando como presença e `Falta justificada` como ausência; remoção definitiva de *taxa de ocupação de salas* da v1; adição de `visivel_aluno BOOLEAN NOT NULL DEFAULT false` em `comentario` (LGPD `#38`) para não expor registros sensíveis (`SAUDE`) na Área do Aluno.
   - Impacto: [01-modelo-dados.md](./01-modelo-dados.md), [02-backend.md](./02-backend.md), [03-frontend.md](./03-frontend.md).

---

## Parte 2 — Perguntas Técnicas Secundárias Ainda em Aberto

### 6. Nulidade de `aluno.id_usuario` e `comentario.id_disciplina_turma`
- **Contexto**: em `monitoramento_academico.sql`, ambas as colunas são `NOT NULL`, mas os diagramas (`README.md`, `#31`) e os testes `REL-012` e `REL-013` da issue `#55` esperam que sejam opcionais (`NULL`).
- **Opções**:
  - **A)** Tornar ambas `NULL` na migração Flyway V2/V3 (aderindo aos testes da issue `#55` e permitindo comentário geral sem disciplina ou aluno sem conta ativa).
  - **B)** Manter `NOT NULL` no banco e ajustar os casos `REL-012`/`REL-013`.
- **Recomendação**: **Opção A**.

### 7. Vínculo explícito Professor ↔ Disciplina/Turma
- **Contexto**: o SQL AWS não possui tabela ligando `professor` a `disciplina_turma` (só existe `id_professor` em `aula` e `avaliacao`), mas `professor.jsx` possui o filtro *"Apenas alunos do professor"* e `DOCUMENTACAO_BACKEND.md` prevê autorização por disciplina.
- **Opções**:
  - **A)** Criar a tabela `professor_disciplina_turma` `[PROPOSTA]` na migração V3.
  - **B)** Permitir que qualquer usuário com cargo `Professor` lance aulas/avaliações em qualquer `disciplina_turma`.
- **Recomendação**: **Opção A** (evita que um docente altere turmas de outro).

### 8. Padronização de Enums/Status (`lowercase` vs. `UPPER_SNAKE_CASE`)
- **Contexto**: os dados seed em `monitoramento_academico.sql` usam `'ativo'`, `'ativa'`, `'ministrada'`, `'noturno'`, `'atencao'`, enquanto o Diagrama de Classes (`#31`) define `ATIVO`, `ATIVA`, `REALIZADA`, `NOITE`, `NEUTRO`/`NEGATIVO`.
- **Opções**:
  - **A)** Padronizar todos os valores no banco e na API em `UPPER_SNAKE_CASE` via migração V2 (alinhado a `enum` Java).
  - **B)** Manter strings em `lowercase` no banco e mapear via conversor JPA.
- **Recomendação**: **Opção A**.

### 9. Versão do Spring Boot (`4.1.1`) vs. `springdoc-openapi` (`2.6.0`)
- **Contexto**: `backend_spring/build.gradle` declara `org.springframework.boot` `4.1.1` com `springdoc-openapi-starter-webmvc-ui:2.6.0`, combinação com alto risco de incompatibilidade no Swagger (`#1`).
- **Opções**:
  - **A)** Estabilizar em **Spring Boot 3.4.x / 3.5.x LTS** (totalmente compatível com `springdoc 2.6+/2.8+` e Java 17).
  - **B)** Manter Spring Boot `4.1.1` e atualizar `springdoc` para versão oficial compatível.
- **Recomendação**: **Opção A**.

### 10. Definições pendentes da matriz de testes unitários (`#55`)
- **Contexto**: a própria issue `#55` deixou 4 regras marcadas como *"Definir"*:
  - `USU-003`: usuário com `ativo = false` deve ter o login bloqueado (`403`/`401`)?
  - `ALU-007` / `ALU-008`: matrícula `TRANCADA` pode ser `CANCELADA`, mas não `CONCLUIDA` diretamente sem reativação?
  - `AUL-007`: `Aula.realizar()` deve exigir `conteudo` preenchido?
  - `AVA-002`: `Avaliacao.corrigir()` em avaliação já `CORRIGIDA` deve retornar erro (`422`) ou ser idempotente (`200`)?
- **Recomendação**: **Sim** para `USU-003`, `ALU-007`/`ALU-008` e `AUL-007`; **idempotente (`200`)** para `AVA-002` (rejeitando `422` apenas quando `CANCELADA`).
