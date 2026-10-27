create or replace function public.get_instagram_magic_preview(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.crm_instagram_links_magicos%rowtype;
  v_profile jsonb;
  v_posts jsonb;
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

  update public.crm_instagram_links_magicos
    set ultimo_acesso_em = now()
  where id = v_link.id;

  select jsonb_build_object(
    'id', perfil.id,
    'cliente_id', perfil.cliente_id,
    'nome', perfil.nome,
    'usuario', perfil.usuario,
    'bio', perfil.bio,
    'site', perfil.site,
    'foto_url', perfil.foto_url,
    'seguidores', perfil.seguidores,
    'seguindo', perfil.seguindo,
    'publicacoes', perfil.publicacoes,
    'cliente_nome', coalesce(cliente.nome, cliente.empresa, 'Cliente')
  )
    into v_profile
  from public.crm_instagram_perfis perfil
  left join public.leads_formularios cliente on cliente.id = perfil.cliente_id
  where perfil.id = v_link.instagram_perfil_id
    and perfil.ativo = true
  limit 1;

  if v_profile is null then
    return jsonb_build_object('status', 'invalid');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', post.id,
        'tipo', post.tipo,
        'midia_url', post.midia_url,
        'thumbnail_url', post.thumbnail_url,
        'titulo_interno', post.titulo_interno,
        'legenda', post.legenda,
        'cta', post.cta,
        'hashtags', post.hashtags,
        'data_prevista', post.data_prevista,
        'hora_prevista', post.hora_prevista,
        'mes_referencia', post.mes_referencia,
        'status', post.status,
        'status_aprovacao', post.status_aprovacao,
        'aprovado_em', post.aprovado_em,
        'reprovado_em', post.reprovado_em,
        'ajuste_solicitado_em', post.ajuste_solicitado_em,
        'alcance', post.alcance,
        'impressoes', post.impressoes,
        'curtidas', post.curtidas,
        'comentarios_total', post.comentarios_total,
        'compartilhamentos', post.compartilhamentos,
        'salvamentos', post.salvamentos,
        'visualizacoes', post.visualizacoes,
        'comentarios', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', comentario.id,
              'autor_nome', comentario.autor_nome,
              'autor_tipo', comentario.autor_tipo,
              'mensagem', comentario.mensagem,
              'origem', comentario.origem,
              'criado_em', comentario.criado_em
            )
            order by comentario.criado_em asc
          )
          from public.crm_instagram_comentarios comentario
          where comentario.post_id = post.id
        ), '[]'::jsonb)
      )
      order by post.data_prevista asc nulls last, post.hora_prevista asc nulls last, post.criado_em desc
    ),
    '[]'::jsonb
  )
    into v_posts
  from public.crm_instagram_posts post
  where post.instagram_perfil_id = v_link.instagram_perfil_id
    and post.status <> 'arquivado';

  return jsonb_build_object(
    'status', 'ok',
    'profile', v_profile,
    'posts', v_posts,
    'link', jsonb_build_object(
      'id', v_link.id,
      'escopo', v_link.escopo,
      'expira_em', v_link.expira_em
    )
  );
end;
$$;

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

  if v_action not in ('aprovar', 'reprovar', 'solicitar_ajuste') then
    return jsonb_build_object('status', 'invalid_action');
  end if;

  if v_action in ('reprovar', 'solicitar_ajuste') and v_comment = '' then
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
  else
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

grant execute on function public.get_instagram_magic_preview(text) to anon;
grant execute on function public.get_instagram_magic_preview(text) to authenticated;
grant execute on function public.submit_instagram_magic_approval(text, uuid, text, text) to anon;
grant execute on function public.submit_instagram_magic_approval(text, uuid, text, text) to authenticated;
