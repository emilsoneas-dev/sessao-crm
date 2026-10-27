# Estrutura de pastas

## Raiz

- `README.md`: instrucoes basicas do projeto.
- `package.json`: scripts e dependencias.
- `index.html`: entrada do Vite.
- `vercel.json`: configuracao de deploy.
- `.env.example`: variaveis esperadas para Supabase.

## `src`

- `src/main.jsx`: ponto de entrada React.
- `src/app/App.jsx`: autenticacao e bootstrap do CRM.
- `src/assets`: imagens e estilos globais.
- `src/components`: componentes compartilhados.
- `src/config`: configuracoes de permissoes e Kanban.
- `src/hooks`: hooks compartilhados.
- `src/modules`: modulos de negocio.
- `src/services`: servicos globais.
- `src/utils`: utilitarios.

## `src/modules`

- `auth`: login, criacao de senha, consulta de usuario e permissoes.
- `clients`: carteira de clientes, Kanban e modal de ficha.
- `documents`: central de links.
- `finance`: financeiro e analises.
- `hr`: recursos humanos.
- `leads`: funil, cards e modais de leads.
- `overview`: visao geral.
- `settings`: configuracoes de usuarios e permissoes.
- `tasks`: tarefas, calendario, recorrentes e arquivadas.

## `supabase`

- `supabase/config.toml`: configuracao local do Supabase.
- `supabase/migrations`: migrations SQL.
- `supabase/functions/create-crm-user`: funcao para criar usuario/convite.

## Observacoes

- A pasta `outputs` existe, mas nao foi identificada como parte do fluxo principal do app.
- A pasta `work` existe, mas nao foi identificada como parte do fluxo principal do app.
- Existe `src/assets/styles/globalll.css`, mas o arquivo usado em `main.jsx` precisa ser confirmado antes de qualquer limpeza.
