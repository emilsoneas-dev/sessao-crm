create extension if not exists "pgcrypto";

alter table public.crm_instagram_perfis
  add column if not exists meta_connection_status text not null default 'desconectado',
  add column if not exists meta_token_expires_at timestamptz,
  add column if not exists meta_scopes text[] not null default '{}',
  add column if not exists meta_error text,
  add column if not exists meta_connected_by text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crm_instagram_perfis_meta_connection_status_check'
  ) then
    alter table public.crm_instagram_perfis
      add constraint crm_instagram_perfis_meta_connection_status_check
      check (meta_connection_status in ('desconectado', 'pendente', 'conectado', 'expirado', 'erro'));
  end if;
end $$;

create table if not exists public.crm_instagram_conexoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,
  instagram_perfil_id uuid not null references public.crm_instagram_perfis(id) on delete cascade,

  provider text not null default 'instagram'
    check (provider in ('instagram')),
  meta_user_id text,
  meta_account_id text,
  username text,
  access_token text not null,
  token_type text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  status text not null default 'ativa'
    check (status in ('ativa', 'expirada', 'revogada', 'erro')),
  last_sync_at timestamptz,
  last_error text,

  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists idx_crm_instagram_conexoes_perfil
on public.crm_instagram_conexoes(instagram_perfil_id);

create index if not exists idx_crm_instagram_conexoes_cliente_id
on public.crm_instagram_conexoes(cliente_id);

create index if not exists idx_crm_instagram_conexoes_status
on public.crm_instagram_conexoes(status);

alter table public.crm_instagram_conexoes enable row level security;

create table if not exists public.crm_instagram_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,
  instagram_perfil_id uuid not null references public.crm_instagram_perfis(id) on delete cascade,
  redirect_to text,
  criado_por text,
  expira_em timestamptz not null default (now() + interval '15 minutes'),
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists idx_crm_instagram_oauth_states_perfil
on public.crm_instagram_oauth_states(instagram_perfil_id);

create index if not exists idx_crm_instagram_oauth_states_expira
on public.crm_instagram_oauth_states(expira_em);

alter table public.crm_instagram_oauth_states enable row level security;
