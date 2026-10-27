# 009 - Aprovacao de posts

## 1. Objetivo da etapa

Permitir que cliente e agencia aprovem, reprovem ou solicitem ajustes nos conteudos.

## 2. O que deve ser implementado

- Adicionar acoes de aprovacao no preview do post.
- Exigir comentario para reprovar ou solicitar ajuste.
- Salvar comentarios no historico.
- Atualizar status do post.
- Diferenciar origem `crm` e `link_magico`.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/instagram/components/InstagramApprovalPanel.jsx`
- `src/modules/instagram/components/InstagramCommentsThread.jsx`
- `src/modules/instagram/services/instagramService.js`
- `src/modules/instagram/services/instagramPublicService.js`
- Edge Function publica criada na etapa 008.

## 4. Banco de dados envolvido, se houver

- `crm_instagram_posts`
- `crm_instagram_comentarios`
- `crm_instagram_links_magicos`

## 5. Componentes envolvidos

- `InstagramApprovalPanel`
- `InstagramCommentsThread`
- `InstagramPostPreviewModal`
- `InstagramPublicReviewPage`

## 6. Criterios de aceitacao

- Aprovar muda status para `aprovado`.
- Reprovar exige comentario e muda para `reprovado`.
- Solicitar ajuste exige comentario e muda para `ajuste_solicitado`.
- Comentarios ficam visiveis no historico.
- Acoes via link magico respeitam token valido.

## 7. O que nao deve ser alterado

- Status de tarefas.
- Status de clientes.
- Financeiro.

## 8. Dependencias da etapa anterior

- Etapa 008 concluida.

## 9. Como testar

- Aprovar post no CRM.
- Reprovar post no CRM com comentario.
- Solicitar ajuste via link publico.
- Conferir persistencia no banco.
- Conferir atualizacao da tela interna.

## 10. Quando considerar concluido

Quando o ciclo de aprovacao de conteudos funcionar internamente e externamente.
