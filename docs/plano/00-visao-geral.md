# 00 — Visão Geral do Planejamento (EDULYTICS)

> Este documento consolida o diagnóstico do repositório `CauaFelipe1738/P.I.-2sem-2026` (branch `develop`, além das branches remotas e issues abertas/fechadas), define o escopo da primeira versão integrada (**v1**) e estabelece a ordem recomendada de implementação.
> Os detalhamentos técnicos estão distribuídos em:
> - [01-modelo-dados.md](./01-modelo-dados.md) — Schema PostgreSQL, relacionamentos, índices, diagrama ER e migrações.
> - [02-backend.md](./02-backend.md) — Arquitetura Spring Boot, endpoints `/api/v1`, segurança JWT, validações e testes.
> - [03-frontend.md](./03-frontend.md) — Rotas React, fluxos, estado, integração com API e testes.
> - [04-perguntas-abertas.md](./04-perguntas-abertas.md) — Decisões pendentes para confirmação do dono do produto.

---

## 1. Objetivo do Sistema

**EDULYTICS** é uma plataforma web de monitoramento acadêmico voltada principalmente para **docentes** acompanharem estudantes além de notas e frequência tradicionais — integrando registros de comportamento, participação, dificuldades de aprendizagem e evolução pedagógica para apoiar decisões de ensino personalizadas (`README.md`, `DOCUMENTACAO_TECNICA.md`). Como público secundário, os **alunos** podem acessar suas próprias informações de frequência, avaliações e observações pedagógicas (`README.md`, `src/App.jsx`).

---

## 2. Diagnóstico do Repositório (Passo 1)

### 2.1 O que já existe

- **Estrutura de versionamento** (ADR na issue `#23`): monorepo na branch `develop` (branch `main` contém apenas `68c5086 Initial commit`).
- **Frontend (`src/`)**: protótipo funcional em **React 19.2.8 + Vite 8.3.0 + Tailwind CSS 4.3.3** (`package.json`), operando 100% em memória/navegador via `localStorage` (`src/data/academicoStore.js` com `useSyncExternalStore`) e catálogo estático (`src/data/dadosAcademicos.js`).
  - Telas construídas: `src/components/Login.jsx`, seleção de perfil e Visão Geral (`src/App.jsx`), catálogo do professor (`src/components/professor.jsx`, `src/components/CatalogoAcademico.jsx`), `src/components/frequencia.jsx`, `src/components/aprendizagem.jsx`, `src/components/desempenho.jsx`, `src/components/relatorio.jsx` (com exportação CSV e impressão `@media print`), além de placeholders em `src/components/alunos.jsx` e `src/components/coodernador.jsx`.
  - Testes existentes: 4 verificações de normalização em `src/data/academicoStore.test.js` (`npm test`).
  - Deploy estático publicado no **Amazon S3** na branch `origin/infra/deploy-frontend-s3` (PR `#96`, `docs/frontend-s3.md`, `infra/frontend/s3-bucket-policy.json`) em HTTP puro (sem CloudFront por restrição da AWS Academy).
- **Backend (`backend_spring/`)**: projeto **Spring Boot `4.1.1` + Java 17 + Gradle** (`backend_spring/build.gradle`) com banco H2 em memória (`application.properties`) e `springdoc-openapi-starter-webmvc-ui:2.6.0` (issues `#32`, `#52`, `#54`, `#59`, `#60`, PR `#71`). Possui apenas o pacote `alunos` (`Aluno.java`, `AlunoController.java`, `AlunoRepository.java`, `AlunoService.java`) expondo `GET /alunos`.
- **Banco de Dados (`origin/infra/database-aws`, PR `#95` aberto)**: instância **PostgreSQL 17.11** no **Amazon RDS** (`db.t3.micro`, VPC privada, TLS 1.3, banco `monitoramento_academico`, usuário `monitoramento_app`), com dump `monitoramento_academico.sql` contendo **16 tabelas** e massa de teste inicial (6 usuários, 2 professores, 4 alunos, 1 curso, 1 turma, 2 disciplinas, 5 aulas, 20 frequências, 3 avaliações, 12 notas, 2 comentários) e scripts em `infra/database/01_ajustar_sequencias.sql`, `02_configurar_usuario.sql` e `03_validar_banco.sql` (`docs/database-aws.md`).
- **Especificações em Issues e Branches**:
  - Contrato REST proposto em `origin/feature/alunos:DOCUMENTACAO_BACKEND.md` e detalhado nas issues `#53`, `#58`, `#76`–`#94`.
  - Matriz de casos de teste unitários na issue `#55` (`USU-001..005`, `ALU-001..010`, `AUL-001..008`, `AVA-001..010`, `REL-001..014`).
  - Dicionário de dados inicial na issue `#38`.
  - Rubricas de avaliação acadêmica nas issues `#1`, `#8`–`#13`, `#40`.

