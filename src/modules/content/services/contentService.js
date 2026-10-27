import { supabase } from '../../../services/supabase/supabaseClient.js';

const CONTENT_DELIVERIES_TABLE = 'crm_conteudo_entregas';
const CONTENT_ITEMS_TABLE = 'crm_conteudo_itens';
const CONTENT_MAGIC_LINKS_TABLE = 'crm_conteudo_links_magicos';
const CONTENT_COMMENTS_TABLE = 'crm_conteudo_comentarios';
const CONTENT_BRIEFINGS_TABLE = 'crm_conteudo_briefings_proximo_mes';
const CONTENT_HISTORY_TABLE = 'crm_conteudo_historico';

const REVIEWED_STATUSES = new Set(['aprovado', 'revisar', 'publicado']);
const PENDING_REVIEW_STATUSES = new Set(['em_revisao', 'revisar']);

export async function fetchContentDashboardDeliveries() {
  const { data, error } = await supabase
    .from(CONTENT_DELIVERIES_TABLE)
    .select(`
      *,
      cliente:leads_formularios (
        id,
        nome,
        empresa,
        email,
        status_cliente,
        data_ultima_atualizacao
      )
    `)
    .order('atualizado_em', { ascending: false });

  if (error) {
    throw error;
  }

  const deliveries = data || [];
  const deliveryIds = deliveries.map((delivery) => delivery.id).filter(Boolean);

  if (!deliveryIds.length) {
    return deliveries.map((delivery) => addContentItemStats(delivery));
  }

  const { data: items, error: itemsError } = await supabase
    .from(CONTENT_ITEMS_TABLE)
    .select('id, entrega_id, status')
    .in('entrega_id', deliveryIds);

  if (itemsError) {
    throw itemsError;
  }

  const statsByDelivery = buildContentItemStats(items || []);

  return deliveries.map((delivery) => addContentItemStats(delivery, statsByDelivery.get(delivery.id)));
}

