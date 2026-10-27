create extension if not exists "pgcrypto";

create or replace function public.is_active_crm_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crm_usuarios
    where lower(email) = lower(auth.email())
      and ativo = true
  );
$$;

create or replace function public.is_crm_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crm_usuarios
    where lower(email) = lower(auth.email())
      and papel = 'dono'
      and ativo = true
  );
$$;

create table if not exists public.crm_usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  nome text not null,
  email text not null unique,
  papel text not null default 'funcionario' check (papel in ('dono', 'gestor', 'funcionario', 'cliente')),
  ativo boolean not null default true,
  convite_status text not null default 'ativo',
  convite_enviado_em timestamptz,
  ultimo_convite_em timestamptz,
  convite_aceito_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.crm_permissoes_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_email text not null,
  recurso_tipo text not null default 'pagina',
  recurso_id text not null,
  permissao text not null default 'visualizar',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (usuario_email, recurso_tipo, recurso_id, permissao)
);

create table if not exists public.crm_tarefas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  cliente_nome text,
  titulo text not null,
  descricao text,
  tipo text not null default 'tarefa',
  categoria text not null default 'operacional',
  status text not null default 'pendente',
  prioridade text not null default 'normal',
  data_vencimento date,
  hora_vencimento time,
  data_inicio date,
  data_conclusao timestamptz,
  responsavel text,
  responsavel_email text,
  criado_por text,
  criado_por_email text,
  recorrente boolean not null default false,
  recorrencia text,
  proxima_recorrencia date,
  mensalidade_referencia_mes integer,
  mensalidade_referencia_ano integer,
  valor_previsto numeric(12, 2),
  valor_pago numeric(12, 2),
  pago_em date,
  link_referencia text,
  observacoes text,
  origem text not null default 'manual',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.leads_formularios add column if not exists whatsapp text;
alter table public.leads_formularios add column if not exists cidade text;
alter table public.leads_formularios add column if not exists contato_principal text;
alter table public.leads_formularios add column if not exists status_cliente text;
alter table public.leads_formularios add column if not exists convertido_em timestamptz;
alter table public.leads_formularios add column if not exists arquivado_em timestamptz;
alter table public.leads_formularios add column if not exists data_inicio_cliente date;
alter table public.leads_formularios add column if not exists responsavel_cliente text;
alter table public.leads_formularios add column if not exists proxima_acao text;
alter table public.leads_formularios add column if not exists ultima_acao text;
alter table public.leads_formularios add column if not exists mensalidade numeric(12, 2);
alter table public.leads_formularios add column if not exists dia_vencimento integer;
alter table public.leads_formularios add column if not exists status_financeiro text default 'nao_informado';
alter table public.leads_formularios add column if not exists meses_estimados_contrato integer default 12;
alter table public.leads_formularios add column if not exists servico_contratado text;
alter table public.leads_formularios add column if not exists plano_contratado text;
alter table public.leads_formularios add column if not exists documento_url text;
alter table public.leads_formularios add column if not exists briefing_url text;
alter table public.leads_formularios add column if not exists estrategia_url text;
alter table public.leads_formularios add column if not exists contrato_url text;
alter table public.leads_formularios add column if not exists financeiro_url text;
alter table public.leads_formularios add column if not exists conteudos_url text;
alter table public.leads_formularios add column if not exists tarefas_url text;
alter table public.leads_formularios add column if not exists relatorios_url text;
alter table public.leads_formularios add column if not exists acessos_url text;
alter table public.leads_formularios add column if not exists drive_url text;
alter table public.leads_formularios add column if not exists historico_url text;
alter table public.leads_formularios add column if not exists observacoes_cliente text;

create index if not exists idx_crm_usuarios_email on public.crm_usuarios(lower(email));
create index if not exists idx_crm_permissoes_usuario_email on public.crm_permissoes_usuario(lower(usuario_email));
create index if not exists idx_crm_tarefas_cliente_id on public.crm_tarefas(cliente_id);
create index if not exists idx_crm_tarefas_vencimento on public.crm_tarefas(data_vencimento);
create index if not exists idx_crm_tarefas_status on public.crm_tarefas(status);
create index if not exists idx_leads_formularios_status_cliente on public.leads_formularios(status, status_cliente);

alter table public.leads_formularios enable row level security;
alter table public.crm_usuarios enable row level security;
alter table public.crm_permissoes_usuario enable row level security;
alter table public.crm_tarefas enable row level security;

drop policy if exists "crm_leads_public_insert" on public.leads_formularios;
drop policy if exists "crm_leads_active_users_read" on public.leads_formularios;
drop policy if exists "crm_leads_active_users_write" on public.leads_formularios;

create policy "crm_leads_public_insert"
on public.leads_formularios
for insert
to anon, authenticated
with check (true);

create policy "crm_leads_active_users_read"
on public.leads_formularios
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_leads_active_users_write"
on public.leads_formularios
for update
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());

drop policy if exists "crm_usuarios_self_or_owner_read" on public.crm_usuarios;
drop policy if exists "crm_usuarios_owner_write" on public.crm_usuarios;

create policy "crm_usuarios_self_or_owner_read"
on public.crm_usuarios
for select
to authenticated
using (lower(email) = lower(auth.email()) or public.is_crm_owner());

create policy "crm_usuarios_owner_write"
on public.crm_usuarios
for all
to authenticated
using (public.is_crm_owner())
with check (public.is_crm_owner());

drop policy if exists "crm_permissoes_self_or_owner_read" on public.crm_permissoes_usuario;
drop policy if exists "crm_permissoes_owner_write" on public.crm_permissoes_usuario;

create policy "crm_permissoes_self_or_owner_read"
on public.crm_permissoes_usuario
for select
to authenticated
using (lower(usuario_email) = lower(auth.email()) or public.is_crm_owner());

create policy "crm_permissoes_owner_write"
on public.crm_permissoes_usuario
for all
to authenticated
using (public.is_crm_owner())
with check (public.is_crm_owner());

drop policy if exists "crm_tarefas_active_users_read" on public.crm_tarefas;
drop policy if exists "crm_tarefas_active_users_write" on public.crm_tarefas;

create policy "crm_tarefas_active_users_read"
on public.crm_tarefas
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_tarefas_active_users_write"
on public.crm_tarefas
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());
