# [Desafios relacionados ao Monitoramento do Desempenho Acadêmico de Estudantes](https://plataforma.gpinovacao.senai.br/plataforma/demandas-da-industria/interna/12430)

## Proposta
Muitas plataformas educacionais empregadas em escolas se limitam a registar dados referentes a notas e frequência de alunos. Este projeto é uma plataforma que propõe incluir outras informações valiosas como comportamento e evolução do desempenho para tomada de decisões pedagógicas personalizadas e aprimorar a eficiência dos professores otimizando um trabalho anteriormente manual.
Essa plataforma tem como público-alvo principalmente os docentes, embora possa ser utilizado adicionalmente por alunos para que possam acessar suas próprias informações.

## Arquitetura

### Diagrama de Entidade-Relacionamento
```mermaid
erDiagram
  USUARIO ||--o{ AUDITORIA : "gera"
  USUARIO ||--o| PROFESSOR : "é"
  USUARIO |o--o| ALUNO : "é"
  USUARIO ||--o| COORDENADOR : "é"
  CURSO ||--o{ TURMA : "tem"
  TURMA ||--o{ DISCIPLINA_TURMA : "oferta"
  DISCIPLINA ||--o{ DISCIPLINA_TURMA : "é ofertada"
  DISCIPLINA_TURMA ||--o{ AULA : "possui"
  PROFESSOR ||--o{ AULA : "ministra"
  AULA ||--o{ FREQUENCIA : "registra"
  ALUNO ||--o{ FREQUENCIA : "tem"
  DISCIPLINA_TURMA ||--o{ AVALIACAO : "possui"
  PROFESSOR ||--o{ AVALIACAO : "aplica"
  AVALIACAO ||--o{ ALUNO_AVALIACAO : "gera nota"
  ALUNO ||--o{ ALUNO_AVALIACAO : "recebe"
  ALUNO ||--o{ COMENTARIO : "recebe"
  PROFESSOR ||--o{ COMENTARIO : "escreve"
  DISCIPLINA_TURMA |o--o{ COMENTARIO : "contexto"

  USUARIO {
    int id_usuario PK
    varchar email UK
    varchar senha_hash
    timestamp data_criacao
    timestamp ultimo_acesso
    boolean ativo
  }
  AUDITORIA {
    bigint id_auditoria PK
    int id_usuario FK
    varchar tabela_modificada
    varchar operacao
    jsonb dados_anteriores
    jsonb dados_novos
    timestamp timestamp
    varchar endereco_ip
  }
  PROFESSOR {
    int id_professor PK
    int id_usuario FK
    varchar nome_completo
    date data_contratacao
    varchar formacao
  }
  ALUNO {
    int id_aluno PK
    int id_usuario FK
    varchar nome_completo
    date data_nascimento
    date data_ingresso
    date data_desligamento
    varchar status_matricula 
    varchar matricula_escolar UK
  }

  COORDENADOR {
    int id_coordenador PK
    int id_usuario FK
    varchar nome_completo
    varchar escopo_responsabilidade
  }
  CURSO {
    int id_curso PK
    varchar nome_curso UK
    text descricao
    int carga_horaria
    varchar status
  }

  TURMA {
    int id_turma PK
    int id_curso FK
     int semestre
    date data_inicio
    date data_fim
    varchar nome_turma
    varchar turno
  }
  DISCIPLINA {
    int id_disciplina PK
    varchar nome_disciplina UK
    text descricao
    int carga_horaria
  }
  DISCIPLINA_TURMA {
    int id_disciplina_turma PK
    int id_disciplina FK
    int id_turma FK
  }
  AULA {
    int id_aula PK
    int id_disciplina_turma FK
    int id_professor FK
    date data_aula
    time horario_inicio
    time horario_fim
    text conteudo
    varchar status
  }
  FREQUENCIA {
    int id_frequencia PK
    int id_aula FK
    int id_aluno FK
    boolean presente
    text justificativa
    timestamp data_registro
  }
  AVALIACAO {
    int id_avaliacao PK
    int id_disciplina_turma FK
    int id_professor FK
    varchar nome_avaliacao
    varchar tipo_avaliacao
    date data_avaliacao
    decimal valor_total
    decimal peso
    varchar status
  }
  ALUNO_AVALIACAO {
    int id_aluno_avaliacao PK
    int id_aluno FK
    int id_avaliacao FK
    decimal nota
    text observacao
    timestamp data_registro
  }
  COMENTARIO {
    int id_comentario PK
    int id_aluno FK
    int id_professor FK
    int id_disciplina_turma FK
    varchar titulo
    varchar tipo
    varchar classificacao
    text descricao
    timestamp data_comentario
  }
```
### Diagrama de Classes
```mermaid
classDiagram
  direction TB

  class Usuario {
    -Long id
    -String email
    -String senhaHash
    -LocalDateTime dataCriacao
    -LocalDateTime ultimoAcesso
    -Boolean ativo
    +registrarAcesso() void
  }
  class Auditoria {
    -Long id
    -String tabelaModificada
    -Operacao operacao
    -Map~String,Object~ dadosAnteriores
    -Map~String,Object~ dadosNovos
    -LocalDateTime timestamp
    -String enderecoIp
  }
  class Professor {
    -Long id
    -String nomeCompleto
    -LocalDate dataContratacao
    -String formacao
  }
  class Aluno {
    -Long id
    -String nomeCompleto
    -LocalDate dataNascimento
    -LocalDate dataIngresso
    -String matriculaEscolar
    -LocalDate dataDesligamento
    -StatusMatricula status
    +concluir() void
    +cancelar() void
    +trancar() void
  }
  class Coordenador {
    -Long id
    -String nomeCompleto
    -String escopoResponsabilidade
  }
  class Curso {
    -Long id
    -String nome
    -String descricao
    -Integer cargaHoraria
    -StatusCurso status
  }

  class Turma {
    -Long id
    -String nome
    -Turno turno
    -Integer semestre
    -LocalDate dataInicio
    -LocalDate dataFim
  }
  class Disciplina {
    -Long id
    -String nome
    -String descricao
    -Integer cargaHoraria
  }
  class DisciplinaTurma {
    -Long id
  }
  class Aula {
    -Long id
    -LocalDate data
    -LocalTime horarioInicio
    -LocalTime horarioFim
    -String conteudo
    -StatusAula status
    +realizar() void
    +cancelar() void
  }
  class Frequencia {
    -Long id
    -Boolean presente
    -String justificativa
    -LocalDateTime dataRegistro
  }
  class Avaliacao {
    -Long id
    -String nome
    -TipoAvaliacao tipo
    -String descricao
    -LocalDate data
    -BigDecimal valorTotal
    -BigDecimal peso
    -StatusAvaliacao status
    +corrigir() void
  }
  class AlunoAvaliacao {
    -Long id
    -BigDecimal nota
    -String observacao
    -LocalDateTime dataRegistro
  }
  class Comentario {
    -Long id
    -String titulo
    -TipoComentario tipo
    -ClassificacaoComentario classificacao
    -String descricao
    -LocalDateTime dataComentario
  }

  Usuario "*" --> "1" Cargo : cargo
  Auditoria "*" --> "0..1" Usuario : usuario
  Professor "1" --> "1" Usuario : usuario
  Coordenador "1" --> "1" Usuario : usuario
  Aluno "1" --> "0..1" Usuario : usuario

  Turma "*" --> "1" Curso : curso
  Turma "*" --> "1" Periodo : periodo
  DisciplinaTurma "*" --> "1" Disciplina : disciplina
  DisciplinaTurma "*" --> "1" Turma : turma

  Aula "*" --> "1" DisciplinaTurma : disciplinaTurma
  Aula "*" --> "1" Professor : professor
  Frequencia "*" --> "1" Aula : aula
  Frequencia "*" --> "1" Aluno : aluno

  Avaliacao "*" --> "1" DisciplinaTurma : disciplinaTurma
  Avaliacao "*" --> "1" Professor : professor
  Avaliacao "*" --> "1" Periodo : periodo
  AlunoAvaliacao "*" --> "1" Aluno : aluno
  AlunoAvaliacao "*" --> "1" Avaliacao : avaliacao

  Comentario "*" --> "1" Aluno : aluno
  Comentario "*" --> "1" Professor : professor
  Comentario "*" --> "0..1" DisciplinaTurma : disciplinaTurma
```

