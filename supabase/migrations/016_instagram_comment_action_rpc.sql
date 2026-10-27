create or replace function public.submit_instagram_magic_approval(
  p_token_hash text,
  p_post_id uuid,
  p_action text,
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.crm_instagram_links_magicos%rowtype;
  v_post public.crm_instagram_posts%rowtype;
  v_action text := lower(trim(coalesce(p_action, '')));
  v_comment text := trim(coalesce(p_comment, ''));
  v_status text;
  v_default_comment text;
begin
  select *
    into v_link
  from public.crm_instagram_links_magicos
  where token_hash = p_token_hash
  limit 1;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if coalesce(v_link.ativo, false) = false then
    return jsonb_build_object('status', 'inactive');
  end if;

  if v_link.expira_em is not null and v_link.expira_em < now() then
    return jsonb_build_object('status', 'expired');
  end if;

  if v_action not in ('aprovar', 'reprovar', 'solicitar_ajuste', 'comentar') then
    return jsonb_build_object('status', 'invalid_action');
  end if;

  if v_action in ('reprovar', 'solicitar_ajuste', 'comentar') and v_comment = '' then
    return jsonb_build_object('status', 'comment_required');
  end if;

  select *
    into v_post
  from public.crm_instagram_posts
  where id = p_post_id
    and instagram_perfil_id = v_link.instagram_perfil_id
    and status <> 'arquivado'
  limit 1;

  if not found then
    return jsonb_build_object('status', 'post_not_found');
  end if;

  if v_action = 'aprovar' then
    v_status := 'aprovado';
    v_default_comment := 'Post aprovado pelo cliente.';

    update public.crm_instagram_posts
      set status = v_status,
          status_aprovacao = v_status,
          aprovado_em = now(),
          aprovado_por = 'cliente_link_magico',
          reprovado_em = null,
          ajuste_solicitado_em = null,
          atualizado_em = now()
    where id = p_post_id;
  elsif v_action = 'reprovar' then
    v_status := 'reprovado';
    v_default_comment := 'Post reprovado pelo cliente.';

    update public.crm_instagram_posts
      set status = v_status,
          status_aprovacao = v_status,
          reprovado_em = now(),
          aprovado_em = null,
          aprovado_por = null,
          ajuste_solicitado_em = null,
          atualizado_em = now()
    where id = p_post_id;
  elsif v_action = 'solicitar_ajuste' then
    v_status := 'ajuste_solicitado';
    v_default_comment := 'Cliente solicitou ajuste no post.';

    update public.crm_instagram_posts
      set status = v_status,
          status_aprovacao = v_status,
          ajuste_solicitado_em = now(),
          aprovado_em = null,
          aprovado_por = null,
          reprovado_em = null,
          atualizado_em = now()
    where id = p_post_id;
  else
    v_status := coalesce(v_post.status_aprovacao, v_post.status, 'aguardando_aprovacao');
    v_default_comment := '';
  end if;

  insert into public.crm_instagram_comentarios (
    post_id,
    cliente_id,
    autor_nome,
    autor_tipo,
    mensagem,
    origem
  )
  values (
    p_post_id,
    v_link.cliente_id,
    'Cliente',
    'cliente',
    coalesce(nullif(v_comment, ''), v_default_comment),
    'link_magico'
  );

  update public.crm_instagram_links_magicos
    set ultimo_acesso_em = now()
  where id = v_link.id;

  return jsonb_build_object(
    'status', 'ok',
    'post_id', p_post_id,
    'post_status', v_status
  );
end;
$$;

grant execute on function public.submit_instagram_magic_approval(text, uuid, text, text) to anon;
grant execute on function public.submit_instagram_magic_approval(text, uuid, text, text) to authenticated;
