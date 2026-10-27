create extension if not exists "pgcrypto";

create table if not exists public.leads_formularios (
  id uuid primary key default gen_random_uuid(),

  nome text,
  email text,
  telefone text,
  empresa text,
  servico_interesse text,
  mensagem text,

  origem text default 'site',
  etapa text default 'entrou',
  status text default 'novo',
  prioridade text default 'normal',
  observacoes text,
  responsavel text,

  data_entrada timestamptz default now(),
  data_ultima_atualizacao timestamptz default now()
);

alter table public.leads_formularios add column if not exists nome text;
alter table public.leads_formularios add column if not exists email text;
alter table public.leads_formularios add column if not exists telefone text;
alter table public.leads_formularios add column if not exists empresa text;
alter table public.leads_formularios add column if not exists servico_interesse text;
alter table public.leads_formularios add column if not exists mensagem text;
alter table public.leads_formularios add column if not exists origem text default 'site';
alter table public.leads_formularios add column if not exists etapa text default 'entrou';
alter table public.leads_formularios add column if not exists status text default 'novo';
alter table public.leads_formularios add column if not exists prioridade text default 'normal';
alter table public.leads_formularios add column if not exists observacoes text;
alter table public.leads_formularios add column if not exists responsavel text;
alter table public.leads_formularios add column if not exists data_entrada timestamptz default now();
alter table public.leads_formularios add column if not exists data_ultima_atualizacao timestamptz default now();

create index if not exists idx_leads_formularios_etapa
on public.leads_formularios(etapa);

create index if not exists idx_leads_formularios_data_entrada
on public.leads_formularios(data_entrada desc);

create index if not exists idx_leads_formularios_status
on public.leads_formularios(status);

update public.leads_formularios
set etapa = 'entrou'
where etapa is null
   or etapa = ''
   or etapa not in (
    'entrou',
    'qualificacao',
    'diagnostico',
    'proposta_enviada',
    'negociacao',
    'conclusao'
   );

alter table public.leads_formularios disable row level security;