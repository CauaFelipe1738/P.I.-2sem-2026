# Documentação técnica — EDULYTICS

## Visão geral

EDULYTICS é um protótipo de painel escolar voltado ao acompanhamento do desempenho
acadêmico. A interface organiza registros de frequência e aprendizagem, apresenta
indicadores derivados desses registros.

O problema abordado é a dispersão de informações sobre participação, presença e
acompanhamento pedagógico. No estado atual, o sistema demonstra esses fluxos no
navegador: não possui servidor, autenticação institucional nem banco de dados remoto.
Os cursos e alunos do catálogo são demonstrativos; os registros criados pelo usuário
ficam no armazenamento local do navegador.

### Funcionalidades implementadas

- Navegação entre Visão geral, Desempenho, Frequência e Aprendizagem.
- Catálogo demonstrativo de cursos e alunos na área do professor.
- Registro, edição e consulta local de chamadas e observações pedagógicas.
- Registro de planos de acompanhamento associados aos dados de aprendizagem.
- Indicadores calculados a partir dos registros locais de frequência e aprendizagem.
- Seleção de perfil na entrada. As áreas de aluno e coordenação são telas
  demonstrativas, sem dados institucionais conectados.

## Tecnologias

| Tecnologia | Uso no projeto |
| --- | --- |
| JavaScript e JSX | Lógica da aplicação e descrição das interfaces React. |
| React 19 | Componentes, estado das telas e atualização da interface. |
| Vite 8 | Servidor de desenvolvimento e processo de build. |
| Tailwind CSS 4 | Classes utilitárias de estilo, processadas pelo plugin do Vite. |
| CSS | Estilos globais, animações do menu e regras específicas da interface. |
| Web Storage API | Persistência local de frequência e aprendizagem no navegador atual. |
| Node.js | Execução dos scripts npm e do teste de normalização. |

As dependências e versões declaradas estão em `package.json` e as versões
resolvidas estão em `package-lock.json`. O projeto não declara biblioteca de
roteamento, cliente HTTP, ORM ou driver de banco de dados.

## Arquitetura e organização

```text
.
├── index.html                  # Documento HTML que hospeda a aplicação
├── src/
│   ├── main.jsx                # Inicialização do React
│   ├── App.jsx                 # Navegação, shell do painel e Visão geral
│   ├── App.css                 # Animações e estilos específicos do shell
│   ├── index.css               # Estilos globais e diretivas do Tailwind
│   ├── assets/                 # Imagens e ícones usados nas telas
│   ├── components/             # Telas e componentes do painel
│   └── data/
│       ├── dadosAcademicos.js  # Catálogo demonstrativo de cursos e alunos
│       ├── academicoStore.js   # Estado compartilhado e persistência local
│       └── academicoStore.test.js # Verificações da normalização dos dados
├── docs/                       # Materiais existentes do projeto
├── package.json                # Scripts e dependências
└── vite.config.js              # Plugins de React e Tailwind para o Vite
```

### Responsabilidades dos módulos

- **`src/main.jsx`** cria a raiz React e monta `App` sob `StrictMode`.
- **`src/App.jsx`** controla as telas de login e seleção de perfil, a navegação do
  painel, a integração com o histórico do navegador, o menu lateral e a Visão geral.
  As páginas do painel são associadas ao menu pelo array `paginas`.
- **`src/components/Login.jsx`** apresenta o formulário de acesso demonstrativo e a
  tela informativa de recuperação de senha. O formulário não autentica usuários.
- **`CatalogoAcademico.jsx` e `professor.jsx`** apresentam o catálogo local e os
  controles de busca, situação, ordenação e paginação de cursos.
- **`frequencia.jsx`** registra chamadas por curso, turma, disciplina, data e aula;
  calcula indicadores e permite corrigir registros.
- **`aprendizagem.jsx`** registra observações pedagógicas e planos, além de permitir
  consultar e editar os registros locais.
- **`desempenho.jsx`** deriva indicadores e alertas dos dados locais disponíveis.
- **`alunos.jsx` e `coodernador.jsx`** são telas demonstrativas sem integração com
  registros acadêmicos.
- **`dadosAcademicos.js`** fornece os cursos e alunos usados pelos formulários e filtros.
- **`academicoStore.js`** centraliza a leitura, normalização, persistência e notificação
  das áreas que usam registros de frequência e aprendizagem.

