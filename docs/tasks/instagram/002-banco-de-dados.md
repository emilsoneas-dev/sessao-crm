# 002 - Banco de dados do Instagram

## 1. Objetivo da etapa

Criar a base de dados minima para perfis, posts, comentarios e links magicos do modulo Instagram.

## 2. O que deve ser implementado

- Criar migration SQL com tabelas planejadas.
- Usar `create table if not exists`.
- Criar indices por `cliente_id`, `instagram_perfil_id`, `status_aprovacao` e datas.
- Criar politicas RLS para usuarios ativos do CRM.
- Manter link magico preparado para Edge Function.

## 3. Arquivos ou areas que provavelmente serao modificados

- `supabase/migrations/004_instagram_module.sql` ou proximo numero disponivel.
- Possivelmente `docs/modulos/instagram.md`, se houver ajuste de decisao tecnica.

## 4. Banco de dados envolvido, se houver

Tabelas propostas:

- `crm_instagram_perfis`
- `crm_instagram_posts`
- `crm_instagram_comentarios`
- `crm_instagram_links_magicos`

## 5. Componentes envolvidos

Nenhum componente React nesta etapa.

## 6. Criterios de aceitacao

- Migration usa comandos seguros.
- RLS protege dados internos.
- Tabelas vinculam registros ao `cliente_id`.
- Nenhuma tabela existente e removida ou alterada de forma destrutiva.
- Link magico ainda nao precisa funcionar.

## 7. O que nao deve ser alterado

- Estrutura atual de `leads_formularios`.
- Estrutura atual de `crm_tarefas`.
- Estrutura atual de `crm_usuarios`.
- Regras financeiras existentes.

## 8. Dependencias da etapa anterior

- Etapa 001 concluida ou, no minimo, estrutura/nomenclatura aprovada.

## 9. Como testar

- Rodar migration em ambiente Supabase de teste, quando disponivel.
- Conferir se tabelas e indices foram criados.
- Conferir se usuarios ativos conseguem ler/escrever conforme RLS.
- Conferir se anon nao acessa tabelas diretamente.

## 10. Quando considerar concluido

Quando a base do banco estiver criada com seguranca e pronta para receber ativacao por cliente.
