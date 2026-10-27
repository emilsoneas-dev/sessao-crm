# 005 - Pacote mensal

## Objetivo

Permitir criar e editar um pacote mensal de artigos para um cliente.

## Funcionalidades

- Criar novo pacote.
- Selecionar cliente.
- Definir mes e ano.
- Informar titulo, objetivo e quantidade prevista.
- Definir responsavel.
- Editar dados basicos do pacote.
- Evitar duplicidade por cliente e mes, quando fizer sentido.

## Arquivos que serao modificados

- `src/modules/conteudo/pages/ContentDashboardPage.jsx`
- `src/modules/conteudo/components/ContentPackageModal.jsx`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`

## Banco envolvido

- `crm_blog_pacotes`
- `leads_formularios`, somente leitura para selecionar clientes.

## Componentes envolvidos

- Modal de pacote mensal.
- Select de cliente.
- Campo de mes de referencia.
- Cards de resumo do pacote.

## Criterios de aceitacao

- Usuario cria pacote sem erro.
- Usuario edita pacote existente.
- Cliente e mes ficam salvos corretamente.
- Duplicidade e tratada com mensagem clara.
- Estado vazio orienta a criar o primeiro pacote.

## O que NAO deve ser alterado

- Artigos individuais.
- Link magico.
- Comentarios.
- Briefing do proximo mes.

## Dependencias

- Etapa 004 concluida.
- Banco da etapa 002 rodado.

## Como testar

- Criar pacote para um cliente.
- Editar titulo e objetivo.
- Tentar criar pacote duplicado para mesmo cliente/mes.
- Recarregar pagina e confirmar persistencia.

## Quando considerar a etapa concluida

Quando pacotes mensais puderem ser criados e editados de forma segura.
