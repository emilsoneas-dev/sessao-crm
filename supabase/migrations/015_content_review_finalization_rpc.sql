create or replace function public.submit_content_magic_review_action(
  p_token_hash text,
  p_item_id uuid,
  p_action text,
  p_comment text default null,
  p_author_name text default 'Cliente'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.crm_conteudo_links_magicos%rowtype;
  v_delivery public.crm_conteudo_entregas%rowtype;
  v_item public.crm_conteudo_itens%rowtype;
  v_previous_status text;
  v_new_status text;
  v_comment text;
  v_action text;
  v_reviewed_count integer;
  v_approved_count integer;
  v_revision_count integer;
  v_published_count integer;
  v_total_count integer;
  v_delivery_status text;
begin
  v_action := lower(trim(coalesce(p_action, '')));
  v_comment := nullif(trim(coalesce(p_comment, '')), '');

  if v_action not in ('aprovar', 'revisar', 'comentar') then
    return jsonb_build_object('status', 'error', 'message', 'Acao invalida.');
  end if;

  if v_action in ('revisar', 'comentar') and v_comment is null then
    return jsonb_build_object('status', 'error', 'message', 'Informe um comentario para continuar.');
  end if;

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

  select *
  into v_item
  from public.crm_conteudo_itens
  where id = p_item_id
    and entrega_id = v_link.entrega_id
    and cliente_id = v_link.cliente_id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'error', 'message', 'Conteudo nao encontrado neste link.');
  end if;

  v_previous_status := v_item.status;

  if v_action = 'aprovar' then
    v_new_status := 'aprovado';

    update public.crm_conteudo_itens
    set status = v_new_status,
        aprovado_em = now(),
        aprovado_por = coalesce(nullif(trim(p_author_name), ''), 'Cliente'),
        ultima_decisao_em = now(),
        atualizado_em = now()
    where id = v_item.id;
  elsif v_action = 'revisar' then
    v_new_status := 'revisar';

    update public.crm_conteudo_itens
    set status = v_new_status,
        revisar_em = now(),
        ultima_decisao_em = now(),
        ultimo_comentario_cliente_em = now(),
        atualizado_em = now()
    where id = v_item.id;
  else
    v_new_status := v_previous_status;

    update public.crm_conteudo_itens
    set ultimo_comentario_cliente_em = now(),
        atualizado_em = now()
    where id = v_item.id;
  end if;

  if v_comment is not null then
    insert into public.crm_conteudo_comentarios (
      item_id,
      entrega_id,
      cliente_id,
      autor_nome,
      autor_tipo,
      mensagem,
      origem,
      tipo_interacao
    ) values (
      v_item.id,
      v_item.entrega_id,
      v_item.cliente_id,
      coalesce(nullif(trim(p_author_name), ''), 'Cliente'),
      'cliente',
      v_comment,
      'link_magico',
      case
        when v_action = 'revisar' then 'revisao'
        when v_action = 'aprovar' then 'aprovacao'
        else 'comentario'
      end
    );
  end if;

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
    v_item.id,
    v_item.entrega_id,
    v_item.cliente_id,
    case
      when v_action = 'aprovar' then 'conteudo_aprovado'
      when v_action = 'revisar' then 'conteudo_enviado_para_revisao'
      else 'comentario_criado'
    end,
    v_previous_status,
    v_new_status,
    coalesce(nullif(trim(p_author_name), ''), 'Cliente'),
    'cliente',
    'link_magico',
    v_comment,
    now()
  );

  select
    count(*)::integer,
    count(*) filter (where status in ('aprovado', 'revisar', 'publicado'))::integer,
    count(*) filter (where status = 'aprovado')::integer,
    count(*) filter (where status = 'revisar')::integer,
    count(*) filter (where status = 'publicado')::integer
  into
    v_total_count,
    v_reviewed_count,
    v_approved_count,
    v_revision_count,
    v_published_count
  from public.crm_conteudo_itens
  where entrega_id = v_item.entrega_id;

  v_delivery_status := case
    when v_total_count > 0 and v_reviewed_count >= v_total_count and v_revision_count > 0 then 'revisar'
    when v_total_count > 0 and v_reviewed_count >= v_total_count then 'aprovado'
    when v_reviewed_count > 0 then 'em_revisao'
    else v_delivery.status
  end;

  update public.crm_conteudo_entregas
  set quantidade_aprovada = v_approved_count,
      quantidade_revisada = v_revision_count,
      quantidade_publicada = v_published_count,
      status = v_delivery_status,
      atualizado_em = now()
  where id = v_item.entrega_id;

  return public.get_content_magic_review(p_token_hash);
end;
$$;

create or replace function public.finalize_content_magic_review(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.crm_conteudo_links_magicos%rowtype;
  v_delivery public.crm_conteudo_entregas%rowtype;
  v_reviewed_count integer;
  v_approved_count integer;
  v_revision_count integer;
  v_published_count integer;
  v_total_count integer;
  v_new_status text;
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

  select
    count(*)::integer,
    count(*) filter (where status in ('aprovado', 'revisar', 'publicado'))::integer,
    count(*) filter (where status = 'aprovado')::integer,
    count(*) filter (where status = 'revisar')::integer,
    count(*) filter (where status = 'publicado')::integer
  into
    v_total_count,
    v_reviewed_count,
    v_approved_count,
    v_revision_count,
    v_published_count
  from public.crm_conteudo_itens
  where entrega_id = v_delivery.id;

  if v_total_count = 0 then
    return jsonb_build_object('status', 'error', 'message', 'Nao existem conteudos nesta entrega para finalizar.');
  end if;

  if v_reviewed_count < v_total_count then
    return jsonb_build_object('status', 'error', 'message', 'Finalize apenas depois de revisar todos os conteudos.');
  end if;

  v_new_status := case
    when v_revision_count > 0 then 'revisar'
    else 'aprovado'
  end;

  update public.crm_conteudo_entregas
  set quantidade_aprovada = v_approved_count,
      quantidade_revisada = v_revision_count,
      quantidade_publicada = v_published_count,
      status = v_new_status,
      revisao_concluida_em = coalesce(revisao_concluida_em, now()),
      atualizado_em = now()
  where id = v_delivery.id;

  if v_delivery.revisao_concluida_em is null then
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
      v_delivery.id,
      v_delivery.cliente_id,
      'revisao_concluida',
      v_delivery.status,
      v_new_status,
      'Cliente',
      'cliente',
      'link_magico',
      'Cliente concluiu a revisao da entrega ' || coalesce(v_delivery.titulo, 'sem titulo') || '.',
      now()
    );
  end if;

  return public.get_content_magic_review(p_token_hash);
end;
$$;

grant execute on function public.submit_content_magic_review_action(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.finalize_content_magic_review(text) to anon, authenticated;
