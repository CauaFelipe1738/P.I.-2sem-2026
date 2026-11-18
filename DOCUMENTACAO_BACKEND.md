# 7. Endpoints propostos conforme o DER

Rotas propostas sob `/api/v1`, com JSON. **Público** não exige login;
**Autenticado** exige sessão; **Professor** exige usuário associado a `PROFESSOR`
e autorizado para a aula ou disciplina. O perfil vem da relação de `USUARIO` com
`PROFESSOR`, `ALUNO` ou `COORDENADOR`.

## Autenticação e usuários

| Método e rota | Uso e dados | Acesso |
|---|---|---|
| `POST /api/v1/auth/login` | Recebe `email` e senha; valida `USUARIO` e inicia sessão. | Público |
| `GET /api/v1/auth/me` | Retorna `id_usuario`, e-mail, perfil relacionado e dados básicos do perfil. | Autenticado |
| `POST /api/v1/auth/logout` | Encerra a sessão atual. | Autenticado |
| `GET /api/v1/alunos` | Lista alunos; aceita busca e paginação. Campos conforme `ALUNO`. | Autenticado |

Não retornar `senha_hash`. Credencial inválida não deve revelar se o e-mail existe.
O DER não relaciona `ALUNO` com `TURMA` ou `CURSO`; portanto, ainda não é possível
filtrar a lista de alunos por matrícula/turma nem montar a chamada da turma. Para
isso, é necessária uma relação de matrícula no modelo.

## Estrutura acadêmica

| Método e rota | Uso e relacionamento | Acesso |
|---|---|---|
| `GET /api/v1/cursos` | Lista `CURSO`; filtros sugeridos: `status`, `q`, `page`, `size`. | Autenticado |
| `GET /api/v1/cursos/{id}/turmas` | Lista `TURMA` pelo `id_curso`. | Autenticado |
| `GET /api/v1/turmas/{id}/disciplinas` | Lista `DISCIPLINA_TURMA` e os dados de `DISCIPLINA` da turma. | Autenticado |

Os IDs retornados devem corresponder às chaves do DER (`id_curso`, `id_turma`,
`id_disciplina_turma`). A relação da disciplina com a aula é feita por
`id_disciplina_turma`, não diretamente por curso.

## Aulas e frequência

| Método e rota | Uso e dados | Acesso |
|---|---|---|
| `GET /api/v1/aulas` | Lista `AULA`; filtra por `disciplinaTurmaId`, `professorId` e período. | Autenticado |
| `POST /api/v1/aulas` | Cria aula com `disciplinaTurmaId`, datas/horários, conteúdo e status; professor vem da sessão. | Professor |
| `PUT /api/v1/aulas/{id}` | Atualiza os campos de `AULA`, inclusive status. | Professor da aula |
| `GET /api/v1/aulas/{id}/frequencias` | Lista `FREQUENCIA` da aula, com dados básicos dos alunos. | Autenticado |
| `POST /api/v1/aulas/{id}/frequencias` | Registra a frequência de vários alunos naquela aula. | Professor da aula |
| `PUT /api/v1/frequencias/{id}` | Corrige um registro individual de `FREQUENCIA`. `{id}` é `id_frequencia`. | Professor da aula |

Para criar uma aula, o corpo corresponde aos campos de `AULA`: `disciplinaTurmaId`,
`dataAula`, `horarioInicio`, `horarioFim`, `conteudo` e `status`. O `id_professor`
deve ser obtido da sessão autenticada.

O POST de frequência recebe uma lista como `[{"alunoId": 12, "presente": false,
"justificativa": "Saúde"}]`. Cada item cria uma linha em `FREQUENCIA`, ligada a
`id_aula` e `id_aluno`; rejeitar alunos repetidos na mesma aula. O modelo registra
presença com `presente` booleano e texto em `justificativa`. Assim, ausência
justificada pode ser representada por `presente: false` com justificativa, mas o
DER não diferencia atraso de presença. Para registrar atraso como estado próprio,
o campo/tabela precisa ser ampliado.

## Comentários pedagógicos

| Método e rota | Uso e campos | Acesso |
|---|---|---|
| `GET /api/v1/comentarios` | Lista `COMENTARIO`; filtros: `alunoId`, `professorId`, `disciplinaTurmaId`, `tipo`, `classificacao` e período. | Autenticado |
| `POST /api/v1/comentarios` | Cria comentário para aluno; recebe `alunoId`, `disciplinaTurmaId` opcional, `titulo`, `tipo`, `classificacao` e `descricao`. | Professor |
| `PUT /api/v1/comentarios/{id}` | Atualiza comentário identificado por `id_comentario`. | Professor autor |

O `professorId` e `dataComentario` devem vir da sessão/servidor. `tipo` pode usar
`COMPORTAMENTO`, `DESEMPENHO`, `SAUDE` ou `SOCIAL`; `classificacao` pode usar
`POSITIVO`, `NEUTRO` ou `NEGATIVO`, conforme o diagrama de classes. O vínculo com
`DISCIPLINA_TURMA` é opcional no DER. O histórico de auditoria pode ser registrado
em `AUDITORIA`.

O DER não possui entidade de plano de acompanhamento nem campos de checklist ou
ação pedagógica. Por isso, este contrato não inclui rotas de planos ou observações
rápidas separadas; esses dados exigem alteração do modelo antes de serem salvos.

## Avaliações e notas

| Método e rota | Uso e campos | Acesso |
|---|---|---|
| `GET /api/v1/avaliacoes` | Lista `AVALIACAO`; filtra por `disciplinaTurmaId`, `professorId` e período. | Autenticado |
| `POST /api/v1/avaliacoes` | Cria avaliação com `disciplinaTurmaId`, `nomeAvaliacao`, `tipoAvaliacao`, `dataAvaliacao`, `valorTotal`, `peso` e `status`; professor vem da sessão. | Professor |
| `PUT /api/v1/avaliacoes/{id}` | Atualiza dados da avaliação. | Professor responsável |
| `GET /api/v1/avaliacoes/{id}/notas` | Lista `ALUNO_AVALIACAO` da avaliação. | Autenticado |
| `PUT /api/v1/avaliacoes/{id}/notas/{alunoId}` | Registra ou corrige nota e observação do aluno. | Professor responsável |

Cada nota relaciona `id_aluno` e `id_avaliacao` e contém `nota`, `observacao` e
`data_registro`. Validar nota entre zero e `valor_total`; a regra de peso e cálculo
de média precisa ser definida pelo projeto.

## Indicadores e relatório

| Método e rota | Uso e parâmetros | Acesso |
|---|---|---|
| `GET /api/v1/indicadores/desempenho` | Agrega frequência e, quando houver notas, avaliações; filtros: curso, turma, disciplina, aluno e período. | Autenticado |
| `GET /api/v1/relatorios/academico` | Retorna resumo em JSON com período e filtros aplicados. | Autenticado |

Frequência deve ser calculada a partir de `FREQUENCIA.presente`; notas vêm de
`ALUNO_AVALIACAO.nota`. O limite demonstrativo de 75% não está definido no DER e
precisa ser confirmado antes de virar regra oficial.

## Respostas

Usar `200` para consulta/edição, `201` para criação e `204` para logout; `400`
para dados inválidos, `401` para sessão ausente, `403` para falta de permissão e
`404` para recurso inexistente. Erros não devem expor senha, SQL ou detalhes
internos.
