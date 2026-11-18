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