export async function createContentDelivery(client, payload, createdBy = '') {
  if (!client?.id) {
    throw new Error('Cliente invalido para criar entrega.');
  }

  const normalizedPayload = normalizeDeliveryPayload(payload);
  await ensureUniqueMonthlyDelivery(client.id, normalizedPayload.mes_referencia);

  const { data, error } = await supabase
    .from(CONTENT_DELIVERIES_TABLE)
    .insert({
      ...normalizedPayload,
      cliente_id: client.id,
      criado_por: cleanText(createdBy),
      atualizado_em: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateContentDelivery(deliveryId, payload) {
  if (!deliveryId) {
    throw new Error('Entrega invalida para atualizar.');
  }

  const normalizedPayload = normalizeDeliveryPayload(payload);
  await ensureUniqueMonthlyDelivery(payload.cliente_id, normalizedPayload.mes_referencia, deliveryId);

  const { data, error } = await supabase
    .from(CONTENT_DELIVERIES_TABLE)
    .update({
      ...normalizedPayload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', deliveryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateContentEditorialStrategy(deliveryId, payload) {
  if (!deliveryId) {
    throw new Error('Entrega invalida para atualizar estrategia.');
  }

  const { data, error } = await supabase
    .from(CONTENT_DELIVERIES_TABLE)
    .update({
      objetivo_estrategia: cleanText(payload.objetivo_estrategia),
      publico_alvo: cleanText(payload.publico_alvo),
      tom_comunicacao: cleanText(payload.tom_comunicacao),
      palavras_chave: cleanText(payload.palavras_chave),
      servicos_priorizados: cleanText(payload.servicos_priorizados),
      objetivos_seo: cleanText(payload.objetivos_seo),
      observacoes: cleanText(payload.observacoes),
      observacoes_cliente: cleanText(payload.observacoes_cliente),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', deliveryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteContentDelivery(deliveryId) {
  if (!deliveryId) {
    throw new Error('Entrega invalida para excluir.');
  }

  const { error } = await supabase
    .from(CONTENT_DELIVERIES_TABLE)
    .delete()
    .eq('id', deliveryId);

  if (error) {
    throw error;
  }

  return true;
}

export async function fetchContentItemsByDelivery(deliveryId) {
  if (!deliveryId) return [];

  const { data, error } = await supabase
    .from(CONTENT_ITEMS_TABLE)
    .select('*')
    .eq('entrega_id', deliveryId)
    .order('ordem', { ascending: true })
    .order('atualizado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return attachContentComments(data || [], await fetchContentCommentsByDelivery(deliveryId));
}

export async function fetchContentCommentsByDelivery(deliveryId) {
  if (!deliveryId) return [];

  const { data, error } = await supabase
    .from(CONTENT_COMMENTS_TABLE)
    .select('*')
    .eq('entrega_id', deliveryId)
    .order('criado_em', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchContentBriefingsByDelivery(deliveryId) {
  if (!deliveryId) return [];

  const { data, error } = await supabase
    .from(CONTENT_BRIEFINGS_TABLE)
    .select('*')
    .eq('entrega_id', deliveryId)
    .order('enviado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchContentHistoryByDelivery(deliveryId) {
  if (!deliveryId) return [];

  const { data, error } = await supabase
    .from(CONTENT_HISTORY_TABLE)
    .select('*')
    .eq('entrega_id', deliveryId)
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchContentMagicLinksByDelivery(deliveryId) {
  if (!deliveryId) return [];

  const { data, error } = await supabase
    .from(CONTENT_MAGIC_LINKS_TABLE)
    .select('id, escopo, ativo, expira_em, criado_por, criado_em, ultimo_acesso_em')
    .eq('entrega_id', deliveryId)
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createContentItem(delivery, payload, createdBy = '') {
  if (!delivery?.id || !delivery?.cliente_id) {
    throw new Error('Entrega invalida para criar conteudo.');
  }

  const normalizedPayload = normalizeContentItemPayload(payload);

  const { data, error } = await supabase
    .from(CONTENT_ITEMS_TABLE)
    .insert({
      ...normalizedPayload,
      entrega_id: delivery.id,
      cliente_id: delivery.cliente_id,
      criado_por: cleanText(createdBy),
      atualizado_em: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateContentItem(itemId, payload) {
  if (!itemId) {
    throw new Error('Conteudo invalido para atualizar.');
  }

  const normalizedPayload = normalizeContentItemPayload(payload);

  const { data, error } = await supabase
    .from(CONTENT_ITEMS_TABLE)
    .update({
      ...normalizedPayload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteContentItem(itemId) {
  if (!itemId) {
    throw new Error('Conteudo invalido para excluir.');
  }

  const { error } = await supabase
    .from(CONTENT_ITEMS_TABLE)
    .delete()
    .eq('id', itemId);

  if (error) {
    throw error;
  }

  return true;
}

export async function duplicateContentItem(item, nextOrder) {
  if (!item?.entrega_id || !item?.cliente_id) {
    throw new Error('Conteudo invalido para duplicar.');
  }

  const payload = normalizeContentItemPayload({
    ...item,
    titulo: `${item.titulo || 'Conteudo'} - copia`,
    ordem: nextOrder,
    status: 'rascunho',
  });

  const { data, error } = await supabase
    .from(CONTENT_ITEMS_TABLE)
    .insert({
      ...payload,
      entrega_id: item.entrega_id,
      cliente_id: item.cliente_id,
      criado_por: item.criado_por || '',
      atualizado_em: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateContentItemsOrder(items) {
  if (!items?.length) return [];

  const updates = await Promise.all(
    items.map((item, index) => (
      supabase
        .from(CONTENT_ITEMS_TABLE)
        .update({
          ordem: index + 1,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', item.id)
        .select()
        .single()
    ))
  );

  const failed = updates.find((result) => result.error);

  if (failed?.error) {
    throw failed.error;
  }

  return updates.map((result) => result.data);
}

export async function createContentMagicReviewLink(delivery, createdBy = '') {
  if (!delivery?.id || !delivery?.cliente_id) {
    throw new Error('Entrega invalida para gerar link de revisao.');
  }

  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);

  const { data, error } = await supabase
    .from(CONTENT_MAGIC_LINKS_TABLE)
    .insert({
      cliente_id: delivery.cliente_id,
      entrega_id: delivery.id,
      token_hash: tokenHash,
      escopo: 'entrega',
      ativo: true,
      expira_em: expirationDate.toISOString(),
      criado_por: cleanText(createdBy),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const reviewPayload = await fetchContentMagicReviewByToken(token);

  if (reviewPayload?.status !== 'ok') {
    throw new Error('O link foi criado, mas a consulta publica ainda nao esta disponivel. Rode a migration 013_content_review_actions_rpc.sql no Supabase.');
  }

  return {
    token,
    url: `${window.location.origin}/conteudo-revisao/${token}`,
    expiresAt: data?.expira_em || expirationDate.toISOString(),
  };
}

export async function fetchContentMagicReviewByToken(token) {
  const cleanToken = normalizePublicToken(token);

  if (!cleanToken) return { status: 'invalid' };

  const tokenHash = await hashToken(cleanToken);
  const { data, error } = await supabase.rpc('get_content_magic_review', {
    p_token_hash: tokenHash,
  });

  if (error) {
    if (isMissingContentRpcError(error)) {
      const setupError = new Error('A funcao publica do link magico de Conteudo ainda nao esta instalada no Supabase. Rode a migration 013_content_review_actions_rpc.sql.');
      setupError.code = 'CONTENT_REVIEW_RPC_MISSING';
      throw setupError;
    }

    throw error;
  }

  return normalizeMagicReviewPayload(data || { status: 'invalid' });
}

export async function submitContentMagicReviewAction(token, itemId, action, comment = '') {
  const cleanToken = normalizePublicToken(token);

  if (!cleanToken || !itemId) {
    throw new Error('Revisao invalida para registrar acao.');
  }

  const tokenHash = await hashToken(cleanToken);
  const { data, error } = await supabase.rpc('submit_content_magic_review_action', {
    p_token_hash: tokenHash,
    p_item_id: itemId,
    p_action: action,
    p_comment: cleanText(comment),
    p_author_name: 'Cliente',
  });

  if (error) {
    if (isMissingContentRpcError(error)) {
      const setupError = new Error('A funcao de aprovacao publica ainda nao esta instalada no Supabase. Rode a migration 013_content_review_actions_rpc.sql.');
      setupError.code = 'CONTENT_REVIEW_RPC_MISSING';
      throw setupError;
    }

    throw error;
  }

  if (data?.status === 'error') {
    throw new Error(data.message || 'Nao foi possivel registrar a acao.');
  }

  return normalizeMagicReviewPayload(data || { status: 'invalid' });
}

export async function finalizeContentMagicReview(token) {
  const cleanToken = normalizePublicToken(token);

  if (!cleanToken) {
    throw new Error('Link de revisao invalido para finalizar.');
  }

  const tokenHash = await hashToken(cleanToken);
  const { data, error } = await supabase.rpc('finalize_content_magic_review', {
    p_token_hash: tokenHash,
  });

  if (error) {
    if (isMissingContentRpcError(error)) {
      const setupError = new Error('A funcao de finalizacao publica ainda nao esta instalada no Supabase. Rode a migration 015_content_review_finalization_rpc.sql.');
      setupError.code = 'CONTENT_REVIEW_RPC_MISSING';
      throw setupError;
    }

    throw error;
  }

  if (data?.status === 'error') {
    throw new Error(data.message || 'Nao foi possivel finalizar a revisao.');
  }

  return normalizeMagicReviewPayload(data || { status: 'invalid' });
}

export async function submitContentMagicBriefing(token, payload = {}) {
  const cleanToken = normalizePublicToken(token);

  if (!cleanToken) {
    throw new Error('Link de revisao invalido para enviar briefing.');
  }

  const tokenHash = await hashToken(cleanToken);
  const { data, error } = await supabase.rpc('submit_content_magic_briefing', {
    p_token_hash: tokenHash,
    p_servico_produto_destaque: cleanText(payload.servico_produto_destaque),
    p_campanha_evento_data: cleanText(payload.campanha_evento_data),
    p_perguntas_frequentes_clientes: cleanText(payload.perguntas_frequentes_clientes),
    p_observacoes_equipe: cleanText(payload.observacoes_equipe),
  });

  if (error) {
    if (isMissingContentRpcError(error)) {
      const setupError = new Error('A funcao de briefing publico ainda nao esta instalada no Supabase. Rode a migration 014_content_next_month_briefing_rpc.sql.');
      setupError.code = 'CONTENT_REVIEW_RPC_MISSING';
      throw setupError;
    }

    throw error;
  }

  if (data?.status === 'error') {
    throw new Error(data.message || 'Nao foi possivel enviar o briefing.');
  }

  return normalizeMagicReviewPayload(data || { status: 'invalid' });
}

export async function fetchContentDeliveryByClient(clientId) {
  if (!clientId) return null;

  const { data, error } = await supabase
    .from(CONTENT_DELIVERIES_TABLE)
    .select('*')
    .eq('cliente_id', clientId)
    .order('atualizado_em', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function activateContentDeliveryForClient(client, createdBy = '') {
  if (!client?.id) {
    throw new Error('Cliente invalido para ativar a Central de Conteudo.');
  }

  const existingDelivery = await fetchContentDeliveryByClient(client.id);

  if (existingDelivery) {
    return existingDelivery;
  }

  const monthReference = getCurrentMonthReference();
  const monthLabel = formatMonthReferenceLabel(monthReference);
  const clientName = cleanText(client.nome || client.empresa || 'Cliente');
  const defaultQuantity = Number(client.artigos_mensais || 0);

  const payload = {
    cliente_id: client.id,
    titulo: `${clientName} - Conteudos de ${monthLabel}`,
    mes_referencia: monthReference,
    objetivo_estrategia: '',
    estrategia_editorial: '',
    quantidade_prevista: Number.isFinite(defaultQuantity) ? defaultQuantity : 0,
    status: 'rascunho',
    responsavel: cleanText(client.responsavel_padrao || client.responsavel_cliente || client.responsavel || createdBy),
    criado_por: cleanText(createdBy),
    atualizado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(CONTENT_DELIVERIES_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function getCurrentMonthReference() {
  return new Date().toISOString().slice(0, 7);
}

export function formatMonthReferenceLabel(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return monthReference || 'Mes nao informado';

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export function getContentDeliveryStatusLabel(status) {
  const labels = {
    rascunho: 'Rascunho',
    em_revisao: 'Em revisao',
    aprovado: 'Aprovado',
    revisar: 'Revisar',
    publicado: 'Publicado',
    aguardando_revisao: 'Aguardando revisao',
    revisao_concluida: 'Revisao concluida',
    pronto_publicar: 'Pronto para publicar',
    ajustes_solicitados: 'Ajustes solicitados',
  };

  return labels[status] || 'Nao informado';
}

export function getContentDeliveryWorkflowStatus(delivery) {
  return getContentDeliveryStatusLabel(getContentDeliveryWorkflowKey(delivery));
}

export function getContentDeliveryWorkflowKey(delivery) {
  if (!delivery) return 'aguardando_revisao';

  const total = Number(delivery.conteudos_total || 0);
  const reviewed = Number(delivery.revisados_total || delivery.quantidade_revisada || 0);
  const approved = Number(delivery.aprovados_total || delivery.quantidade_aprovada || 0);
  const revisions = Number(delivery.ajustes_total || delivery.quantidade_revisada || 0);
  const finished = Boolean(delivery.revisao_concluida_em);

  if (finished) {
    if (revisions > 0 || delivery.status === 'revisar') return 'ajustes_solicitados';
    if (total > 0 && approved >= total) return 'pronto_publicar';
    return 'revisao_concluida';
  }

  if (reviewed > 0 || delivery.status === 'em_revisao') return 'em_revisao';

  return 'aguardando_revisao';
}

function buildContentItemStats(items) {
  return items.reduce((map, item) => {
    const current = map.get(item.entrega_id) || {
      total: 0,
      reviewed: 0,
      pendingReview: 0,
      approved: 0,
      revision: 0,
      published: 0,
    };

    current.total += 1;

    if (REVIEWED_STATUSES.has(item.status)) {
      current.reviewed += 1;
    }

    if (PENDING_REVIEW_STATUSES.has(item.status)) {
      current.pendingReview += 1;
    }

    if (item.status === 'aprovado') {
      current.approved += 1;
    }

    if (item.status === 'revisar') {
      current.revision += 1;
    }

    if (item.status === 'publicado') {
      current.published += 1;
    }

    map.set(item.entrega_id, current);
    return map;
  }, new Map());
}

function addContentItemStats(delivery, stats = {}) {
  const hydratedDelivery = {
    ...delivery,
    conteudos_total: stats.total || 0,
    revisados_total: stats.reviewed || Number(delivery.quantidade_revisada || delivery.quantidade_aprovada || 0),
    pendentes_revisao_total: stats.pendingReview || 0,
    aprovados_total: stats.approved || Number(delivery.quantidade_aprovada || 0),
    ajustes_total: stats.revision || Number(delivery.quantidade_revisada || 0),
    publicados_total: stats.published || Number(delivery.quantidade_publicada || 0),
  };

  return {
    ...hydratedDelivery,
    workflow_status: getContentDeliveryWorkflowKey(hydratedDelivery),
  };
}

function attachContentComments(items, comments) {
  const commentsByItem = comments.reduce((map, comment) => {
    const current = map.get(comment.item_id) || [];
    current.push(comment);
    map.set(comment.item_id, current);
    return map;
  }, new Map());

  return items.map((item) => ({
    ...item,
    comentarios: commentsByItem.get(item.id) || [],
  }));
}

function normalizeMagicReviewPayload(payload) {
  if (payload?.status !== 'ok') return payload;

  const comments = payload.comments || [];
  const history = payload.history || [];
  const commentsByItem = comments.reduce((map, comment) => {
    const current = map.get(comment.item_id) || [];
    current.push(comment);
    map.set(comment.item_id, current);
    return map;
  }, new Map());
  const historyByItem = history.reduce((map, entry) => {
    if (!entry.item_id) return map;

    const current = map.get(entry.item_id) || [];
    current.push(entry);
    map.set(entry.item_id, current);
    return map;
  }, new Map());

  return {
    ...payload,
    items: (payload.items || []).map((item) => ({
      ...item,
      comentarios: commentsByItem.get(item.id) || [],
      historico: historyByItem.get(item.id) || [],
    })),
    comments,
    history,
    briefings: payload.briefings || [],
  };
}

async function ensureUniqueMonthlyDelivery(clientId, monthReference, ignoredDeliveryId = '') {
  if (!clientId || !monthReference) return;

  let query = supabase
    .from(CONTENT_DELIVERIES_TABLE)
    .select('id')
    .eq('cliente_id', clientId)
    .eq('mes_referencia', monthReference)
    .limit(1);

  if (ignoredDeliveryId) {
    query = query.neq('id', ignoredDeliveryId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if (data?.length) {
    throw new Error('Ja existe uma entrega para este cliente neste mes.');
  }
}

function normalizeDeliveryPayload(payload = {}) {
  return {
    titulo: cleanText(payload.titulo) || 'Entrega mensal',
    mes_referencia: cleanText(payload.mes_referencia) || getCurrentMonthReference(),
    objetivo_estrategia: cleanText(payload.objetivo_estrategia),
    observacoes: cleanText(payload.observacoes),
    quantidade_prevista: normalizeNumber(payload.quantidade_prevista),
    status: cleanText(payload.status) || 'rascunho',
    responsavel: cleanText(payload.responsavel),
  };
}

function normalizeContentItemPayload(payload = {}) {
  return {
    titulo: cleanText(payload.titulo) || 'Conteudo sem titulo',
    tipo: cleanText(payload.tipo) || 'artigo',
    palavra_chave_principal: cleanText(payload.palavra_chave_principal),
    meta_title: cleanText(payload.meta_title),
    meta_description: cleanText(payload.meta_description),
    conteudo: cleanText(payload.conteudo),
    ordem: normalizeNumber(payload.ordem) || 1,
    status: cleanText(payload.status) || 'rascunho',
    observacoes_internas: cleanText(payload.observacoes_internas),
  };
}

function normalizeNumber(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) return 0;

  return Math.round(parsed);
}

function cleanText(value) {
  return String(value || '').trim();
}

function generateSecureToken() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normalizePublicToken(token) {
  const rawToken = String(token || '').trim().split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');

  try {
    return decodeURIComponent(rawToken);
  } catch {
    return rawToken;
  }
}

function isMissingContentRpcError(error) {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`;

  return error?.code === 'PGRST202'
    || message.includes('get_content_magic_review')
    || message.includes('submit_content_magic_review_action')
    || message.includes('submit_content_magic_briefing')
    || message.includes('finalize_content_magic_review')
    || message.includes('schema cache');
}

async function hashToken(token) {
  const encodedToken = new TextEncoder().encode(token);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedToken);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
