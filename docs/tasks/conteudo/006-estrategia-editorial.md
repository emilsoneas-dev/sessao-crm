# 006 - Estrategia editorial

## Objetivo

Adicionar a area de estrategia editorial do mes dentro de cada pacote.

## Funcionalidades

- Editar objetivo do mes.
- Editar publico-alvo.
- Editar linha editorial.
- Editar palavras-chave.
- Editar tom de comunicacao.
- Editar observacoes estrategicas.
- Mostrar card `Objetivo da Estrategia`.

## Arquivos que serao modificados

- `src/modules/conteudo/pages/ContentPackagePage.jsx`
- `src/modules/conteudo/components/EditorialStrategyPanel.jsx`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`

## Banco envolvido

- `crm_blog_pacotes`

## Componentes envolvidos

- Painel de estrategia.
- Formulario editorial.
- Card de resumo estrategico.

## Criterios de aceitacao

- Estrategia pode ser salva e editada.
- Conteudo aparece no pacote interno.
- Dados ficam prontos para aparecer no link magico.
- Textos longos nao quebram layout.

## O que NAO deve ser alterado

- Artigos individuais.
- Status de aprovacao.
- Link magico.
- Historico.

## Dependencias

- Etapa 005 concluida.

## Como testar

- Abrir pacote.
- Editar estrategia.
- Salvar e recarregar.
- Confirmar que dados persistem.

## Quando considerar a etapa concluida

Quando a estrategia editorial do pacote puder ser gerenciada pela equipe.
