# EDULYTICS — Requisitos do back-end

## 1. Apresentação
Protótipo escolar com cursos, frequência, acompanhamento da aprendizagem, indicadores e relatórios. Este documento resume o suporte necessário para conectar a interface a uma API e banco de dados.

## 2. Tecnologias identificadas
- Front-end: React 19, JavaScript/JSX, Vite 8, Tailwind CSS 4.
- Back-end iniciado: Java 17, Spring Boot 4.1.1, Spring MVC/JPA/Security; banco H2 em memória, não persistente.
- O React não faz chamadas HTTP. O Spring declara `GET /alunos` (retorna lista sem metadados de paginação), mas não há integração com a interface nem autenticação própria configurada.

## 3. Visão geral das funcionalidades
| Funcionalidade | Estado atual | Necessidade |
|---|---|---|
| Login/perfis | Demonstrativos; qualquer perfil é selecionável. | Autenticar e autorizar. |
| Cursos/alunos | Dados estáticos. | Consultar cadastros e matrículas reais. |
| Frequência/aprendizagem | Criar/editar e salvar em `localStorage`. | Persistir e consultar pela API. |
| Visão geral | Dados demonstrativos; observações rápidas só na sessão. | Consultar dados reais e decidir se persiste/unifica observações. |
| Desempenho/relatórios | Cálculo local, CSV/impressão no navegador. | Dados filtrados; exportação no servidor opcional. |
| Recuperação de senha | Mensagem sem integração. | Implementar se aprovada. |
| Área do aluno/coordenação | Placeholders sem ações acadêmicas. | Requisitos não definidos. |

## 4. Páginas e necessidades
- Login: e-mail e senha; lembrar e-mail é opcional. Perfil escolhido hoje não autentica.
- Cursos: busca, situação, ordenação, paginação e lista de alunos.
- Visão geral: curso, indicadores e observação rápida (aluno, turma, dimensão, descrição, próximo passo); registro não persiste.
- Frequência: chamada por curso/turma/disciplina/data/aula e status/checklist por aluno; permite editar.
- Aprendizagem: observações e planos por aluno; permite editar observações.
- Desempenho/Relatórios: filtros por curso, turma, disciplina, aluno e mês; não há notas. CSV/PDF são locais.

## 5. Requisitos funcionais
- Login: receber e-mail/senha (UI exige senha de 6+ caracteres), validar conta e retornar usuário/perfil; cadastro público não existe.
- Cursos/alunos: listar com filtros/paginação; totais e IDs atuais são mocks, não oficiais.
- Frequência: criar/listar/editar chamada e entradas. Campos: curso, turma, disciplina, data, aula, aluno, status, justificativa, checklist e observação.
- Aprendizagem: criar/listar/editar registro com curso, aluno, disciplina, data, categoria, checklist, descrição e ação; autor vem da sessão.
- Planos: criar/listar/atualizar dificuldade, objetivo, ação, início, prazo, situação e resultado opcional.
- Observação rápida: se mantida, persistir aluno/curso/turma/data/dimensão/descrição/próximo passo; hoje usa nome livre e estado temporário.
- Indicadores/relatórios: fornecer dados filtrados de frequência e aprendizagem; não inventar notas ou médias.
- Não há interface para excluir, cadastrar cursos/alunos, lançar notas ou enviar arquivos.

## 6. Requisitos não funcionais
API JSON `/api/v1`, HTTPS, banco persistente e migrações; validar entradas e permissões no servidor; limitar paginação, configurar CORS restrito, datas `YYYY-MM-DD`/mês `YYYY-MM`, definir timezone, proteger dados escolares e auditar alterações conforme política. Não guardar senhas/tokens em `localStorage`.

## 7. Endpoints propostos
Todas as rotas abaixo são propostas. `A` = autenticado e autorizado; `P` = público.
| Método/rota | Parâmetros ou corpo | Acesso |
|---|---|---|
| `POST /api/v1/auth/login` | `{email, senha}` | P |
| `GET /api/v1/auth/me`; `POST /api/v1/auth/logout` | Sem corpo | A |
| `GET /api/v1/cursos` | `q,status,page,size,sort` | A |
| `GET /api/v1/cursos/{id}/alunos` | `turmaId,q,page,size` | A |
| `GET /api/v1/frequencias` | `cursoId` obrigatório; turma/disciplina/aluno/período/página opcionais | A |
| `POST /api/v1/frequencias`; `PUT /api/v1/frequencias/{id}` | Chamada e lista de alunos/status/checklist | Professor autorizado |
| `GET /api/v1/observacoes-aprendizagem` | `cursoId` obrigatório; aluno/disciplina/período/categoria | A |
| `POST /api/v1/observacoes-aprendizagem`; `PUT /api/v1/observacoes-aprendizagem/{id}` | Registro pedagógico | Professor autorizado |
| `GET /api/v1/planos-acompanhamento`; `POST /api/v1/planos-acompanhamento`; `PUT /api/v1/planos-acompanhamento/{id}` | Curso/aluno/status; campos do plano | A; escrita por professor |
| `GET, POST /api/v1/observacoes-rapidas` | Curso/filtros; criação conforme seção 5 | A; se mantida |
| `GET /api/v1/indicadores/desempenho` | `cursoId` e filtros acadêmicos | A |
| `GET /api/v1/relatorios/academico` | `cursoId`, categoria e filtros acadêmicos | A |

Sucesso: `200` em consulta/login/edição, `201` em criação, `204` em logout. Não propor cadastro, exclusão ou exportação no servidor sem decisão; a UI não os oferece.

