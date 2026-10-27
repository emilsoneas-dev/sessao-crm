# Modulo: Configuracoes

## 1. Objetivo da secao

Controlar usuarios, convites e permissoes internas do CRM.

## 2. Telas existentes

- `/configuracoes`
- Modal de convite.
- Listas de convites, usuarios e permissoes.

## 3. Componentes utilizados

- `CRMSettingsPage`
- `SettingsStat`
- Servicos de `settingsService.js`

## 4. Campos principais

Usuarios:

- `nome`
- `email`
- `papel`
- `ativo`
- `convite_status`
- datas de convite

Permissoes:

- `usuario_email`
- `recurso_tipo`
- `recurso_id`
- `permissao`
- `ativo`

## 5. Acoes disponiveis

- Convidar colaborador.
- Excluir convite pendente.
- Inativar usuario.
- Excluir usuario.
- Criar permissao por pagina.
- Desativar permissao.
- Atualizar dados da tela.

## 6. Fluxo do usuario

O dono acessa configuracoes, convida colaboradores, acompanha convites pendentes, consulta usuarios e libera paginas extras quando necessario.

## 7. Relacao com o banco de dados

- `crm_usuarios`
- `crm_permissoes_usuario`
- Edge Function `create-crm-user`

## 8. Integracoes

- Autenticacao.
- Sidebar/permissoes.
- Recursos Humanos.

## 9. Pontos fortes

- Centraliza permissoes extras.
- Trabalha com convites por e-mail.
- Restringe acoes sensiveis ao dono.

## 10. Problemas ou limitacoes

- Sobrepoe parte do que RH tambem faz.
- Exclusao de usuario remove permissoes e registro.
- Nao ha auditoria visual das alteracoes.

## 11. Sugestoes de melhoria futura

- Separar Configuracoes do sistema de Gestao de Pessoas.
- Criar trilha de auditoria.
- Criar perfis de permissao predefinidos.