### 2.2 O que está incompleto

- **Backend**:
  - Apenas 1 endpoint implementado (`GET /alunos`, fora do prefixo `/api/v1`).
  - Sem driver/configuração do PostgreSQL, sem ferramenta de migração de schema (Flyway/Liquibase), sem tratamento global de exceções, sem DTOs de entrada/saída, sem autenticação/autorização (apesar de `spring-boot-starter-security` constar no `build.gradle`), sem configuração de CORS, sem lógica de indicadores (`#50`, `#94`), sem trilha de auditoria (`auditoria`) e sem testes unitários/integração reais.
  - Sem definição de hospedagem em nuvem para a API Java (critério de aceite do `README.md`).
- **Frontend**:
  - Não consome API HTTP; usa `localStorage` e arrays fixos em `dadosAcademicos.js`.
  - Não possui módulo/tela para **Avaliações e Notas** (`avaliacao` e `aluno_avaliacao` existem no SQL e issues `#89`–`#93`).
  - `alunos.jsx` é apenas um placeholder estático de 10 linhas.
  - Roteamento manual via estado `paginaAtual` em `App.jsx` (perde estado no reload e impede deep-linking; issue `#25` pede React Router).
  - Ausência de testes de componentes/UI (`#46`) e testes E2E (`#57`).
- **DevOps e Documentação**:
  - Pipeline CI/CD no GitHub Actions (`#45`) ainda não existe no repositório.
  - Dicionário LGPD (`#38`) ainda não especifica finalidade, base legal, quem pode acessar e retenção por campo pessoal.

### 2.3 Contradições e Problemas Críticos Identificados

1. **Entidade `COORDENADOR` removida vs. mantida**: a issue `#67` instrui *"eliminar coordenador"* e o dump `monitoramento_academico.sql` (`origin/infra/database-aws`) já removeu a tabela `coordenador` e cadastrou apenas os cargos `Professor` e `Aluno`. Porém, `COORDENADOR` ainda aparece no `README.md`, Diagrama de Classes (`#31`), Dicionário (`#38`), `DOCUMENTACAO_BACKEND.md` e frontend (`App.jsx`, `src/components/coodernador.jsx`).
2. **Divergência entre DER (`README.md` / `#28`), Diagrama de Classes (`#31`), Testes (`#55`) e SQL AWS (`monitoramento_academico.sql`)**:
   - O DER do `README.md` omite `CARGO`, `PERIODO` e `MATRICULA`, colocando `status_matricula`/`data_desligamento` em `ALUNO` e `semestre`/`data_inicio`/`data_fim` em `TURMA`. Isso levou `DOCUMENTACAO_BACKEND.md` a afirmar erroneamente que alunos não se relacionam com turmas.
   - O SQL real implantado na AWS (`monitoramento_academico.sql`) **já possui** `cargo`, `periodo` e `matricula` (com `status` e `data_desligamento`), alinhado ao Diagrama de Classes (`#31`).
   - `aluno.id_usuario` e `comentario.id_disciplina_turma` são `NOT NULL` no SQL, mas opcionais (`0..1`) nos diagramas (`README.md`, `#31`) e nos casos `REL-012` e `REL-013` da issue `#55`.
