import {
  publicSupabaseAnonKey,
  publicSupabaseUrl,
  supabase,
} from '../../../services/supabase/supabaseClient.js';

const INSTAGRAM_PROFILES_TABLE = 'crm_instagram_perfis';
const INSTAGRAM_PLANNING_TABLE = 'crm_instagram_planejamentos';
const INSTAGRAM_POSTS_TABLE = 'crm_instagram_posts';
const INSTAGRAM_COMMENTS_TABLE = 'crm_instagram_comentarios';
const INSTAGRAM_MAGIC_LINKS_TABLE = 'crm_instagram_links_magicos';

export async function fetchActiveInstagramProfiles() {
  const { data, error } = await supabase
    .from(INSTAGRAM_PROFILES_TABLE)
    .select(`
      *,
      cliente:leads_formularios (
        id,
        nome,
        empresa,
        email,
        telefone,
        whatsapp,
        status_cliente,
        artigos_mensais,
        responsavel_cliente,
        responsavel_padrao,
        data_ultima_atualizacao
      )
    `)
    .eq('ativo', true)
    .order('atualizado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchActiveInstagramProfileByClient(clientId) {
  if (!clientId) return null;

  const { data, error } = await supabase
    .from(INSTAGRAM_PROFILES_TABLE)
    .select('*')
    .eq('cliente_id', clientId)
    .eq('ativo', true)
    .order('criado_em', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function activateInstagramProfileForClient(client, createdBy = '') {
  if (!client?.id) {
    throw new Error('Cliente invalido para ativar Instagram.');
  }

  const existingProfile = await fetchActiveInstagramProfileByClient(client.id);

  if (existingProfile) {
    return existingProfile;
  }

  const now = new Date().toISOString();
  const payload = {
    cliente_id: client.id,
    nome: cleanText(client.nome || client.empresa || 'Perfil Instagram'),
    usuario: '',
    bio: '',
    site: '',
    foto_url: '',
    metricas_origem: 'manual',
    ativo: true,
    criado_por: cleanText(createdBy),
    atualizado_em: now,
  };

  const { data, error } = await supabase
    .from(INSTAGRAM_PROFILES_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateInstagramProfile(profileId, profile) {
  if (!profileId) {
    throw new Error('Perfil Instagram invalido.');
  }

  const payload = {
    nome: cleanText(profile.nome),
    usuario: normalizeInstagramUser(profile.usuario),
    bio: cleanText(profile.bio),
    site: cleanText(profile.site),
    foto_url: cleanText(profile.foto_url),
    atualizado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(INSTAGRAM_PROFILES_TABLE)
    .update(payload)
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deactivateInstagramProfile(profileId) {
  if (!profileId) {
    throw new Error('Perfil Instagram invalido.');
  }

  const { data, error } = await supabase
    .from(INSTAGRAM_PROFILES_TABLE)
    .update({
      ativo: false,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function startInstagramOAuth(profileId, redirectTo = '', options = {}) {
  if (!profileId) {
    throw new Error('Perfil Instagram invalido para conectar.');
  }

  const data = await callInstagramFunction(
    'instagram-oauth-start',
    {
      instagram_perfil_id: profileId,
      redirect_to: redirectTo || window.location.href,
      expires_in_minutes: options.expiresInMinutes,
    },
    'Tempo esgotado ao abrir a conexao do Instagram. Tente novamente.'
  );

  if (!data?.authUrl) {
    throw new Error(data?.error || 'Nao foi possivel iniciar a conexao com Instagram.');
  }

  return data;
}

export async function createInstagramClientAuthLink(profileId) {
  if (!profileId) {
    throw new Error('Perfil Instagram invalido para gerar link de autorizacao.');
  }

  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/instagram-auth-complete`
    : '';

  const data = await startInstagramOAuth(profileId, redirectTo, {
    expiresInMinutes: 24 * 60,
  });

  return {
    url: data.authUrl,
    expiresAt: data.expiresAt,
    expiresInMinutes: data.expiresInMinutes || 24 * 60,
  };
}

export async function syncInstagramProfileFromMeta(profileId) {
  if (!profileId) {
    throw new Error('Perfil Instagram invalido para sincronizar.');
  }

  const data = await callInstagramFunction(
    'instagram-sync-profile',
    {
      instagram_perfil_id: profileId,
    },
    'Tempo esgotado ao sincronizar o Instagram. Tente novamente.'
  );

  if (!data?.profile) {
    throw new Error(data?.error || 'Nao foi possivel sincronizar o Instagram.');
  }

  return data.profile;
}

async function withRequestTimeout(promise, message, timeoutMs = 18000) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function callInstagramFunction(functionName, body, timeoutMessage) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Sessao expirada. Saia e entre novamente no CRM.');
  }

  const response = await withRequestTimeout(
    fetch(`${publicSupabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        apikey: publicSupabaseAnonKey,
        authorization: `Bearer ${publicSupabaseAnonKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        crm_access_token: session.access_token,
      }),
    }),
    timeoutMessage
  );

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || payload?.details || 'Nao foi possivel executar a funcao Instagram.');
  }

  return payload;
}

async function parseJsonResponse(response) {
  if (response?.clone) {
    try {
      const body = await response.clone().json();
      return body || {};
    } catch {
      return {};
    }
  }

  return {};
}

export async function fetchInstagramMonthlyPlanning(profileId, monthReference) {
  if (!profileId || !monthReference) return null;

  const { data, error } = await supabase
    .from(INSTAGRAM_PLANNING_TABLE)
    .select('*')
    .eq('instagram_perfil_id', profileId)
    .eq('mes_referencia', monthReference)
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function saveInstagramMonthlyPlanning(profile, monthReference, planning, updatedBy = '') {
  if (!profile?.id || !profile?.cliente_id || !monthReference) {
    throw new Error('Perfil Instagram e mes de referencia sao obrigatorios.');
  }

  const now = new Date().toISOString();
  const payload = {
    cliente_id: profile.cliente_id,
    instagram_perfil_id: profile.id,
    mes_referencia: monthReference,
    estrategia_mensal: cleanText(planning.estrategia_mensal),
    objetivo_mes: cleanText(planning.objetivo_mes),
    tom_comunicacao: cleanText(planning.tom_comunicacao),
    pilares_conteudo: cleanText(planning.pilares_conteudo),
    observacoes: cleanText(planning.observacoes),
    status: cleanText(planning.status) || 'rascunho',
    atualizado_em: now,
    criado_por: cleanText(updatedBy),
  };

  const { data, error } = await supabase
    .from(INSTAGRAM_PLANNING_TABLE)
    .upsert(payload, {
      onConflict: 'instagram_perfil_id,mes_referencia',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchInstagramPostsByProfile(profileId) {
  if (!profileId) return [];

  const { data, error } = await supabase
    .from(INSTAGRAM_POSTS_TABLE)
    .select('*')
    .eq('instagram_perfil_id', profileId)
    .order('data_prevista', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  const posts = data || [];
  const postIds = posts.map((post) => post.id).filter(Boolean);

  if (postIds.length === 0) {
    return posts;
  }

  const { data: comments, error: commentsError } = await supabase
    .from(INSTAGRAM_COMMENTS_TABLE)
    .select('*')
    .in('post_id', postIds)
    .order('criado_em', { ascending: true });

  if (commentsError) {
    throw commentsError;
  }

  const commentsByPostId = (comments || []).reduce((accumulator, comment) => ({
    ...accumulator,
    [comment.post_id]: [...(accumulator[comment.post_id] || []), comment],
  }), {});

  return posts.map((post) => ({
    ...post,
    comentarios: commentsByPostId[post.id] || [],
  }));
}

export async function saveInstagramPost(profile, post) {
  if (!profile?.id || !profile?.cliente_id) {
    throw new Error('Perfil Instagram invalido para salvar post.');
  }

  const payload = buildInstagramPostPayload(profile, post);
  const shouldUpdate = post?.id && !isPreviewPostId(post.id);
  const query = shouldUpdate
    ? supabase
        .from(INSTAGRAM_POSTS_TABLE)
        .update(payload)
        .eq('id', post.id)
    : supabase
        .from(INSTAGRAM_POSTS_TABLE)
        .insert(payload);

  const { data, error } = await query
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function duplicateInstagramPost(profile, post) {
  if (!post?.id) {
    throw new Error('Post invalido para duplicar.');
  }

  const payload = buildInstagramPostPayload(profile, {
    ...post,
    titulo_interno: post.titulo_interno ? `${post.titulo_interno} - copia` : '',
    status: 'rascunho',
  });

  const { data, error } = await supabase
    .from(INSTAGRAM_POSTS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteInstagramPost(postId) {
  if (!postId) {
    throw new Error('Post invalido para excluir.');
  }

  const { error } = await supabase
    .from(INSTAGRAM_POSTS_TABLE)
    .delete()
    .eq('id', postId);

  if (error) {
    throw error;
  }
}

export async function createInstagramMagicLink(profile, monthReference, createdBy = '') {
  if (!profile?.id || !profile?.cliente_id) {
    throw new Error('Perfil Instagram invalido para gerar link.');
  }

  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);

  const { data, error } = await supabase
    .from(INSTAGRAM_MAGIC_LINKS_TABLE)
    .insert({
      cliente_id: profile.cliente_id,
      instagram_perfil_id: profile.id,
      token_hash: tokenHash,
      escopo: 'perfil',
      ativo: true,
      expira_em: expirationDate.toISOString(),
      criado_por: cleanText(createdBy),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const query = monthReference ? `?mes=${encodeURIComponent(monthReference)}` : '';

  return {
    token,
    url: `${window.location.origin}/instagram-preview/${token}${query}`,
    expiresAt: data?.expira_em || expirationDate.toISOString(),
  };
}

export async function fetchLatestInstagramMagicLink(profileId) {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from(INSTAGRAM_MAGIC_LINKS_TABLE)
    .select('id, ativo, escopo, expira_em, criado_em, ultimo_acesso_em')
    .eq('instagram_perfil_id', profileId)
    .order('criado_em', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function fetchInstagramMagicPreviewByToken(token) {
  const tokenHash = await hashToken(token);
  const { data, error } = await supabase.rpc('get_instagram_magic_preview', {
    p_token_hash: tokenHash,
  });

  if (error) {
    throw error;
  }

  return data || { status: 'invalid' };
}

export async function submitInstagramMagicApproval(token, postId, action, comment = '') {
  if (!token || !postId || !action) {
    throw new Error('Dados invalidos para registrar aprovacao.');
  }

  const tokenHash = await hashToken(token);
  const { data, error } = await supabase.rpc('submit_instagram_magic_approval', {
    p_token_hash: tokenHash,
    p_post_id: postId,
    p_action: action,
    p_comment: cleanText(comment),
  });

  if (error) {
    throw error;
  }

  if (data?.status && data.status !== 'ok') {
    throw new Error(getMagicApprovalErrorMessage(data.status));
  }

  return data || { status: 'invalid' };
}

function buildInstagramPostPayload(profile, post = {}) {
  const dataPrevista = cleanText(post.data_prevista);
  const mesReferencia = cleanText(post.mes_referencia) || (dataPrevista ? dataPrevista.slice(0, 7) : '');
  const mediaValue = cleanText(post.midia_url || post.thumbnail_url);
  const firstMedia = getFirstMediaUrl(mediaValue);

  return {
    cliente_id: profile.cliente_id,
    instagram_perfil_id: profile.id,
    tipo: cleanText(post.tipo) || 'feed',
    midia_url: mediaValue,
    thumbnail_url: firstMedia,
    titulo_interno: cleanText(post.titulo_interno || post.roteiro),
    legenda: cleanText(post.legenda),
    cta: cleanText(post.cta),
    hashtags: cleanText(post.hashtags),
    data_prevista: dataPrevista || null,
    hora_prevista: cleanText(post.hora_prevista) || null,
    mes_referencia: mesReferencia,
    status: cleanText(post.status) || 'rascunho',
    responsavel: cleanText(post.responsavel),
    observacoes_internas: cleanText(post.observacoes_internas),
    roteiro: cleanText(post.titulo_interno || post.roteiro),
    atualizado_em: new Date().toISOString(),
  };
}

function getFirstMediaUrl(value) {
  const firstUrl = String(value || '')
    .split(/\n|,/)
    .map((item) => cleanText(item))
    .filter(Boolean)[0] || '';

  return normalizeMediaUrl(firstUrl);
}

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeUrl(url) {
  const value = cleanText(url);

  if (!value) return '';
  if (value.startsWith('data:')) return value;
  if (/^https?:\/\//i.test(value)) return value;

  return `https://${value}`;
}

function normalizeMediaUrl(url) {
  const value = normalizeUrl(url);

  if (!value) return '';
  if (value.startsWith('data:')) return value;

  const driveFileMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (driveFileMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
  }

  const driveOpenMatch = value.match(/[?&]id=([^&]+)/i);
  if (/drive\.google\.com/i.test(value) && driveOpenMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }

  if (/dropbox\.com/i.test(value)) {
    return value.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=0/i, '');
  }

  return value;
}

function isPreviewPostId(value) {
  return String(value || '').startsWith('preview-');
}

function normalizeInstagramUser(value) {
  return cleanText(value).replace(/^@+/, '');
}

function generateSecureToken() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashToken(token) {
  const encodedToken = new TextEncoder().encode(token);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedToken);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getMagicApprovalErrorMessage(status) {
  const messages = {
    invalid: 'Link de aprovacao invalido.',
    inactive: 'Este link de aprovacao foi desativado.',
    expired: 'Este link de aprovacao expirou.',
    invalid_action: 'Acao de aprovacao invalida.',
    comment_required: 'Informe um comentario para reprovar ou solicitar ajuste.',
    post_not_found: 'Post nao encontrado para este link.',
  };

  return messages[status] || 'Nao foi possivel registrar a resposta do cliente.';
}
