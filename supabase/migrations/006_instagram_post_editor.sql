alter table public.crm_instagram_posts
  add column if not exists titulo_interno text,
  add column if not exists cta text,
  add column if not exists hashtags text,
  add column if not exists hora_prevista time,
  add column if not exists responsavel text,
  add column if not exists observacoes_internas text;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'crm_instagram_posts'
      and constraint_name = 'crm_instagram_posts_status_check'
  ) then
    alter table public.crm_instagram_posts
      drop constraint crm_instagram_posts_status_check;
  end if;
end $$;

alter table public.crm_instagram_posts
  add constraint crm_instagram_posts_status_check
  check (status in (
    'rascunho',
    'em_revisao',
    'aprovado',
    'agendado',
    'reprovado',
    'ajuste_solicitado',
    'publicado',
    'arquivado'
  ));
