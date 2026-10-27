# 004 - Dashboard Conteudo

## Objetivo

Criar a pagina interna principal da Central de Revisao de Conteudo para a equipe da agencia acompanhar pacotes e status.

## Funcionalidades

- Criar rota interna do modulo.
- Listar pacotes mensais por cliente.
- Exibir cards de resumo.
- Permitir busca por cliente, mes ou status.
- Mostrar estado vazio profissional.
- Abrir pacote mensal selecionado.

## Arquivos que serao modificados

- `src/app/App.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/modules/conteudo/pages/ContentDashboardPage.jsx`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`

## Banco envolvido

- `crm_blog_pacotes`
- `crm_blog_artigos`, para contadores por pacote.

## Componentes envolvidos

- `ContentDashboardPage`
- Cards de indicadores.
- Lista/tabela de pacotes.
- Busca e filtros.

## Criterios de aceitacao

- Rota interna abre sem erro.
- Pacotes aparecem em ordem recente.
- Filtros nao quebram com lista vazia.
- Cards mostram totais coerentes.
- Visual segue padrao SaaS premium do CRM.

## O que NAO deve ser alterado

- Menu de Instagram.
- Fluxo publico de link magico.
- Tarefas recorrentes.
- Financeiro.

## Dependencias

- Etapa 001 concluida.
- Etapa 002 rodada.

## Como testar

- Acessar rota interna.
- Criar dados de teste diretamente no Supabase, se necessario.
- Buscar por cliente e status.
- Rodar build.

## Quando considerar a etapa concluida

Quando a equipe conseguir ver e filtrar pacotes mensais na area interna.
