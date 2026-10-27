alter table public.crm_conteudo_entregas
  add column if not exists servicos_priorizados text,
  add column if not exists objetivos_seo text,
  add column if not exists observacoes_cliente text;
