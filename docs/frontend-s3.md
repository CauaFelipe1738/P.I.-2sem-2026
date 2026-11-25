# Deploy do Frontend — Amazon S3

## 1. Objetivo

Disponibilizar o frontend do sistema Monitoramento Acadêmico na infraestrutura AWS, utilizando hospedagem de site estático no Amazon S3.

## 2. Infraestrutura

- Provedor: AWS Academy Learner Lab.
- Serviço: Amazon S3.
- Região: us-east-1.
- Bucket: monitoramento-academico-frontend-2026.
- Tecnologia: React e Vite.
- Data do deploy: 23/11/2026.
- Endpoint: INSERIR_URL_DO_SITE.

## 3. Processo de build

A partir do repositório da equipe, foram executados os comandos:

`npm ci`

`npm run build`

O processo gerou a pasta `dist`, contendo os arquivos estáticos necessários para a hospedagem.

## 4. Configuração da hospedagem

- Upload do conteúdo da pasta `dist` para a raiz do bucket.
- Ativação da hospedagem de site estático.
- Documento de índice: `index.html`.
- Documento de erro: `index.html`.
- Política de acesso público restrita à leitura dos objetos.
- Bloqueio de acesso público por ACLs.
- Criptografia de armazenamento SSE-S3.

## 5. Validação

A compilação foi concluída com sucesso e o frontend foi acessado pelo navegador através do endpoint do Amazon S3.

A integração com o backend e o banco de dados ainda precisa ser validada.

## 6. Segurança e limitações

A configuração do CloudFront foi tentada, mas não foi concluída devido às restrições de permissões da AWS Academy para criação de Origin Access Control.

Como alternativa, foi utilizada a hospedagem estática do S3, que disponibiliza o site por HTTP.

O ambiente é destinado à demonstração acadêmica e não deve receber credenciais reais ou dados sensíveis enquanto não possuir HTTPS.

A instalação das dependências identificou cinco vulnerabilidades reportadas pelo npm, pendentes de análise.

## 7. Atualização do frontend

Para publicar uma nova versão:

1. Atualizar o código-fonte do repositório.
2. Executar `npm ci`.
3. Executar `npm run build`.
4. Enviar os arquivos atualizados da pasta `dist` ao bucket S3.
5. Validar o funcionamento da nova versão pelo navegador.

## 8. Evidências

Os registros visuais da implantação serão armazenados no diretório `docs/evidencias`.