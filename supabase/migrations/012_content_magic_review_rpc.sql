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
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_content_magic_review(text) to anon, authenticated;
