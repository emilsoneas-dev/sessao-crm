# 011 - Integracao Meta API

## 1. Objetivo da etapa

Preparar e implementar a integracao futura com API da Meta, somente depois do fluxo manual estar validado.

## 2. O que deve ser implementado

- Estudar requisitos atuais da Meta API no momento da implementacao.
- Criar fluxo de conexao seguro.
- Guardar referencias de conta e midia.
- Sincronizar metricas reais.
- Manter fallback manual.

## 3. Arquivos ou areas que provavelmente serao modificados

- `supabase/functions/meta-instagram-sync/`
- `src/modules/instagram/services/metaInstagramService.js`
- `src/modules/instagram/components/InstagramMetaConnectionPanel.jsx`
- Migrations adicionais para campos Meta.

## 4. Banco de dados envolvido, se houver

Campos/tabelas futuros:

- `meta_account_id`
- `meta_media_id`
- `meta_access_token_ref`
- `meta_connected_at`
- `meta_last_sync_at`
- Possivel tabela de snapshots de metricas.

## 5. Componentes envolvidos

- `InstagramMetaConnectionPanel`
- `InstagramResultsTab`
- `InstagramProfileHeader`

## 6. Criterios de aceitacao

- Tokens sensiveis nao ficam no front.
- Sincronizacao ocorre via Edge Function.
- API nao quebra o modo manual.
- Erros de conexao sao claros.
- Dados reais ficam marcados como `meta_api`.

## 7. O que nao deve ser alterado

- Fluxo manual validado.
- Link magico.
- Aprovacao de posts.
- Login atual.

## 8. Dependencias da etapa anterior

- Etapa 010 concluida.
- Processo manual aprovado pelo usuario.
- Requisitos oficiais da Meta revisados na data da implementacao.

## 9. Como testar

- Conectar conta de teste.
- Sincronizar perfil.
- Sincronizar metricas de midia.
- Simular erro de token expirado.
- Confirmar fallback manual.

## 10. Quando considerar concluido

Quando metricas reais puderem ser sincronizadas com seguranca e sem prejudicar o fluxo manual.
