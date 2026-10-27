create extension if not exists "pgcrypto";

create table if not exists public.crm_instagram_perfis (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,

  foto_url text,
  nome text,
  usuario text,
  bio text,
  site text,

  seguidores integer not null default 0,
  seguindo integer not null default 0,
  publicacoes integer not null default 0,
  alcance integer not null default 0,
  impressoes integer not null default 0,
  engajamento numeric(8, 2) not null default 0,
  metricas_origem text not null default 'manual'
    check (metricas_origem in ('manual', 'simulada', 'meta_api')),

  meta_account_id text,
  meta_user_id text,
  meta_connected_at timestamptz,
  meta_last_sync_at timestamptz,

  ativo boolean not null default true,
  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.crm_instagram_posts (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,
  instagram_perfil_id uuid not null references public.crm_instagram_perfis(id) on delete cascade,

  tipo text not null default 'feed'
    check (tipo in ('feed', 'reels', 'story', 'carrossel')),
  midia_url text,
  thumbnail_url text,
  legenda text,
  roteiro text,
  data_prevista date,
  mes_referencia text,

  status text not null default 'rascunho'
    check (status in (
      'rascunho',
      'em_revisao',
      'aprovado',
      'reprovado',
      'ajuste_solicitado',
      'publicado',
      'arquivado'
    )),
  status_aprovacao text not null default 'em_revisao'
    check (status_aprovacao in (
      'em_revisao',
      'aprovado',
      'reprovado',
      'ajuste_solicitado'
    )),
  comentarios_resumo text,

  metricas_origem text not null default 'manual'
    check (metricas_origem in ('manual', 'simulada', 'meta_api')),
  alcance integer not null default 0,
  impressoes integer not null default 0,
  curtidas integer not null default 0,
  comentarios_total integer not null default 0,
  compartilhamentos integer not null default 0,
  salvamentos integer not null default 0,
  visualizacoes integer not null default 0,

  aprovado_em timestamptz,
  aprovado_por text,
  reprovado_em timestamptz,
  ajuste_solicitado_em timestamptz,

  meta_media_id text,
  meta_permalink text,
  meta_published_at timestamptz,
  meta_last_sync_at timestamptz,

  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.crm_instagram_comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.crm_instagram_posts(id) on delete cascade,
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,

  autor_nome text,
  autor_tipo text not null default 'agencia'
    check (autor_tipo in ('agencia', 'cliente')),
  mensagem text not null,
  origem text not null default 'crm'
    check (origem in ('crm', 'link_magico')),

  criado_em timestamptz not null default now()
);

create table if not exists public.crm_instagram_links_magicos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,
  instagram_perfil_id uuid references public.crm_instagram_perfis(id) on delete cascade,

  token_hash text not null unique,
  escopo text not null default 'perfil'
    check (escopo in ('perfil', 'post', 'campanha')),
  ativo boolean not null default true,
  expira_em timestamptz,

  criado_por text,
  criado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz
);

create index if not exists idx_crm_instagram_perfis_cliente_id
on public.crm_instagram_perfis(cliente_id);

create unique index if not exists idx_crm_instagram_perfis_cliente_usuario_ativo
on public.crm_instagram_perfis(cliente_id, lower(usuario))
where usuario is not null and ativo = true;

create index if not exists idx_crm_instagram_posts_cliente_id
on public.crm_instagram_posts(cliente_id);

create index if not exists idx_crm_instagram_posts_perfil_id
on public.crm_instagram_posts(instagram_perfil_id);

create index if not exists idx_crm_instagram_posts_status_aprovacao
on public.crm_instagram_posts(status_aprovacao);

create index if not exists idx_crm_instagram_posts_data_prevista
on public.crm_instagram_posts(data_prevista);

create index if not exists idx_crm_instagram_posts_mes_referencia
on public.crm_instagram_posts(mes_referencia);

create index if not exists idx_crm_instagram_posts_tipo
on public.crm_instagram_posts(tipo);

create index if not exists idx_crm_instagram_comentarios_post_id
on public.crm_instagram_comentarios(post_id);

create index if not exists idx_crm_instagram_comentarios_cliente_id
on public.crm_instagram_comentarios(cliente_id);

create index if not exists idx_crm_instagram_links_magicos_cliente_id
on public.crm_instagram_links_magicos(cliente_id);

create index if not exists idx_crm_instagram_links_magicos_perfil_id
on public.crm_instagram_links_magicos(instagram_perfil_id);

create index if not exists idx_crm_instagram_links_magicos_ativo_expira
on public.crm_instagram_links_magicos(ativo, expira_em);

alter table public.crm_instagram_perfis enable row level security;
alter table public.crm_instagram_posts enable row level security;
alter table public.crm_instagram_comentarios enable row level security;
alter table public.crm_instagram_links_magicos enable row level security;

drop policy if exists "crm_instagram_perfis_active_users_read" on public.crm_instagram_perfis;
drop policy if exists "crm_instagram_perfis_active_users_write" on public.crm_instagram_perfis;
drop policy if exists "crm_instagram_posts_active_users_read" on public.crm_instagram_posts;
drop policy if exists "crm_instagram_posts_active_users_write" on public.crm_instagram_posts;
drop policy if exists "crm_instagram_comentarios_active_users_read" on public.crm_instagram_comentarios;
drop policy if exists "crm_instagram_comentarios_active_users_write" on public.crm_instagram_comentarios;
drop policy if exists "crm_instagram_links_magicos_active_users_read" on public.crm_instagram_links_magicos;
drop policy if exists "crm_instagram_links_magicos_active_users_write" on public.crm_instagram_links_magicos;

create policy "crm_instagram_perfis_active_users_read"
on public.crm_instagram_perfis
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_instagram_perfis_active_users_write"
on public.crm_instagram_perfis
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

create policy "crm_instagram_posts_active_users_read"
on public.crm_instagram_posts
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_instagram_posts_active_users_write"
on public.crm_instagram_posts
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

create policy "crm_instagram_comentarios_active_users_read"
on public.crm_instagram_comentarios
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_instagram_comentarios_active_users_write"
on public.crm_instagram_comentarios
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

create policy "crm_instagram_links_magicos_active_users_read"
on public.crm_instagram_links_magicos
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_instagram_links_magicos_active_users_write"
on public.crm_instagram_links_magicos
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());
