# 7. Endpoints propostos

Todas as rotas são propostas, usam JSON e ficam sob `/api/v1`. **Público** não
exige login; **Autenticado** exige sessão; **Professor autorizado** também exige
vínculo com o curso ou turma consultados.

## Autenticação

| Método e rota | Finalidade e dados | Acesso |
|---|---|---|
| `POST /auth/login` | Recebe `{email, senha}` e inicia sessão; retorna perfil e dados de sessão. | Público |
| `GET /auth/me` | Retorna ID, nome, e-mail e papel da sessão atual. | Autenticado |
| `POST /auth/logout` | Encerra a sessão atual; sem corpo. | Autenticado |

Senha e hash não devem ser retornados. Credencial inválida deve gerar erro sem
indicar se o e-mail existe.

## Cursos e alunos

| Método e rota | Finalidade e parâmetros | Acesso |
|---|---|---|
| `GET /cursos` | Lista cursos; filtros: `q`, `status`, `page`, `size`, `sort`. | Autenticado |
| `GET /cursos/{id}/alunos` | Lista alunos do curso; filtros: `turmaId`, `q`, `page`, `size`. | Autenticado |

Retornar IDs e nomes necessários à tela. A busca de alunos deve respeitar as
matrículas e turmas visíveis ao usuário. Use paginação nas listas.

## Frequência

| Método e rota | Finalidade e parâmetros | Acesso |
|---|---|---|
| `GET /frequencias` | Consulta chamadas; exige `cursoId`; filtros opcionais: `turmaId`, `disciplinaId`, `alunoId`, `dataInicial`, `dataFinal`, `page`, `size`. | Autenticado |
| `POST /frequencias` | Registra uma aula e a situação dos alunos selecionados. | Professor autorizado |
| `PUT /frequencias/{id}` | Corrige a chamada indicada por `{id}`. | Professor autorizado |

O corpo de criação deve informar `cursoId`, `turmaId`, `disciplinaId`, `dataAula`,
`identificacaoAula` e `registros`, cada um com `alunoId`, `situacao`,
`justificativa` e `checklist`. Exemplo de registro: `{ "alunoId": 101,
"situacao": "FALTA_JUSTIFICADA", "justificativa": "Saúde", "checklist": [] }`.

Aceitar `PRESENTE`, `AUSENTE`, `FALTA_JUSTIFICADA` e `ATRASO`; validar que os
alunos pertencem à turma e não estejam duplicados na chamada. A interface conta
presença e atraso como comparecimento; a escola deve confirmar o tratamento da
falta justificada. Ao editar, registrar autor, data e valores anteriores.

## Observações de aprendizagem

| Método e rota | Finalidade e parâmetros | Acesso |
|---|---|---|
| `GET /observacoes-aprendizagem` | Consulta registros; exige `cursoId`; filtros: `alunoId`, `disciplinaId`, período, `categoria`, `page`, `size`. | Autenticado |
| `POST /observacoes-aprendizagem` | Cria observação para um aluno. | Professor autorizado |
| `PUT /observacoes-aprendizagem/{id}` | Atualiza observação existente. | Professor autorizado |

O corpo inclui `cursoId`, `alunoId`, `disciplinaId`, `data`, `categoria`,
`descricao`, `checklist` e `acaoAcompanhamento`. Exemplo: `{ "cursoId": 1,
"alunoId": 101, "data": "2026-11-18", "categoria": "Dificuldade",
"descricao": "Precisa de apoio no conteúdo", "checklist": [] }`. Identifique o
professor pela sessão, valide seu vínculo e mantenha histórico das edições.

## Planos de acompanhamento

| Método e rota | Finalidade e parâmetros | Acesso |
|---|---|---|
| `GET /planos-acompanhamento` | Lista planos; exige `cursoId`; filtros opcionais: `alunoId`, `status`, `page`, `size`. | Autenticado |
| `POST /planos-acompanhamento` | Cria plano ligado a aluno e professor. | Professor autorizado |
| `PUT /planos-acompanhamento/{id}` | Atualiza plano, prazo, status ou resultado. | Professor autorizado |

Campos do plano: `cursoId`, `alunoId`, `disciplinaId`, `dificuldade`, `objetivo`,
`acao`, `dataInicio`, `dataPrazo`, `status` e `resultado`. Status usados na
interface: `PENDENTE`, `EM_ACOMPANHAMENTO`, `CONCLUIDO`; validar que o prazo não
anteceda o início.

## Indicadores e relatórios

| Método e rota | Finalidade e parâmetros | Acesso |
|---|---|---|
| `GET /indicadores/desempenho` | Retorna indicadores; exige `cursoId`; aceita filtros de turma, disciplina, aluno e período. | Autenticado |
| `GET /relatorios/academico` | Retorna resumo em JSON; exige `cursoId`; aceita categoria e filtros acadêmicos. | Autenticado |

O indicador atual usa 75% como limite demonstrativo e conta `PRESENTE` e
`ATRASO` como comparecimento. Confirmar esse limite com a instituição. A
interface não registra notas; não há cálculo de médias previsto. O relatório
deve indicar o período e os filtros usados; exportação de arquivo não está
prevista.

## Observações rápidas (opcional)

`GET, POST /observacoes-rapidas` só são necessários se houver um fluxo separado
das observações de aprendizagem. A interface atual já oferece esse registro;
definir a diferença antes de implementar para evitar duplicidade.

## Respostas

Usar `200` para consulta, login e edição; `201` para criação; `204` para logout;
`400` para dados inválidos; `401` para sessão ausente; `403` para falta de
permissão; e `404` para recurso inexistente. Erros devem indicar o campo
inválido sem expor detalhes internos do servidor.
