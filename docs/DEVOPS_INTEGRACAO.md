# Integração Frontend/Backend, Testes e Esteira DevOps

> Este documento descreve os contratos HTTP reais (`/api/v1` e `/actuator/health`), o servidor local de contrato, os quality gates automatizados de DevOps, os containers Docker/Nginx e os workflows de CI/CD do **EDULYTICS**.

---

## 1. Fluxos de Integração Disponíveis

### 1.1 Desenvolvimento Frontend + Proxy Vite + Backend Spring Boot
1. Copie `.env.example` para `.env`:
   - `VITE_API_URL=http://localhost:8080`
   - `VITE_API_MODE=http`
2. O arquivo [`vite.config.js`](../vite.config.js) encaminha `/api` e `/actuator` para `VITE_API_URL`.
3. O componente [`AppShell.jsx`](../src/components/layout/AppShell.jsx) consulta `checkApiHealth()` em `GET /actuator/health` e exibe no cabeçalho o estado (`API HTTP · UP`, `API HTTP · DOWN` ou `Mock /api/v1`), permitindo alternar o transporte quando `VITE_API_URL` está configurada.

### 1.2 Servidor HTTP Local de Contrato (`/api/v1`) sem JVM
Quando desejar exercitar a camada `fetch` real (TCP, CORS, `Authorization: Bearer`, `ProblemDetail` RFC 7807) sem subir o Spring Boot:

```bash
npm run api:mock
# Escuta em http://127.0.0.1:8080 com GET /actuator/health e rotas /api/v1/*
```

---

## 2. Suítes Automatizadas de Testes & Quality Gates

| Script | O que valida | Issues relacionadas |
|---|---|---|
| `npm run lint` | Análise estática ESLint 10 (`react-hooks`, `react-refresh`) | `#45` |
| `npm run test:unit` | Cálculos acadêmicos (corte 75%, média ponderada) e `apiClient` (`AbortController`, `ProblemDetail`, `401`) | `#50`, `#99` |
| `npm run test:integration` | Testes em memória + **contrato HTTP real via TCP** (`CORS`, JWT, `409`, `422`, `403`, LGPD `visivelAluno`, healthcheck) | `#47`, `#56` |
| `npm run test:devops` | Varredura de segredos/credenciais, `.env.example`/`.gitignore`, `.github/workflows/ci.yml`, manifestos Docker/Nginx e **Smoke E2E** de `dist/` | `#40`, `#45`, `#57` |
| `npm run test:e2e:backend` | **E2E Full-Stack**: serviços reais `src/services/*.js` contra o JAR Spring Boot em execução (`EDULYTICS_E2E_BACKEND_URL`) | `#47`, `#56`, `#57` |
| `npm test` | Executa todas as suítes em `tests/*.test.js` | `#45`, `#56`, `#57` |

---

## 3. Pipelines CI/CD (GitHub Actions)

1. **[`.github/workflows/ci.yml`](../.github/workflows/ci.yml)** (`Frontend & DevOps CI`): roda `npm ci`, `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run build` e `npm run test:devops` (varredura de segredos, validação de manifestos Docker/Nginx e smoke E2E de `dist/`).
2. **[`.github/workflows/backend-ci.yml`](../.github/workflows/backend-ci.yml)** (`Backend Spring Boot CI`): configura JDK 17 + Gradle 8.13, aplica migrações Flyway `V1`–`V2` com `ddl-auto=validate` e executa `DomainRulesTest` (`#55`), `ApiIntegrationTest` (`MockMvc`, `#47`) e `bootJar`.
3. **[`.github/workflows/fullstack-e2e.yml`](../.github/workflows/fullstack-e2e.yml)** (`Full-Stack E2E Integration`): empacota e inicializa o JAR real do Spring Boot na porta `8080`, aguarda `GET /actuator/health` responder `UP` e executa `npm run test:e2e:backend` exercitando todos os fluxos REST reais ponta a ponta.

---

## 4. Execução via Containers (Docker Compose)

```bash
docker compose up --build
```

- **Banco (`db`)**: PostgreSQL 17 Alpine com healthcheck `pg_isready`.
- **Backend (`backend`)**: Spring Boot na porta `8080` configurado exclusivamente por variáveis de ambiente e healthcheck em `/actuator/health`.
- **Frontend (`frontend`)**: Nginx servido na porta `3000` com fallback SPA (`try_files`) e proxy reverso `/api/` → `http://backend:8080` ([`infra/nginx.conf`](../infra/nginx.conf)).