## 8. Exemplos JSON
`POST /api/v1/frequencias` (resposta `201` contém `id`, chamada, alunos, autor e timestamps):
```json
{"cursoId":"cur_01","turmaId":"tur_09a","disciplinaId":"dis_web","data":"2026-11-18","aula":"Aula 3 - 08:00","alunos":[{"alunoId":"alu_01","status":"Presente","checklist":["Participou da aula"]},{"alunoId":"alu_02","status":"Falta justificada","justificativa":"Atestado"}]}
```
Observação: `POST /api/v1/observacoes-aprendizagem` recebe `{cursoId, alunoId, disciplinaId, data, categoria, checklist, descricao, acaoAcompanhamento}`; resposta `201` acrescenta `id`, `autor` e timestamps.

Erro comum: `{"status":400,"code":"VALIDATION_ERROR","detail":"Revise os campos.","errors":[{"field":"alunos","message":"Informe ao menos um aluno."}]}`. Outros status: `401` não autenticado, `403` sem permissão, `404` não encontrado, `409` conflito, `500` falha interna.

## 9. Modelagem de dados proposta
| Tabela | Campos e chaves principais |
|---|---|
| `usuario`, `papel`, `usuario_papel` | E-mail único, hash de senha, ativo; papéis N:N. |
| `aluno`, `professor`, `coordenador` | Perfil e vínculo opcional/obrigatório com usuário; matrícula única se informada. |
| `curso`, `turma`, `disciplina`, `matricula`, `turma_disciplina` | Catálogo e vínculos de alunos, cursos, turmas, disciplinas e professores. |
| `chamada`, `frequencia_aluno`, `frequencia_checklist` | Data/aula; chamada ligada a alunos; aluno único por chamada; status e checklist. |
| `observacao_aprendizagem`, `observacao_checklist` | Curso/aluno/disciplina opcional/data/categoria/descrição/ação/autor/checklist. |
| `plano_acompanhamento` | Curso/aluno/disciplina opcional, dificuldade, objetivo, ação, datas, situação, resultado e autor. |
| `observacao_rapida` (opcional), `auditoria` | Observações se mantidas; trilha de alterações conforme política. |

Usar IDs persistentes (UUID ou padrão escolhido), FKs e timestamps. Unicidade da matrícula e quantidade de planos por aluno precisam ser decididas.

## 10. Relacionamentos
Usuário ↔ papéis; aluno ↔ curso via matrícula; curso → turma; turma ↔ disciplina via oferta; chamada → entradas → alunos; aluno → observações/planos. Validar integridade e escopo de acesso em toda operação.

## 11. Regras de negócio
- Frequência: `Presente`, `Ausente`, `Falta justificada`, `Atraso`; presente e atraso contam como presença no protótipo; chamada exige ao menos um aluno.
- Aprendizagem: descrição, aluno e data obrigatórios. Categorias: `Desenvolvimento de habilidade`, `Dificuldade`, `Participação`, `Evolução`, `Necessita de reforço`.
- Plano exige dificuldade, objetivo, ação, início e prazo; resultado opcional. Status: `Pendente`, `Em acompanhamento`, `Concluído`.
- Checklists são fixos no código; frequência: participação, atividades, grupo, dificuldade, acompanhamento e entrega. Aprendizagem: compreensão, autonomia, auxílio, evolução, participação, dificuldade e habilidade.
- Alerta de frequência <75% é demonstrativo e precisa de validação institucional. Dimensões rápidas: participação, engajamento, colaboração, autonomia, compreensão e estratégias.
- Não há exclusão na UI. Definir edição de registros antigos, auditoria e retenção.

## 12. Autenticação e segurança
Preferir sessão em cookie `HttpOnly`, `Secure`, `SameSite` e CSRF configurado; ou documentar expiração/renovação/revogação de tokens sem `localStorage`. Hash apropriado de senha. Papéis e escopos vêm do servidor; perfil visual não concede acesso. Restringir CORS e minimizar dados pessoais.

## 13. Validações e erros
Validar credenciais, enumerações, datas, tamanhos, FKs, permissões e matrícula na turma; impedir aluno duplicado na chamada. Recomenda-se prazo ≥ início (confirmar). Padronizar respostas de erro; nunca expor stack trace, SQL ou dados sensíveis.

## 14. Dependências
Autenticação → cadastros acadêmicos → frequência/aprendizagem/planos → indicadores/relatórios. IDs locais são demonstrativos: não migrá-los para cadastros reais sem correspondência validada.

## 15. Checklist do back-end
- [ ] Definir contrato, banco persistente, migrações, CORS e erros.
- [ ] Implementar autenticação, provisionamento e autorização por papel/escopo.
- [ ] Disponibilizar cursos, turmas, disciplinas, matrículas e alunos.
- [ ] Implementar consulta/criação/edição de frequência, observações e planos.
- [ ] Decidir observações rápidas e histórico/auditoria.
- [ ] Fornecer indicadores/relatórios e conectar o front-end; validar permissões e contratos.

## 16. Decisões pendentes
1. Provisionamento de usuários, múltiplos perfis e recuperação de senha.
2. Uma ou várias instituições? Quem mantém cursos, turmas, disciplinas e matrículas?
3. Planos múltiplos por aluno? Qual a regra oficial de presença e do alerta de 75%?
4. Unificar observações rápidas? Quem pode editar/excluir e qual histórico reter?
5. CSV/PDF local ou no servidor? Descartar mocks ou importar dados reais?

**Analisados:** componentes React, `src/data/*`, CSS, `package.json` e fontes/configuração de `backend_spring/`.
