create or replace function public.get_content_magic_review(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.crm_conteudo_links_magicos%rowtype;
  v_delivery public.crm_conteudo_entregas%rowtype;
  v_client jsonb;
  v_items jsonb;
  v_comments jsonb;
  v_history jsonb;
  v_briefings jsonb;
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

  update public.crm_conteudo_links_magicos
  set ultimo_acesso_em = now()
  where id = v_link.id;

  select jsonb_build_object(
    'id', cliente.id,
    'nome', cliente.nome,
    'empresa', cliente.empresa,
    'email', cliente.email
  )
  into v_client
  from public.leads_formularios cliente
  where cliente.id = v_link.cliente_id
  limit 1;

  select coalesce(
    jsonb_agg(to_jsonb(item) order by item.ordem asc, item.criado_em asc),
    '[]'::jsonb
  )
  into v_items
  from public.crm_conteudo_itens item
  where item.entrega_id = v_delivery.id;

  select coalesce(
    jsonb_agg(to_jsonb(comentario) order by comentario.criado_em asc),
    '[]'::jsonb
  )
  into v_comments
  from public.crm_conteudo_comentarios comentario
  where comentario.entrega_id = v_delivery.id;

  select coalesce(
    jsonb_agg(to_jsonb(historico) order by historico.criado_em asc),
    '[]'::jsonb
  )
  into v_history
  from public.crm_conteudo_historico historico
  where historico.entrega_id = v_delivery.id;

  select coalesce(
    jsonb_agg(to_jsonb(briefing) order by briefing.enviado_em desc),
    '[]'::jsonb
  )
  into v_briefings
  from public.crm_conteudo_briefings_proximo_mes briefing
  where briefing.entrega_id = v_delivery.id;

  return jsonb_build_object(
    'status', 'ok',
    'link', jsonb_build_object(
      'id', v_link.id,
      'escopo', v_link.escopo,
      'ativo', v_link.ativo,
      'expira_em', v_link.expira_em,
      'criado_em', v_link.criado_em,
      'ultimo_acesso_em', now()
    ),
    'client', coalesce(v_client, '{}'::jsonb),
    'delivery', to_jsonb(v_delivery),
    'items', coalesce(v_items, '[]'::jsonb),
    'comments', coalesce(v_comments, '[]'::jsonb),
    'history', coalesce(v_history, '[]'::jsonb),
    'briefings', coalesce(v_briefings, '[]'::jsonb)
  );
end;
$$;

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

grant execute on function public.get_content_magic_review(text) to anon, authenticated;
grant execute on function public.submit_content_magic_briefing(text, text, text, text, text) to anon, authenticated;
