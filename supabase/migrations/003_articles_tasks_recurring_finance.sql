alter table public.crm_tarefas add column if not exists mes_arquivo text;
alter table public.crm_tarefas add column if not exists data_arquivamento timestamptz;
alter table public.crm_tarefas add column if not exists mes_referencia text;
alter table public.crm_tarefas add column if not exists quantidade_artigos integer not null default 0;
alter table public.crm_tarefas add column if not exists valor_unitario numeric(12, 2) not null default 0;
alter table public.crm_tarefas add column if not exists valor_total numeric(12, 2) not null default 0;
alter table public.crm_tarefas add column if not exists faturavel boolean not null default true;

alter table public.leads_formularios add column if not exists recorrente boolean not null default false;
alter table public.leads_formularios add column if not exists artigos_mensais integer not null default 0;
alter table public.leads_formularios add column if not exists valor_por_artigo numeric(12, 2) not null default 0;
alter table public.leads_formularios add column if not exists responsavel_padrao text;
alter table public.leads_formularios add column if not exists status_cliente text default 'ativo';

create index if not exists idx_crm_tarefas_mes_referencia on public.crm_tarefas(mes_referencia);
create index if not exists idx_crm_tarefas_mes_arquivo on public.crm_tarefas(mes_arquivo);
create index if not exists idx_crm_tarefas_faturavel on public.crm_tarefas(faturavel);
create index if not exists idx_crm_tarefas_cliente_mes_referencia on public.crm_tarefas(cliente_id, mes_referencia);
create index if not exists idx_leads_formularios_recorrente_status on public.leads_formularios(recorrente, status_cliente);
