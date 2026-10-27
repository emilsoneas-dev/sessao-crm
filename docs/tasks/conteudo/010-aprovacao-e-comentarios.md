# 010 - Aprovacao e comentarios

## Objetivo

Implementar a aprovacao guiada artigo por artigo na pagina publica do link magico.

## Funcionalidades

- Primeira tela `Central de Revisao de Conteudo`.
- Resumo executivo em duas colunas.
- Card `Objetivo da Estrategia`.
- Botao `Iniciar revisao`.
- Barra fixa no topo do artigo.
- Botao `Aprovar`.
- Botao `Revisar` com comentario obrigatorio.
- Botao `Comentar` sem mudar status.
- Avanco automatico para proximo artigo pendente.
- Tela final `Revisao concluida`.

## Arquivos que serao modificados

- `src/modules/conteudo/pages/ContentMagicReviewPage.jsx`
- `src/modules/conteudo/components/PublicReviewStart.jsx`
- `src/modules/conteudo/components/PublicArticleReview.jsx`
- `src/modules/conteudo/components/ReviewActionBar.jsx`
- `src/modules/conteudo/components/ReviewCommentModal.jsx`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`
- Possivel RPC/Edge Function para registrar decisoes.

## Banco envolvido

- `crm_blog_artigos`
- `crm_blog_comentarios`
- `crm_blog_historico`
- `crm_blog_pacotes`
- `crm_blog_links_magicos`

## Componentes envolvidos

- Tela inicial publica.
- Barra fixa de revisao.
- Modal de comentario obrigatorio.
- Sidebar publica.
- Tela de conclusao.

## Criterios de aceitacao

- Cliente aprova artigo e avanca automaticamente.
- Cliente revisa artigo apenas com comentario.
- Cliente comenta sem mudar status.
- Sidebar mostra todos os artigos e status.
- Artigos aprovados mostram data/hora.
- Ao fim, aparece `Revisao concluida`.

## O que NAO deve ser alterado

- Area interna fora do necessario para refletir status.
- Briefing do proximo mes.
- Instagram.
- Tarefas.

## Dependencias

- Etapa 009 concluida.

## Como testar

- Abrir link magico.
- Clicar em `Iniciar revisao`.
- Aprovar primeiro artigo.
- Revisar segundo artigo com comentario.
- Comentar terceiro artigo sem mudar status.
- Concluir todos e validar tela final.

## Quando considerar a etapa concluida

Quando o fluxo publico de revisao artigo por artigo estiver completo e persistindo dados.
