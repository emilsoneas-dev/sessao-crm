# 008 - Central de Revisao

## Objetivo

Criar a experiencia interna de leitura e preparacao da Central de Revisao de Conteudo antes do link magico publico.

## Funcionalidades

- Mostrar pacote com estrategia e artigos.
- Exibir sidebar esquerda com estrategia e lista de artigos.
- Exibir artigo selecionado em formato de leitura.
- Mostrar status de cada artigo.
- Exibir progresso geral do pacote.
- Preparar layout que sera reaproveitado na pagina publica.

## Arquivos que serao modificados

- `src/modules/conteudo/pages/ContentReviewPage.jsx`
- `src/modules/conteudo/components/ReviewLayout.jsx`
- `src/modules/conteudo/components/ReviewHeader.jsx`
- `src/modules/conteudo/components/ArticleSidebar.jsx`
- `src/modules/conteudo/components/ArticleReader.jsx`
- `src/modules/conteudo/styles/conteudo.css`

## Banco envolvido

- `crm_blog_pacotes`
- `crm_blog_artigos`

## Componentes envolvidos

- Layout de revisao.
- Sidebar de navegacao.
- Barra superior de progresso.
- Leitor de artigo.

## Criterios de aceitacao

- Agencia consegue visualizar pacote como o cliente vera.
- Sidebar lista estrategia e artigos.
- Progresso geral aparece corretamente.
- Layout funciona com artigos longos.
- Responsividade basica preservada.

## O que NAO deve ser alterado

- Link publico sem login.
- Acoes de aprovacao do cliente.
- Comentarios publicos.
- Banco de tokens.

## Dependencias

- Etapa 007 concluida.

## Como testar

- Abrir pacote com varios artigos.
- Navegar pela sidebar.
- Validar leitura de artigos longos.
- Verificar contadores.

## Quando considerar a etapa concluida

Quando existir uma central interna de revisao pronta para servir de base ao link magico.
