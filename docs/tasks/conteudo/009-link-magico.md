# 009 - Link magico

## Objetivo

Criar o link publico seguro para o cliente acessar a Central de Revisao de Conteudo sem login.

## Funcionalidades

- Gerar token seguro para pacote.
- Salvar hash do token.
- Exibir link para copiar.
- Criar rota publica sem layout do CRM.
- Validar token.
- Mostrar link invalido, expirado ou desativado.
- Registrar ultimo acesso.

## Arquivos que serao modificados

- `src/app/App.jsx`
- `src/modules/conteudo/pages/ContentMagicReviewPage.jsx`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`
- Possivel Supabase RPC ou Edge Function.

## Banco envolvido

- `crm_blog_links_magicos`
- `crm_blog_pacotes`
- `crm_blog_artigos`
- `crm_blog_comentarios`, somente leitura inicial.

## Componentes envolvidos

- Botao `Gerar link de aprovacao`.
- Modal/caixa de link gerado.
- Pagina publica.
- Estados de token invalido/expirado.

## Criterios de aceitacao

- Link e gerado e copiado.
- Pagina publica abre sem login.
- Token invalido mostra mensagem clara.
- Token expirado mostra mensagem clara.
- Pagina publica nao mostra menu do CRM.

## O que NAO deve ser alterado

- Login atual.
- Permissoes internas.
- Link magico do Instagram.
- Aprovacao e comentarios, que ficam para etapa 010.

## Dependencias

- Etapa 008 concluida.
- Banco da etapa 002 rodado.

## Como testar

- Gerar link para pacote.
- Abrir em aba anonima ou sem login.
- Testar token falso.
- Testar link desativado/expirado via banco.

## Quando considerar a etapa concluida

Quando o cliente conseguir abrir a Central de Revisao publica com token valido.
