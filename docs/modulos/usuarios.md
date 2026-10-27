# Modulo: Usuarios

## 1. Objetivo da secao

Gerenciar colaboradores, convites e acesso ao CRM.

## 2. Telas existentes

- `/recursos-humanos`
- `/configuracoes`
- Modal de conta no topo.
- `/set-password`

## 3. Componentes utilizados

- `CRMHumanResourcesPage`
- `CRMSettingsPage`
- `UserAccountMenu`
- `LoginPage`
- `SetPasswordPage`

## 4. Campos principais

Em `crm_usuarios`:

- `nome`
- `email`
- `papel`
- `ativo`
- `convite_status`
- `convite_enviado_em`
- `ultimo_convite_em`
- `convite_aceito_em`

Campos lidos pelo front mas nao identificados nas migrations atuais:

- `foto_url`
- `data_nascimento`
- `cargo`
- `telefone`

## 5. Acoes disponiveis

- Convidar colaborador.
- Cadastrar colaborador em RH.
- Inativar colaborador.
- Excluir colaborador.
- Gerenciar convites pendentes.
- Criar permissoes extras por pagina.
- Desativar permissoes.
- Abrir perfil/configuracoes no menu de conta.
- Sair do sistema.

## 6. Fluxo do usuario

O dono cria convites, o colaborador define senha, o app valida acesso em `crm_usuarios` e libera paginas conforme papel ou permissoes extras.

## 7. Relacao com o banco de dados

- `crm_usuarios`
- `crm_permissoes_usuario`
- Supabase Auth
- Edge Function `create-crm-user`

## 8. Integracoes

- Autenticacao.
- Sidebar e permissoes de pagina.
- RH.
- Configuracoes.
- Topbar/menu de conta.

## 9. Pontos fortes

- Existe controle por papel.
- Existe convite por Edge Function.
- Existe permissao extra por pagina.

## 10. Problemas ou limitacoes

- Perfil ainda parece somente leitura.
- Campos de perfil usados no front nao aparecem nas migrations atuais.
- RH e Configuracoes repetem parte da gestao de usuarios.

## 11. Sugestoes de melhoria futura

- Consolidar regras de usuarios entre RH e Configuracoes.
- Criar edicao real do perfil.
- Adicionar campos de perfil via migration.
- Criar logs de acesso/alteracoes.
