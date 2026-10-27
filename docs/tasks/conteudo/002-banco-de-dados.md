# 002 - Banco de dados

## Objetivo

Criar a base de dados da Central de Revisao de Conteudo, preparada para pacotes mensais, artigos, comentarios, historico, links magicos e briefing do proximo mes.

## Funcionalidades

- Criar migration do modulo.
- Criar tabelas com `create table if not exists`.
- Criar indices por cliente, pacote, mes e status.
- Criar campos de auditoria e timestamps.
- Preparar RLS para usuarios internos.
- Preparar funcoes seguras para link magico, se necessario.

## Arquivos que serao modificados

- `supabase/migrations/009_content_review_module.sql`
- `docs/modulos/blog-artigos.md`, somente se algum detalhe tecnico precisar ser documentado.

## Banco envolvido

Tabelas sugeridas:

- `crm_blog_pacotes`
- `crm_blog_artigos`
- `crm_blog_comentarios`
- `crm_blog_historico`
- `crm_blog_links_magicos`
- `crm_blog_briefings_proximo_mes`

## Componentes envolvidos

Nenhum componente de interface nesta etapa.

## Criterios de aceitacao

- Migration segura e idempotente.
- Foreign keys para cliente e pacote quando aplicavel.
- RLS habilitado.
- Politicas internas usando o padrao atual do CRM.
- Nenhuma tabela existente apagada ou alterada de forma destrutiva.

## O que NAO deve ser alterado

- Tabelas do Instagram.
- Tabelas de tarefas.
- Tabelas de clientes existentes.
- Dados ja cadastrados.
- Funcionalidades visuais.

## Dependencias

- Etapa 001 concluida.
- Confirmacao do nome final das tabelas.

## Como testar

- Revisar SQL manualmente.
- Rodar a migration em ambiente de teste ou Supabase SQL Editor.
- Verificar se as tabelas foram criadas.
- Verificar se `select` interno funciona para usuario autenticado.

## Quando considerar a etapa concluida

Quando a migration estiver criada, revisada e pronta para execucao manual no Supabase.