3. **Padronização de valores de domínio e coluna de auditoria**: o SQL usa valores em `lowercase` (`'ativo'`, `'ativa'`, `'ministrada'`, `'noturno'`, `'projeto'`, `'atencao'`) e coluna `auditoria.data_hora`, enquanto o Diagrama de Classes (`#31`) define enums em `UPPERCASE` (`ATIVO`, `ATIVA`, `REALIZADA`, `NOITE`, `SEMINARIO`/`CONTINUA`, `NEUTRO`/`NEGATIVO`) e `auditoria.timestamp`.
4. **Lacuna Frontend ↔ Banco de Dados**:
   - `frequencia.jsx` trabalha com 4 status (`Presente`, `Ausente`, `Falta justificada`, `Atraso`) + checklist de aula e observação, enquanto a tabela `frequencia` no SQL só possui `presente BOOLEAN` e `justificativa TEXT` (limitação já apontada em `DOCUMENTACAO_BACKEND.md`).
   - `aprendizagem.jsx` possui checklists (`checklistAprendizagem`) e formulário completo de **Plano de acompanhamento**, mas o SQL só possui `comentario` (`DOCUMENTACAO_BACKEND.md` registra essa ausência).
   - O inverso também ocorre: `avaliacao` e `aluno_avaliacao` existem no banco e nas issues `#89`–`#93`, mas não possuem tela no frontend.
5. **Tela de Relatórios (`relatorio.jsx`)**: existe na branch `develop` (PR `#73`) e em `DOCUMENTACAO_BACKEND.md`, mas foi removida na branch `origin/feature/alunos` (PR `#82`, fechada sem merge) e teve botão de exportação criticado na issue `#20`.
6. **Bug bloqueante no backend atual (`backend_spring/`)**:
   - `Aluno.java` foi escrito como `@Entity public record Aluno(...)`. **Java `record` é incompatível com JPA/Hibernate** (exige classe não-final e construtor padrão sem argumentos).
   - `build.gradle` declara Spring Boot `4.1.1` com `springdoc-openapi-starter-webmvc-ui:2.6.0`, gerando risco alto de incompatibilidade de binários/Jakarta/Spring Framework, além de `spring-boot-starter-security` sem `SecurityFilterChain` bloquear toda a API (inclusive Swagger).
7. **Infraestrutura e higiene de repositório**:
   - `docs/database-aws.md` menciona `Frontend (Vercel) → API Backend → PostgreSQL (Amazon RDS)`, mas `docs/frontend-s3.md` publicou o frontend no Amazon S3 em HTTP puro.
   - `node_modules/` está commitado na branch `develop` (conforme `git diff` contra `main`), inchando o repositório.
8. **Indicador fora do domínio modelado**: a issue `#50` cita *"taxa de ocupação de salas"*, mas não existe entidade `SALA` em nenhum diagrama, dump SQL ou tela.

> As decisões de negócio que dependem do dono do produto estão consolidadas em [04-perguntas-abertas.md](./04-perguntas-abertas.md).

---

## 3. Escopo da Primeira Versão (v1)

