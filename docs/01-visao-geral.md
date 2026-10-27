# Visao geral do projeto

## Objetivo do CRM

O CRM Panorama organiza o fluxo de uma agencia de marketing: entrada de leads, conversao em clientes, execucao de tarefas/artigos, controle financeiro por entregas e gestao de usuarios internos.

## Estado atual

O sistema ja possui login, menu lateral, topbar, tema claro/escuro, funil de leads, carteira de clientes, operacional/tarefas, financeiro, documentos, recursos humanos e configuracoes.

## Fluxo de uso principal

1. Login pelo Supabase.
2. Validacao do usuario interno em `crm_usuarios`.
3. Navegacao pela shell principal.
4. Captura ou cadastro manual de leads.
5. Conversao de lead para cliente.
6. Configuracao de cliente recorrente ou avulso.
7. Criacao/geracao de tarefas.
8. Acompanhamento operacional e financeiro pelas tarefas.
9. Organizacao de links e documentos por cliente.
10. Gestao de colaboradores e permissoes.

## Paginas identificadas

- `/visao-geral`
- `/leads`
- `/clientes`
- `/financeiro`
- `/recursos-humanos`
- `/tarefas`
- `/documentos`
- `/configuracoes`
- `/set-password`

## Observacoes importantes

- A rota real nao usa React Router. O app usa `window.history.pushState`, `window.location.pathname` e estado interno.
- `CRMLeadsPage.jsx` funciona como container principal de todas as paginas autenticadas.
- A primeira pagina permitida depende do papel do usuario e de permissoes extras.
- O menu ja agrupa Visao Geral e Direcao com subitens.

## Estado dos dados

- Leads/clientes: `leads_formularios`.
- Tarefas: `crm_tarefas`.
- Usuarios: `crm_usuarios`.
- Permissoes: `crm_permissoes_usuario`.
