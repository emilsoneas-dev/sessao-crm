# Autenticacao e permissoes

## Autenticacao

O login usa Supabase Auth.

Fluxo principal:

1. `App.jsx` chama `supabase.auth.getSession()`.
2. Se houver sessao, busca usuario do CRM com `fetchCurrentCrmUser()`.
3. O usuario precisa existir e estar ativo em `crm_usuarios`.
4. Permissoes extras sao carregadas com `fetchUserExtraPermissions()`.
5. Se nao houver sessao, renderiza `LoginPage`.
6. Se o usuario nao estiver liberado, renderiza tela de acesso bloqueado.

## Pagina de senha

`SetPasswordPage.jsx` atende `/set-password`.

Apos criar senha, redireciona para `/leads` e recarrega a aplicacao.

## Papeis

Papeis definidos:

- `dono`
- `gestor`
- `funcionario`
- `cliente`

## Permissoes por pagina

Configuracao atual:

- Leads: dono, gestor, funcionario.
- Clientes: dono, gestor.
- Financeiro: dono, gestor.
- Recursos Humanos: dono, gestor.
- Tarefas: dono, gestor, funcionario.
- Documentos: dono, gestor, funcionario, cliente.
- Visao Geral: dono, gestor.
- Configuracoes: dono.

## Permissoes por acao

- Ver dados financeiros: dono, gestor.
- Editar cliente: dono, gestor.
- Converter lead: dono, gestor.
- Arquivar lead: dono, gestor.
- Gerenciar usuarios: dono.
- Editar configuracoes: dono.

## Permissoes extras

Permissoes extras sao consultadas em `crm_permissoes_usuario`.

O front usa:

- `recurso_tipo = 'pagina'`
- `recurso_id = id da pagina`
- `permissao = 'visualizar'`

## RLS

O banco tambem aplica RLS:

- Usuario ativo pode ler/escrever leads e tarefas.
- Dono pode gerenciar usuarios e permissoes.
- Usuario pode ler seu proprio registro.
