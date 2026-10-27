create table if not exists public.crm_instagram_planejamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.leads_formularios(id) on delete cascade,
  instagram_perfil_id uuid not null references public.crm_instagram_perfis(id) on delete cascade,

  mes_referencia text not null,
  estrategia_mensal text,
  objetivo_mes text,
  tom_comunicacao text,
  pilares_conteudo text,
  observacoes text,

  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_planejamento', 'em_execucao', 'concluido', 'pausado')),

  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists idx_crm_instagram_planejamentos_perfil_mes
on public.crm_instagram_planejamentos(instagram_perfil_id, mes_referencia);

create index if not exists idx_crm_instagram_planejamentos_cliente_id
on public.crm_instagram_planejamentos(cliente_id);

create index if not exists idx_crm_instagram_planejamentos_mes
on public.crm_instagram_planejamentos(mes_referencia);

create index if not exists idx_crm_instagram_planejamentos_status
on public.crm_instagram_planejamentos(status);

alter table public.crm_instagram_planejamentos enable row level security;

drop policy if exists "crm_instagram_planejamentos_active_users_read" on public.crm_instagram_planejamentos;
drop policy if exists "crm_instagram_planejamentos_active_users_write" on public.crm_instagram_planejamentos;

create policy "crm_instagram_planejamentos_active_users_read"
on public.crm_instagram_planejamentos
for select
to authenticated
using (public.is_active_crm_user());

create policy "crm_instagram_planejamentos_active_users_write"
on public.crm_instagram_planejamentos
for all
to authenticated
using (public.is_active_crm_user())
with check (public.is_active_crm_user());
