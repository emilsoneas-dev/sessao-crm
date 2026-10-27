# Arquitetura

## Camada de aplicacao

- `src/main.jsx` monta o React.
- `src/app/App.jsx` controla autenticacao, sessao, usuario do CRM e erro de acesso.
- `CRMLeadsPage.jsx` recebe sessao, usuario e permissoes; depois renderiza layout e pagina ativa.

## Camada de layout

- `Sidebar.jsx`: menu lateral, grupos recolhiveis e controle de acesso por pagina.
- `Topbar.jsx`: titulo, subtitulo, alternancia de tema, notificacoes financeiras, total de registros e menu de conta.
- `UserAccountMenu.jsx`: dropdown de conta, perfil, configuracoes e sair.
- `LogoManager.jsx`: logo do CRM, com persistencia local.

## Camada de modulos

Cada modulo fica em `src/modules/<modulo>`.

- `auth`: login, senha e servicos de usuario/permissao.
- `leads`: funil comercial e servico de leads/clientes.
- `clients`: carteira e ficha do cliente.
- `tasks`: tarefas, calendario, recorrentes e arquivadas.
- `finance`: analise financeira por tarefas.
- `overview`: visao geral estrategica e operacional.
- `documents`: links/documentos por cliente.
- `settings`: usuarios, convites e permissoes.
- `hr`: recursos humanos.

## Camada de dados

- `supabaseClient.js` cria o cliente Supabase.
- Servicos por modulo fazem leitura/escrita direta em tabelas.
- Edge Function `create-crm-user` cria usuarios/convites.
- Migrations SQL definem tabelas, indices, RLS e funcoes auxiliares.

## Navegacao

A navegacao e manual:

- `getPageFromPath()` le o caminho atual.
- `handleNavigate()` altera estado e `window.history.pushState`.
- `popstate` sincroniza o estado ao voltar/avancar no navegador.
- `getPathFromPage()` transforma id da pagina em path.

## Autorizacao no front-end

- `PAGE_PERMISSIONS` define paginas por papel.
- `ACTION_PERMISSIONS` define acoes por papel.
- `canAccessPage()` combina papel fixo com permissoes extras em `crm_permissoes_usuario`.

## Riscos arquiteturais atuais

- A shell principal estar dentro do modulo Leads pode gerar acoplamento indevido.
- Muitas paginas possuem varios subcomponentes no mesmo arquivo.
- Nao ha camada central de rotas.
- Nao ha camada central de design components alem de classes e componentes simples.
