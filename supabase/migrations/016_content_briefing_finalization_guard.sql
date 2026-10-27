create or replace function public.submit_content_magic_briefing(
  p_token_hash text,
  p_servico_produto_destaque text default null,
  p_campanha_evento_data text default null,
  p_perguntas_frequentes_clientes text default null,
  p_observacoes_equipe text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.crm_conteudo_links_magicos%rowtype;
  v_delivery public.crm_conteudo_entregas%rowtype;
begin
  select *
  into v_link
  from public.crm_conteudo_links_magicos
  where token_hash = p_token_hash
  limit 1;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if not coalesce(v_link.ativo, false) then
    return jsonb_build_object('status', 'inactive');
  end if;

  if v_link.expira_em is not null and v_link.expira_em < now() then
    return jsonb_build_object('status', 'expired');
  end if;

  select *
  into v_delivery
  from public.crm_conteudo_entregas
  where id = v_link.entrega_id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_delivery.revisao_concluida_em is not null then
    return jsonb_build_object('status', 'error', 'message', 'Esta revisao ja foi finalizada e esta em modo leitura.');
  end if;

  insert into public.crm_conteudo_briefings_proximo_mes (
    entrega_id,
    cliente_id,
    servico_produto_destaque,
    campanha_evento_data,
    perguntas_frequentes_clientes,
    observacoes_equipe,
    origem,
    enviado_em
  ) values (
    v_link.entrega_id,
    v_link.cliente_id,
    nullif(trim(coalesce(p_servico_produto_destaque, '')), ''),
    nullif(trim(coalesce(p_campanha_evento_data, '')), ''),
    nullif(trim(coalesce(p_perguntas_frequentes_clientes, '')), ''),
    nullif(trim(coalesce(p_observacoes_equipe, '')), ''),
    'link_magico',
    now()
  );

  update public.crm_conteudo_entregas
  set briefing_proximo_mes_status = 'enviado',
      briefing_proximo_mes_enviado_em = now(),
      atualizado_em = now()
  where id = v_link.entrega_id;

  insert into public.crm_conteudo_historico (
    item_id,
    entrega_id,
    cliente_id,
    evento,
    status_anterior,
    status_novo,
    autor_nome,
    autor_tipo,
    origem,
    observacao,
    data_decisao
  ) values (
    null,
    v_link.entrega_id,
    v_link.cliente_id,
    'briefing_proximo_mes_enviado',
    v_delivery.briefing_proximo_mes_status,
    'enviado',
    'Cliente',
    'cliente',
    'link_magico',
    'Sugestoes para o proximo mes enviadas pelo cliente.',
    now()
  );

  return public.get_content_magic_review(p_token_hash);
end;
$$;

grant execute on function public.submit_content_magic_briefing(text, text, text, text, text) to anon, authenticated;