### 3.1 Dentro da v1
- **Banco de dados unificado `[CONFIRMADO]`**: merge do PR `#95` (`infra/database-aws`) e adoção do `monitoramento_academico.sql` como baseline oficial no Flyway (`V1`), somado a migrações incrementais (`V2`/`V3`) `[PROPOSTA]`.
- **Autenticação e perfis `[CONFIRMADO]`**: login real com senha criptografada (BCrypt) e **JWT Bearer stateless** para **Professor** e **Aluno** (sem perfil Coordenação na v1, seguindo `#67`), com deploy da API Spring Boot na **Amazon EC2** (na mesma VPC do RDS) e **alinhamento HTTPS** entre frontend e backend.
- **Catálogo acadêmico (leitura via API)**: cursos, períodos, turmas, disciplinas ofertadas (`disciplina_turma`) e alunos matriculados na turma.
- **Módulos operacionais do Professor**:
  - Registro, edição e mudança de status de **Aulas** (`#79`–`#81`, `#55`).
  - Lançamento em lote e correção individual de **Frequência** (`#83`–`#85`), com **extensão do banco `[CONFIRMADO]`** para suportar `status_presenca` (incluindo `ATRASO`), `checklist_aula` e `observacao`.
  - Criação/edição/correção de **Avaliações** e lançamento de **Notas** (`#89`–`#93`).
  - Registro e edição de **Comentários Pedagógicos** (`#86`–`#88`) com **extensão do banco `[CONFIRMADO]`** para `checklist_itens`, `acao_acompanhamento`, `visivel_aluno BOOLEAN DEFAULT false` (LGPD) e nova tabela **`plano_acompanhamento`**.
- **Indicadores e Relatórios `[CONFIRMADO]`**:
  - Endpoint `GET /api/v1/indicadores/desempenho` (`#50`, `#94`) calculando taxa de frequência (corte oficial de **75%**, contando `Atraso` como presença e `Falta justificada` como ausência), % de alunos abaixo de 75% e média ponderada de notas, garantindo o critério de aceite do `README.md`.
  - Tela de **Relatórios** (`relatorio.jsx`) mantida na v1 e integrada a `GET /api/v1/relatorios/academico`, com exportação CSV e impressão PDF.
- **Área do Aluno**: painel real em `alunos.jsx` exibindo exclusivamente suas notas, frequência e comentários com `visivel_aluno = true` `[CONFIRMADO]`.
- **Auditoria LGPD e Qualidade**: gravação automática na tabela `auditoria` nas operações de escrita, testes unitários (`#55`), de integração (`#47`, `#56`), de frontend (`#46`), E2E (`#57`), pipeline GitHub Actions (`#45`) e deploy em nuvem integrado.

### 3.2 Fora da v1 (Fica para v2+)
- Perfil e painel de **Coordenação** (`coodernador.jsx`).
- Telas de CRUD administrativo para cadastro de cursos, períodos, turmas, disciplinas e criação de usuários/matrículas (na v1 esses dados permanecem gerenciados via migrações/seeds SQL).
- Gestão de salas físicas e indicador de *taxa de ocupação de salas* (`#50`, `#48`) — **removido definitivamente da v1 `[CONFIRMADO]`**.
- Envio real de e-mails para recuperação de senha (`Login.jsx` exibirá mensagem informando que a redefinição deve ser solicitada à secretaria/suporte).
- Pipeline ETL automatizado para upload de planilhas CSV na UI (`#48`, `#49`).

---

## 4. Ordem Recomendada de Implementação

