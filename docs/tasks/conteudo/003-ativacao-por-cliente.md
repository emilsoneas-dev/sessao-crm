# 003 - Ativacao por cliente

## Objetivo

Permitir que a Central de Revisao de Conteudo seja ativada ou acessada a partir da ficha do cliente.

## Funcionalidades

- Adicionar acao `Blog/Artigos` ou `Central de Conteudo` na ficha do cliente.
- Exibir status de ativacao do modulo para aquele cliente.
- Criar ou localizar area inicial do cliente no modulo.
- Direcionar para pacotes mensais do cliente.

## Arquivos que serao modificados

- `src/modules/clients/components/ClientProfileTabsModal.jsx`
- `src/modules/clients/components/client-profile-tabs.css`
- `src/modules/conteudo/services/conteudoService.js`
- Possivelmente `src/modules/conteudo/components/ContentClientPanel.jsx`

## Banco envolvido

- `crm_blog_pacotes`, apenas leitura inicial.
- Nao criar nova tabela nesta etapa.

## Componentes envolvidos

- Aba ou botao na ficha do cliente.
- Painel simples de entrada para pacotes do cliente.

## Criterios de aceitacao

- Cliente mostra acesso claro ao modulo.
- O acesso nao quebra as abas atuais da ficha do cliente.
- Se o cliente ainda nao tiver pacote, mostrar estado vazio.
- Se houver pacotes, mostrar atalho para a area de conteudo.

## O que NAO deve ser alterado

- Dados financeiros do cliente.
- Documentos existentes.
- Instagram.
- Logica de salvar cliente.

## Dependencias

- Etapa 001 concluida.
- Etapa 002 rodada no Supabase, se a tela consultar tabelas reais.

## Como testar

- Abrir ficha de cliente.
- Verificar se o novo acesso aparece.
- Confirmar que salvar cliente ainda funciona.
- Confirmar que clientes sem pacote nao geram erro.

## Quando considerar a etapa concluida

Quando a ficha do cliente tiver entrada para a Central de Conteudo sem afetar funcionalidades atuais.
