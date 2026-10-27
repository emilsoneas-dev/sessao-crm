create extension if not exists "pgcrypto";

create table if not exists public.crm_conteudo_entregas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,

  titulo text not null,
  mes_referencia text not null,
  objetivo_estrategia text,
  estrategia_editorial text,
  publico_alvo text,
  palavras_chave text,
  tom_comunicacao text,
  observacoes text,

  quantidade_prevista integer not null default 0,
  quantidade_aprovada integer not null default 0,
  quantidade_revisada integer not null default 0,
  quantidade_publicada integer not null default 0,

  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_revisao', 'aprovado', 'revisar', 'publicado')),

  responsavel text,
  briefing_proximo_mes_status text not null default 'nao_iniciado'
    check (briefing_proximo_mes_status in ('nao_iniciado', 'dispensado', 'enviado')),
  briefing_proximo_mes_enviado_em timestamptz,
  revisao_concluida_em timestamptz,

  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  unique (cliente_id, mes_referencia, titulo)
);

create table if not exists public.crm_conteudo_itens (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.crm_conteudo_entregas(id) on delete cascade,
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,

  ordem integer not null default 0,
  tipo text not null default 'artigo'
    check (tipo in ('artigo', 'landing_page', 'email', 'newsletter', 'roteiro', 'outro')),

  titulo text not null,
  subtitulo text,
  slug_sugerido text,
  palavra_chave_principal text,
  palavras_chave_secundarias text,
  categoria text,
  resumo text,
  conteudo text,
  meta_title text,
  meta_description text,
  cta text,
  link_referencia text,

  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_revisao', 'aprovado', 'revisar', 'publicado')),

  responsavel text,
  data_prevista date,
  aprovado_em timestamptz,
  aprovado_por text,
  revisar_em timestamptz,
  revisado_em timestamptz,
  publicado_em timestamptz,
  ultima_decisao_em timestamptz,
  ultimo_comentario_cliente_em timestamptz,

  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.crm_conteudo_comentarios (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.crm_conteudo_itens(id) on delete cascade,
  entrega_id uuid not null references public.crm_conteudo_entregas(id) on delete cascade,
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,

  autor_nome text,
  autor_tipo text not null default 'agencia'
    check (autor_tipo in ('agencia', 'cliente')),
  mensagem text not null,
  origem text not null default 'crm'
    check (origem in ('crm', 'link_magico')),
  tipo_interacao text not null default 'comentario'
    check (tipo_interacao in ('comentario', 'aprovacao', 'revisao', 'publicacao')),

  criado_em timestamptz not null default now()
);

create table if not exists public.crm_conteudo_historico (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.crm_conteudo_itens(id) on delete cascade,
  entrega_id uuid not null references public.crm_conteudo_entregas(id) on delete cascade,
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,

  evento text not null,
  status_anterior text,
  status_novo text,
  autor_nome text,
  autor_tipo text,
  origem text,
  observacao text,
  data_decisao timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.crm_conteudo_links_magicos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,
  entrega_id uuid not null references public.crm_conteudo_entregas(id) on delete cascade,

  token_hash text not null unique,
  escopo text not null default 'entrega'
    check (escopo in ('entrega', 'item')),
  ativo boolean not null default true,
  expira_em timestamptz,

  criado_por text,
  criado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz
);

create table if not exists public.crm_conteudo_briefings_proximo_mes (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.crm_conteudo_entregas(id) on delete cascade,
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,

  servico_produto_destaque text,
  campanha_evento_data text,
  perguntas_frequentes_clientes text,
  observacoes_equipe text,
  origem text not null default 'link_magico'
    check (origem in ('crm', 'link_magico')),

  enviado_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create index if not exists idx_crm_conteudo_entregas_cliente_id
on public.crm_conteudo_entregas(cliente_id);

create index if not exists idx_crm_conteudo_entregas_mes_referencia
on public.crm_conteudo_entregas(mes_referencia);

create index if not exists idx_crm_conteudo_entregas_status
on public.crm_conteudo_entregas(status);

create index if not exists idx_crm_conteudo_itens_entrega_id
on public.crm_conteudo_itens(entrega_id);

create index if not exists idx_crm_conteudo_itens_cliente_id
on public.crm_conteudo_itens(cliente_id);

create index if not exists idx_crm_conteudo_itens_status
on public.crm_conteudo_itens(status);

create index if not exists idx_crm_conteudo_itens_tipo
on public.crm_conteudo_itens(tipo);

create index if not exists idx_crm_conteudo_itens_ordem
on public.crm_conteudo_itens(entrega_id, ordem);

create index if not exists idx_crm_conteudo_comentarios_item_id
on public.crm_conteudo_comentarios(item_id);

create index if not exists idx_crm_conteudo_comentarios_entrega_id
on public.crm_conteudo_comentarios(entrega_id);

create index if not exists idx_crm_conteudo_historico_entrega_id
on public.crm_conteudo_historico(entrega_id);

create index if not exists idx_crm_conteudo_historico_item_id
on public.crm_conteudo_historico(item_id);

create index if not exists idx_crm_conteudo_links_magicos_entrega_id
on public.crm_conteudo_links_magicos(entrega_id);

create index if not exists idx_crm_conteudo_links_magicos_cliente_id
on public.crm_conteudo_links_magicos(cliente_id);

create index if not exists idx_crm_conteudo_links_magicos_ativo_expira
on public.crm_conteudo_links_magicos(ativo, expira_em);

create index if not exists idx_crm_conteudo_briefings_entrega_id
on public.crm_conteudo_briefings_proximo_mes(entrega_id);

create index if not exists idx_crm_conteudo_briefings_cliente_id
on public.crm_conteudo_briefings_proximo_mes(cliente_id);

alter table public.crm_conteudo_entregas enable row level security;
alter table public.crm_conteudo_itens enable row level security;
alter table public.crm_conteudo_comentarios enable row level security;
alter table public.crm_conteudo_historico enable row level security;
alter table public.crm_conteudo_links_magicos enable row level security;
alter table public.crm_conteudo_briefings_proximo_mes enable row level security;

drop policy if exists "crm_conteudo_entregas_active_users_read" on public.crm_conteudo_entregas;
drop policy if exists "crm_conteudo_entregas_active_users_write" on public.crm_conteudo_entregas;
drop policy if exists "crm_conteudo_itens_active_users_read" on public.crm_conteudo_itens;
drop policy if exists "crm_conteudo_itens_active_users_write" on public.crm_conteudo_itens;
drop policy if exists "crm_conteudo_comentarios_active_users_read" on public.crm_conteudo_comentarios;
drop policy if exists "crm_conteudo_comentarios_active_users_write" on public.crm_conteudo_comentarios;
drop policy if exists "crm_conteudo_historico_active_users_read" on public.crm_conteudo_historico;
drop policy if exists "crm_conteudo_historico_active_users_write" on public.crm_conteudo_historico;
drop policy if exists "crm_conteudo_links_magicos_active_users_read" on public.crm_conteudo_links_magicos;
drop policy if exists "crm_conteudo_links_magicos_active_users_write" on public.crm_conteudo_links_magicos;
drop policy if exists "crm_conteudo_briefings_active_users_read" on public.crm_conteudo_briefings_proximo_mes;
drop policy if exists "crm_conteudo_briefings_active_users_write" on public.crm_conteudo_briefings_proximo_mes;

create policy "crm_conteudo_entregas_active_users_read"
on public.crm_conteudo_entregas
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_conteudo_entregas_active_users_write"
on public.crm_conteudo_entregas
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

create policy "crm_conteudo_itens_active_users_read"
on public.crm_conteudo_itens
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_conteudo_itens_active_users_write"
on public.crm_conteudo_itens
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

create policy "crm_conteudo_comentarios_active_users_read"
on public.crm_conteudo_comentarios
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_conteudo_comentarios_active_users_write"
on public.crm_conteudo_comentarios
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

create policy "crm_conteudo_historico_active_users_read"
on public.crm_conteudo_historico
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_conteudo_historico_active_users_write"
on public.crm_conteudo_historico
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

create policy "crm_conteudo_links_magicos_active_users_read"
on public.crm_conteudo_links_magicos
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_conteudo_links_magicos_active_users_write"
on public.crm_conteudo_links_magicos
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

create policy "crm_conteudo_briefings_active_users_read"
on public.crm_conteudo_briefings_proximo_mes
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_conteudo_briefings_active_users_write"
on public.crm_conteudo_briefings_proximo_mes
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());
