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
| `npm test` | Executa todas as suítes em `tests/*.test.js` | `#45`, `#56`, `#57` |

---

## 3. Pipeline CI/CD (GitHub Actions)

O workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) é disparado em `push` e `pull_request` para `develop` e `main`:
1. **`frontend-quality`**: instala dependências (`npm ci`), roda `npm run lint`, `npm run test:unit`, `npm run test:integration`, gera `npm run build` e publica o artefato `dist/`.
2. **`devops-and-e2e-smoke`**: baixa `dist/` e executa `npm run test:devops`, garantindo que nenhuma credencial esteja exposta, que os manifestos de infraestrutura estejam íntegros e que o bundle de produção sirva as rotas SPA (`/`, `/login`, `/professor/frequencia`, `/aluno`) com HTTP `200`.

---

## 4. Execução via Containers (Docker Compose)

```bash
docker compose up --build
```

- **Banco (`db`)**: PostgreSQL 17 Alpine com healthcheck `pg_isready`.
- **Backend (`backend`)**: Spring Boot na porta `8080` configurado exclusivamente por variáveis de ambiente e healthcheck em `/actuator/health`.
- **Frontend (`frontend`)**: Nginx servido na porta `3000` com fallback SPA (`try_files`) e proxy reverso `/api/` → `http://backend:8080` ([`infra/nginx.conf`](../infra/nginx.conf)).
