# Banco de dados

## Provedor

Supabase Postgres com Supabase Auth e Row Level Security.

## Tabelas identificadas

### `leads_formularios`

Usada para leads e clientes.

Campos principais:

- `id`
- `nome`
- `email`
- `telefone`
- `whatsapp`
- `cidade`
- `empresa`
- `contato_principal`
- `servico_interesse`
- `mensagem`
- `origem`
- `etapa`
- `status`
- `prioridade`
- `observacoes`
- `responsavel`
- `data_entrada`
- `data_ultima_atualizacao`
- `status_cliente`
- `convertido_em`
- `arquivado_em`
- `data_inicio_cliente`
- `responsavel_cliente`
- `proxima_acao`
- `ultima_acao`
- `mensalidade`
- `dia_vencimento`
- `status_financeiro`
- `meses_estimados_contrato`
- `servico_contratado`
- `plano_contratado`
- `documento_url`
- `briefing_url`
- `estrategia_url`
- `contrato_url`
- `financeiro_url`
- `conteudos_url`
- `tarefas_url`
- `relatorios_url`
- `acessos_url`
- `drive_url`
- `historico_url`
- `observacoes_cliente`
- `recorrente`
- `artigos_mensais`
- `valor_por_artigo`
- `responsavel_padrao`

### `crm_tarefas`

Usada para tarefas, entregas, recorrentes, arquivos mensais e financeiro.

Campos principais:

- `id`
- `cliente_id`
- `cliente_nome`
- `titulo`
- `descricao`
- `tipo`
- `categoria`
- `status`
- `prioridade`
- `data_vencimento`
- `hora_vencimento`
- `data_inicio`
- `data_conclusao`
- `responsavel`
- `responsavel_email`
- `criado_por`
- `criado_por_email`
- `recorrente`
- `recorrencia`
- `proxima_recorrencia`
- `mensalidade_referencia_mes`
- `mensalidade_referencia_ano`
- `valor_previsto`
- `valor_pago`
- `pago_em`
- `link_referencia`
- `observacoes`
- `origem`
- `mes_arquivo`
- `data_arquivamento`
- `mes_referencia`
- `quantidade_artigos`
- `valor_unitario`
- `valor_total`
- `faturavel`
- `criado_em`
- `atualizado_em`

### `crm_usuarios`

Usada para usuarios internos e validacao de acesso.

Campos definidos nas migrations:

- `id`
- `auth_user_id`
- `nome`
- `email`
- `papel`
- `ativo`
- `convite_status`
- `convite_enviado_em`
- `ultimo_convite_em`
- `convite_aceito_em`
- `criado_em`
- `atualizado_em`

Observacao: o front-end le campos como `foto_url`, `data_nascimento`, `cargo` e `telefone`, mas eles nao aparecem nas migrations atuais analisadas.

### `crm_permissoes_usuario`

Usada para liberar paginas alem do papel padrao.

Campos:

- `id`
- `usuario_email`
- `recurso_tipo`
- `recurso_id`
- `permissao`
- `ativo`
- `criado_em`
- `atualizado_em`

## Funcoes SQL

- `public.is_active_crm_user()`: confere se o e-mail autenticado existe e esta ativo em `crm_usuarios`.
- `public.is_crm_owner()`: confere se o usuario autenticado e dono ativo.

## Politicas RLS

- Leads permitem insert publico/autenticado.
- Leitura e escrita de leads exigem usuario ativo.
- Usuarios podem ler a si mesmos ou o dono pode ler todos.
- Escrita em usuarios e permissoes exige dono.
- Tarefas exigem usuario ativo para leitura e escrita.

## Indices identificados

- Etapa, data e status em leads.
- Email em usuarios e permissoes.
- Cliente, vencimento, status, mes de referencia, mes de arquivo e faturavel em tarefas.
- Recorrencia/status de clientes em `leads_formularios`.
