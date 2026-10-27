import { supabase } from '../../../services/supabase/supabaseClient.js';

const LEADS_TABLE = 'leads_formularios';

export async function fetchLeads() {
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .select('*')
    .order('data_entrada', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createLead(details) {
  const now = new Date().toISOString();

  const payload = {
    nome: cleanText(details.nome),
    email: cleanEmail(details.email),
    telefone: cleanText(details.telefone),
    empresa: cleanText(details.empresa),
    servico_interesse: cleanText(details.servico_interesse),
    mensagem: cleanText(details.mensagem),
    origem: cleanText(details.origem) || 'cadastro_manual',
    etapa: details.etapa || 'entrou',
    status: 'novo',
    prioridade: details.prioridade || 'normal',
    observacoes: cleanText(details.observacoes),
    responsavel: cleanText(details.responsavel),
    data_entrada: now,
    data_ultima_atualizacao: now,
  };

  if (!payload.nome && !payload.empresa) {
    throw new Error('Informe pelo menos o nome ou a empresa do lead.');
  }

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLeadStage(leadId, etapa) {
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update({
      etapa,
      data_ultima_atualizacao: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLeadNotes(leadId, observacoes) {
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update({
      observacoes,
      data_ultima_atualizacao: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLeadDetails(leadId, details) {
  const payload = {
    observacoes: details.observacoes || '',
    documento_url: details.documento_url || '',
    data_ultima_atualizacao: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update(payload)
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function convertLeadToClient(leadId) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update({
      status: 'cliente',
      status_cliente: 'ativo',
      convertido_em: now,
      data_inicio_cliente: now.slice(0, 10),
      data_ultima_atualizacao: now,
    })
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveLead(leadId) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update({
      status: 'arquivado',
      arquivado_em: now,
      data_ultima_atualizacao: now,
    })
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createClientDetails(details) {
  const now = new Date().toISOString();

  const payload = {
    nome: details.nome || '',
    email: details.email || '',
    telefone: details.telefone || '',
    whatsapp: details.whatsapp || details.telefone || '',
    cidade: details.cidade || '',
    empresa: details.empresa || '',
    contato_principal: details.contato_principal || '',

    origem: 'cadastro_manual',
    etapa: 'conclusao',
    status: 'cliente',
    status_cliente: details.status_cliente || 'ativo',

    servico_contratado: details.servico_contratado || '',
    plano_contratado: details.plano_contratado || '',

    data_entrada: now,
    convertido_em: now,
    data_inicio_cliente: details.data_inicio_cliente || now.slice(0, 10),

    responsavel_cliente: details.responsavel_cliente || '',
    proxima_acao: details.proxima_acao || '',
    ultima_acao: details.ultima_acao || '',

    mensalidade: normalizeMoneyValue(details.mensalidade),
    dia_vencimento: normalizeIntegerValue(details.dia_vencimento, null),
    status_financeiro: details.status_financeiro || 'nao_informado',
    meses_estimados_contrato: normalizeIntegerValue(details.meses_estimados_contrato, 12),
    recorrente: Boolean(details.recorrente),
    artigos_mensais: normalizeIntegerValue(details.artigos_mensais, 0),
    valor_por_artigo: normalizeMoneyValue(details.valor_por_artigo) || 0,
    responsavel_padrao: details.responsavel_padrao || details.responsavel_cliente || '',

    documento_url: details.documento_url || '',
    briefing_url: details.briefing_url || '',
    estrategia_url: details.estrategia_url || '',
    contrato_url: details.contrato_url || '',
    financeiro_url: details.financeiro_url || '',
    conteudos_url: details.conteudos_url || '',
    tarefas_url: details.tarefas_url || '',
    relatorios_url: details.relatorios_url || '',
    acessos_url: details.acessos_url || '',
    drive_url: details.drive_url || '',
    historico_url: details.historico_url || '',

    observacoes_cliente: details.observacoes_cliente || '',
    data_ultima_atualizacao: now,
  };

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateClientDetails(clientId, details) {
  const payload = {
    nome: details.nome || '',
    email: details.email || '',
    telefone: details.telefone || '',
    whatsapp: details.whatsapp || details.telefone || '',
    cidade: details.cidade || '',
    empresa: details.empresa || '',
    contato_principal: details.contato_principal || '',

    status: 'cliente',
    status_cliente: details.status_cliente || 'ativo',

    servico_contratado: details.servico_contratado || '',
    plano_contratado: details.plano_contratado || '',

    data_inicio_cliente: details.data_inicio_cliente || null,
    responsavel_cliente: details.responsavel_cliente || '',

    proxima_acao: details.proxima_acao || '',
    ultima_acao: details.ultima_acao || '',

    mensalidade: normalizeMoneyValue(details.mensalidade),
    dia_vencimento: normalizeIntegerValue(details.dia_vencimento, null),
    status_financeiro: details.status_financeiro || 'nao_informado',
    meses_estimados_contrato: normalizeIntegerValue(details.meses_estimados_contrato, 12),
    recorrente: Boolean(details.recorrente),
    artigos_mensais: normalizeIntegerValue(details.artigos_mensais, 0),
    valor_por_artigo: normalizeMoneyValue(details.valor_por_artigo) || 0,
    responsavel_padrao: details.responsavel_padrao || details.responsavel_cliente || '',

    documento_url: details.documento_url || '',
    briefing_url: details.briefing_url || '',
    estrategia_url: details.estrategia_url || '',
    contrato_url: details.contrato_url || '',
    financeiro_url: details.financeiro_url || '',
    conteudos_url: details.conteudos_url || '',
    tarefas_url: details.tarefas_url || '',
    relatorios_url: details.relatorios_url || '',
    acessos_url: details.acessos_url || '',
    drive_url: details.drive_url || '',
    historico_url: details.historico_url || '',

    observacoes_cliente: details.observacoes_cliente || '',

    data_ultima_atualizacao: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update(payload)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveClient(clientId) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update({
      status: 'cliente',
      status_cliente: 'encerrado',
      data_ultima_atualizacao: now,
    })
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteClient(clientId) {
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .delete()
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function cleanText(value) {
  return String(value || '').trim();
}

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeMoneyValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  const normalizedValue = Number(
    String(value)
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );

  if (Number.isNaN(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}

function normalizeIntegerValue(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalizedValue = parseInt(value, 10);

  if (Number.isNaN(normalizedValue)) {
    return fallback;
  }

  return normalizedValue;
}
