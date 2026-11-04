// Catálogo demonstrativo já utilizado na área do professor; ainda não vem de uma API.
export const cursos = [
  { id: 1, nome: 'Desenvolvimento Web', descricao: 'Aprenda a criar aplicações web modernas com HTML, CSS, JavaScript, React e Tailwind.', status: 'Em andamento', alunos: 12, carga: '80h', professor: 'Lucas Ferreira' },
  { id: 2, nome: 'Python para Iniciantes', descricao: 'Introdução à linguagem Python, com foco em lógica de programação e projetos práticos.', status: 'Em breve', alunos: 8, carga: '60h', professor: 'Ana Souza' },
  { id: 3, nome: 'Banco de Dados', descricao: 'Aprenda a modelar, criar e gerenciar bancos de dados com SQL e PostgreSQL.', status: 'Em andamento', alunos: 8, carga: '60h', professor: 'Carlos Mendes' },
  { id: 4, nome: 'Computação em Nuvem', descricao: 'Entenda os conceitos de cloud computing e aprenda a usar as principais plataformas.', status: 'Concluído', alunos: 15, carga: '40h' },
  { id: 5, nome: 'Ciência de Dados', descricao: 'Explore análise de dados, visualização e machine learning com Python.', status: 'Em andamento', alunos: 10, carga: '100h', professor: 'Rafael Costa' },
  { id: 6, nome: 'Desenvolvimento Mobile', descricao: 'Crie aplicações móveis nativas e multiplataforma com React Native.', status: 'Em breve', alunos: 0, carga: '70h' },
]

// Nomes locais do protótipo que formam a lista de alunos exibida em cada curso.
const nomesAlunos = ['Lucas Almeida', 'Mariana Santos', 'Felipe Oliveira', 'Beatriz Costa', 'Rafael Pereira', 'Camila Rodrigues', 'Pedro Martins', 'Ana Clara Souza', 'João Pedro Lima', 'Isabela Ferreira', 'Gabriel Rocha', 'Laura Mendes', 'Matheus Carvalho', 'Sofia Ribeiro', 'Enzo Martins']
export const alunos = cursos.flatMap((curso, indiceCurso) => nomesAlunos.slice(0, curso.alunos).map((nome, indice) => ({ nome, curso: curso.nome, inicial: nome.split(' ').map((parte) => parte[0]).join('').slice(0, 2), id: `${indiceCurso}-${indice}` })))