| Fase | Foco | Atividades Principais | Referência |
|---|---|---|---|
| **Fase 0** | Saneamento e Base | Mergear PR `#95` (`infra/database-aws`); remover `node_modules/` do Git `[PROPOSTA]`; definir versão do Spring Boot/Springdoc; preparar ambiente na **Amazon EC2** (VPC do RDS) com **HTTPS** alinhado ao frontend; criar `.env.example`. | [04-perguntas-abertas.md](./04-perguntas-abertas.md) |
| **Fase 1** | Modelo de Dados | Configurar Flyway com `V1` (baseline `monitoramento_academico.sql`), `V2` (constraints `CHECK`, índices e hashes BCrypt nos seeds) e `V3` (`status_presenca`/`checklist_aula`, extensões em `comentario` com `visivel_aluno`, `plano_acompanhamento` e `professor_disciplina_turma`). | [01-modelo-dados.md](./01-modelo-dados.md) |
| **Fase 2** | Núcleo Backend | Corrigir `Aluno.java` (`record` → `class`); conectar PostgreSQL com `ddl-auto=validate`; implementar `GlobalExceptionHandler` (RFC 7807), Spring Security + **JWT Bearer stateless** + CORS para origem HTTPS, `/api/v1/auth/*` e leitura de estrutura acadêmica (`/cursos`, `/turmas`, `/disciplinas`, `/alunos`, `/periodos`). | [02-backend.md](./02-backend.md) |
| **Fase 3** | Módulos de Negócio API | Implementar Aulas + Frequência, Avaliações + Notas, Comentários + Planos de Acompanhamento, `AuditoriaService`, Indicadores (corte 75%) e Relatórios; escrever testes unitários (`#55`) e de integração (`#47`, `#56`). | [02-backend.md](./02-backend.md) |
| **Fase 4** | Integração Frontend | Instalar `react-router-dom` (`#25`); criar `apiClient.js`, `AuthContext` e `AcademicContext`; migrar telas existentes (incluindo `relatorio.jsx`) de `localStorage` para API; criar página de Avaliações/Notas `[PROPOSTA]` e implementar `PainelAlunoPage`. | [03-frontend.md](./03-frontend.md) |
| **Fase 5** | Testes, CI/CD e Nuvem | Configurar GitHub Actions (`#45`), testes de componentes (`#46`) e E2E (`#57`); atualizar diagramas do `README.md` (`#67`, alinhando ao SQL AWS sem `COORDENADOR`) e dicionário LGPD (`#38`); validar checklist `#40` e publicar backend (EC2) + frontend em HTTPS. | [03-frontend.md](./03-frontend.md) |

---

## 5. Riscos e Premissas Assumidas

| Tipo | Descrição | Impacto | Mitigação |
|---|---|---|---|
| **Risco** | **AWS Academy Learner Lab** (`docs/database-aws.md`, `docs/frontend-s3.md`): sessões expiram periodicamente, CloudFront OAC foi bloqueado e o S3 serve apenas **HTTP**. | Sem alinhamento HTTPS, chamadas do frontend para a EC2 podem sofrer bloqueio de *Mixed Content* nos navegadores e expor JWT em tráfego claro. | **`[CONFIRMADO]`**: usar **JWT** no header `Authorization: Bearer` (evita bloqueio de cookies cross-site) e alinhar **HTTPS** entre frontend (ex.: Vercel/Cloudflare Pages) e backend na **Amazon EC2** (proxy reverso Nginx + TLS). |
| **Risco** | **Versão `4.1.1` do Spring Boot vs `springdoc 2.6.0`** em `backend_spring/build.gradle`. | Falha de inicialização ou erro no `/swagger-ui.html`. | Validar compatibilidade imediatamente na Fase 0 ou alinhar para Spring Boot 3.4.x/3.5.x LTS `[PROPOSTA]`. |
| **Risco** | **Ausência de vínculo `professor ↔ disciplina_turma`** no dump SQL atual. | Sem esse vínculo, o filtro *"Apenas alunos do professor"* (`professor.jsx`) e o controle de permissão de lançamento ficam frágeis. | Criar tabela associativa `professor_disciplina_turma` `[PROPOSTA]` em migração Flyway. |
| **Risco** | **Dados seed com senhas falsas** (`HASH_DE_TESTE_1`..`6` em `monitoramento_academico.sql`) e enums em `lowercase`. | Login real falhará e parsers de `Enum` Java quebrarão sem padronização. | Atualizar seeds via Flyway com hashes BCrypt de desenvolvimento e padronizar enums antes de expor a API. |
| **Premissa** | A versão v1 não terá painel de Coordenação nem cadastro administrativo de cursos/turmas/usuários pela UI (alimentação cadastral via SQL/Flyway). | Reduz drasticamente a superfície de telas e endpoints para cumprir o prazo semestral. | Mantém arquitetura extensível para adicionar `ROLE_ADMIN` / `ROLE_COORDENADOR` na v2. |
| **Premissa** | Os scripts e schema de `origin/infra/database-aws` representam o estado real do banco na AWS. | Evita retrabalho de modelagem e aproveita o RDS já provisionado. | Confirmado pelos logs de validação em `docs/database-aws.md`. |
