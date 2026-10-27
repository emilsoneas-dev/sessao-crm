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
        'alcance', post.alcance,
        'impressoes', post.impressoes,
        'curtidas', post.curtidas,
        'comentarios_total', post.comentarios_total,
        'compartilhamentos', post.compartilhamentos,
        'salvamentos', post.salvamentos,
        'visualizacoes', post.visualizacoes
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

grant execute on function public.get_instagram_magic_preview(text) to anon;
grant execute on function public.get_instagram_magic_preview(text) to authenticated;
