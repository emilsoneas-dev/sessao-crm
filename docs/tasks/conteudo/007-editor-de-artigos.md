# 007 - Editor de artigos

## Objetivo

Criar cadastro e edicao de artigos individuais dentro de um pacote mensal.

## Funcionalidades

- Criar artigo.
- Editar titulo, subtitulo, slug, categoria e palavras-chave.
- Colar conteudo completo.
- Editar resumo, meta title, meta description e CTA.
- Definir ordem na sidebar.
- Salvar status interno.
- Excluir artigo com confirmacao, se permitido.

## Arquivos que serao modificados

- `src/modules/conteudo/pages/ContentPackagePage.jsx`
- `src/modules/conteudo/components/ArticleEditorModal.jsx`
- `src/modules/conteudo/components/ArticleReader.jsx`
- `src/modules/conteudo/components/ArticleSidebar.jsx`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`

## Banco envolvido

- `crm_blog_artigos`
- `crm_blog_pacotes`, para relacionamento.

## Componentes envolvidos

- Modal/editor de artigo.
- Leitor estilo documento.
- Sidebar de artigos.
- Badges de status.

## Criterios de aceitacao

- Artigo pode ser criado.
- Conteudo completo pode ser colado e salvo.
- Artigo aparece na sidebar.
- Ordem basica e respeitada.
- Artigo pode ser editado sem perder conteudo.

## O que NAO deve ser alterado

- Link magico.
- Aprovacao publica.
- Briefing proximo mes.
- Modulos nao relacionados.

## Dependencias

- Etapa 005 concluida.
- Etapa 006 recomendada.

## Como testar

- Criar pacote.
- Criar tres artigos.
- Alternar artigos na sidebar.
- Editar conteudo e recarregar.
- Rodar build.

## Quando considerar a etapa concluida

Quando a equipe conseguir cadastrar e ler artigos completos no pacote.