```mermaid
classDiagram
  direction TB
  class Operacao { <> INSERT UPDATE DELETE }
  class StatusCurso { <> ATIVO INATIVO SUSPENSO }
  class Turno { <> MANHA TARDE NOITE }
  class StatusAula { <> PLANEJADA REALIZADA CANCELADA }
  class TipoAvaliacao { <> PROVA TRABALHO SEMINARIO CONTINUA }
  class StatusAvaliacao { <> PLANEJADA REALIZADA CORRIGIDA }
  class TipoComentario { <> COMPORTAMENTO DESEMPENHO SAUDE SOCIAL }
  class ClassificacaoComentario { <> POSITIVO NEUTRO NEGATIVO }
  class StatusMatricula { <> ATIVA CONCLUIDA CANCELADA TRANCADA }
```

Usuario.registrarAcesso() atualiza ultimoAcesso.
Aluno.concluir(), cancelar() e trancar() controlam as transições de status e a dataDesligamento.
Aula.realizar() e cancelar() mudam o status da aula.
Avaliacao.corrigir() muda o status para CORRIGIDA.
Periodo.estaVigente() compara a data atual com dataInicio e dataFim.

### Critérios de Aceite
- A plataforma permite selecionar turma e uma disciplina e exibe pelo menos dois indicadores calculados a partir dos dados coletados.
- A plataforma consegue registrar dados que são guardado em um banco de dados usando integração por APIs
- A plataforma deve estar posta em um serviço de nuvem para acesso remoto
- Cada alteração de código enviada é testada automaticamente
- O projeto está versionado promovendo a organização do projeto e sua rastreabilidade.

## Solução Proposta
*Link do site implementado*

*Imagens/Prints da plataforma mostrando os dados e funcionamento