## Fluxo de funcionamento

1. O Vite serve `index.html`; `src/main.jsx` monta o componente principal React.
2. `App.jsx` inicia na tela de login. O formulário exige e-mail e senha, mas, por não
   existir serviço de autenticação, o avanço é demonstrativo.
3. Após a entrada, a pessoa escolhe um perfil. Professor abre o catálogo; aluno e
   coordenação abrem suas telas demonstrativas.
4. No painel, o menu e os atalhos de teclado alteram a página ativa. `pushState` e
   `popstate` mantêm essa navegação compatível com voltar e avançar do navegador.
5. Os formulários de Frequência e Aprendizagem criam objetos JavaScript e os enviam às
   funções de escrita do `academicoStore.js`.
6. A store atualiza seu snapshot em memória, tenta persistir os registros no
   `localStorage` e notifica os componentes inscritos com `useSyncExternalStore`.
   Mudanças feitas em outra aba são recebidas pelo evento `storage`.
7. Desempenho consulta os registros e calcula resultados na interface.

## Regras e decisões técnicas

- A taxa de presença considera `Presente` e `Atraso` como comparecimento. Ausências
  justificadas são contabilizadas como ausência nos indicadores atuais.
- O alerta de acompanhamento usa o limite demonstrativo de 75% ou a existência de
  registro de dificuldade. Esse limite não representa uma regra institucional e deve
  ser validado pela escola antes de uso real.
- A chamada pode incluir um subconjunto dos alunos do catálogo do curso. A correção
  preserva no histórico local os dados anteriores do registro.
- Observações e planos de aprendizagem compartilham a mesma coleção. A edição guarda
  a versão anterior do objeto no histórico local.
- `normalizeAcademicData` valida a estrutura externa do armazenamento: garante que
  `attendance` e `learning` sejam listas e retorna listas vazias para conteúdo inválido.
- `useSyncExternalStore` compartilha um snapshot entre telas sem introduzir uma
  dependência adicional de gerenciamento de estado.
- `localStorage` foi escolhido para manter o protótipo executável sem infraestrutura
  de servidor. Ele não fornece controle de acesso, sincronização institucional ou
  proteção de dados adequada para informações acadêmicas identificáveis.

## Validações e tratamento de erros

- Campos essenciais dos formulários usam validação nativa do navegador (`required`);
  a senha demonstrativa exige ao menos seis caracteres.
- A leitura do armazenamento trata JSON inválido, estrutura incompleta e exceções do
  navegador, retornando coleções vazias para manter as telas acessíveis.
- Falhas ao gravar no `localStorage` não interrompem a atualização do estado em
  memória, embora os dados não persistam após encerrar a sessão.
- A chamada não é salva se nenhum aluno estiver selecionado.
- O teste em `src/data/academicoStore.test.js` verifica casos de normalização; ele não
  substitui testes de interface ou de integração.

## Como executar

Requisitos: Node.js compatível com as versões declaradas pelo Vite e npm.

```bash
npm install
npm run dev
```

O comando `npm run dev` inicia o servidor local e informa o endereço no terminal.
Para as verificações disponíveis:

```bash
npm test
npm run lint
npm run build
npm run preview
```

`npm run preview` serve a versão gerada pelo build. Não há arquivo `.env` nem serviço
externo obrigatório configurado no repositório.

## Limitações conhecidas e melhorias futuras

- Não há backend, banco de dados, API, autenticação, autorização por perfil ou
  sincronização entre usuários e dispositivos.
- Catálogo, matrículas, professores e alguns números são dados estáticos de
  demonstração; devem ser substituídos por dados institucionais antes de uso real.
- As áreas do aluno e da coordenação ainda não apresentam dados acadêmicos.
- Não há módulo de notas. Por isso, indicadores de médias, aprovação e evolução de
  avaliações não são calculados.
- A persistência local não deve ser usada para armazenar dados pessoais reais sem
  arquitetura de segurança, controle de acesso e política de retenção apropriados.
- A cobertura de testes atual é pequena e não inclui renderização de componentes,
  navegação, acessibilidade automatizada ou fluxos completos no navegador.
- A evolução do protótipo pode incluir backend autenticado, banco de dados,
  autorização por perfil, validação institucional das regras de negócio e testes de
  componentes e integração.
