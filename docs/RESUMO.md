# Resumo tecnico do CRM Panorama

Status: documentacao baseada no codigo atual do projeto.

## Tecnologias utilizadas

- React com Vite.
- Supabase Auth, Supabase Database e Supabase Edge Functions.
- `@supabase/supabase-js` para comunicacao com banco e auth.
- `@dnd-kit/core` para quadros Kanban com arrastar e soltar.
- `lucide-react` para icones.
- CSS modular por pagina, com um arquivo global principal.
- Deploy preparado para Vercel por `vercel.json`.

## Estrutura geral do projeto

- `src/app/App.jsx`: inicializa o app, valida sessao do Supabase, carrega usuario do CRM e libera a shell principal.
- `src/modules`: concentra as paginas e servicos por dominio.
- `src/components/layout`: contem Sidebar, Topbar, menu de conta e gerenciador de logo.
- `src/components/ui`: contem componentes simples reaproveitaveis como `Toast` e `EmptyState`.
- `src/services/supabase/supabaseClient.js`: cria o cliente Supabase usando variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- `supabase/migrations`: define tabelas, indices, RLS e colunas adicionais.
- `supabase/functions/create-crm-user`: Edge Function usada para convite/cadastro de usuarios.

## Modulos existentes

- Visao Geral: resumo estrategico e operacional.
- Leads: funil comercial em Kanban.
- Clientes: carteira de clientes em lista e Kanban.
- Operacional/Tarefas: tarefas, entregas, calendario, recorrentes e arquivadas.
- Direcao/Financeiro: receita baseada em tarefas faturaveis.
- Direcao/Recursos Humanos: colaboradores, convites e cadastro inicial.
- Documentos: central de links por cliente.
- Conteudo: Central de Revisao de Conteudo com entregas mensais, editor de itens, link magico, aprovacao publica, comentarios, briefing e historico.
- Configuracoes: usuarios, convites e permissoes.

Modulos listados pelo produto mas nao identificados como telas proprias no codigo atual:

- Arquivos.
- Lixeira.
- Relatorios.

## Fluxo principal do CRM

1. Usuario entra pelo Supabase Auth.
2. `App.jsx` busca o registro correspondente em `crm_usuarios`.
3. Se o usuario estiver ativo, a shell principal e carregada.
4. A navegacao interna e controlada por `CRMLeadsPage.jsx`, com `activePage` e historico do navegador.
5. Leads entram em `leads_formularios` e podem ser movidos pelo Kanban.
6. Leads convertidos viram clientes pelo campo `status = 'cliente'`.
7. Clientes podem gerar tarefas operacionais, documentos, dados de recorrencia e dados financeiros.
8. Tarefas ficam em `crm_tarefas` e alimentam Operacional, Visao Geral e Financeiro.
9. Usuarios e permissoes sao gerenciados em `crm_usuarios` e `crm_permissoes_usuario`.

## Organizacao aparente dos dados

- Leads e clientes usam a mesma tabela `leads_formularios`.
- O campo `status` separa lead, cliente e arquivado.
- O campo `status_cliente` separa clientes ativos, em implantacao, pausados e encerrados.
- Tarefas ficam em `crm_tarefas`, com status operacional, recorrencia, faturamento, referencias mensais e arquivamento.
- Usuarios internos ficam em `crm_usuarios`.
- Permissoes extras por pagina ficam em `crm_permissoes_usuario`.
- Conteudo usa `crm_conteudo_entregas`, `crm_conteudo_itens`, `crm_conteudo_comentarios`, `crm_conteudo_historico`, `crm_conteudo_links_magicos` e `crm_conteudo_briefings_proximo_mes`.

## Principais componentes reaproveitaveis

- `Sidebar`: menu principal com grupos recolhiveis.
- `Topbar`: titulo da pagina, tema, notificacoes, total de registros e conta.
- `UserAccountMenu`: avatar, dropdown de conta, perfil e configuracoes basicas.
- `LogoManager`: logo editavel via localStorage.
- `KanbanBoard`, `KanbanColumn`, `LeadCard`: funil de leads.
- `ClientsKanbanView`: Kanban de clientes.
- `ClientProfileTabsModal`: ficha detalhada do cliente.
- Componentes internos de tarefas, financeiro, documentos e RH definidos nos arquivos de pagina.

## Pontos de atencao antes de novos modulos

- A shell principal esta dentro de `CRMLeadsPage.jsx`, apesar de controlar todas as paginas.
- Leads e clientes compartilham a tabela `leads_formularios`; novas features de clientes devem respeitar essa decisao.
- Financeiro atual soma tarefas faturaveis, nao mensalidades diretas de clientes.
- RH e perfil leem campos extras como `foto_url`, `data_nascimento`, `cargo` e `telefone`, mas as migrations atuais nao mostram essas colunas em `crm_usuarios`.
- Algumas paginas ainda possuem componentes internos grandes no mesmo arquivo, o que aumenta o risco em alteracoes amplas.
- Existe um arquivo `src/assets/styles/globalll.css` alem de `global.css`; nao foi identificado uso dele no fluxo principal.

## Recomendacoes para evolucao do sistema

- Antes de criar modulos novos, estabilizar a arquitetura da shell e separar navegacao de Leads.
- Criar uma camada de componentes comuns para cards, tabelas, filtros, modais e badges.
- Documentar scripts SQL antes de qualquer alteracao no Supabase.
- Evitar duplicar informacoes entre Visao Geral, Clientes, Operacional e Financeiro.
- Manter Financeiro alimentado por tarefas faturaveis para preservar consistencia com artigos e entregas.
- Criar migrations pequenas com `add column if not exists` quando novos campos forem necessarios.
