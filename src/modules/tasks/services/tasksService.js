import { supabase } from '../../../services/supabase/supabaseClient.js';

const TASKS_TABLE = 'crm_tarefas';

export async function fetchTasks() {
  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .select('*')
    .order('data_vencimento', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchFinanceTasksByMonth(monthReference) {
  if (!monthReference) return [];

  const { startDate, endDate } = getMonthDateRange(monthReference);
  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .select('*')
    .or(`mes_referencia.eq.${monthReference},mes_arquivo.eq.${monthReference},and(mes_referencia.is.null,data_vencimento.gte.${startDate},data_vencimento.lte.${endDate})`)
    .order('data_vencimento', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchClientTasks(clientId) {
  if (!clientId) return [];

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .select('*')
    .eq('cliente_id', clientId)
    .order('data_vencimento', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createTask(task) {
  const now = new Date().toISOString();

  const payload = {
    cliente_id: task.cliente_id || null,
    cliente_nome: cleanText(task.cliente_nome),

    titulo: cleanText(task.titulo),
    descricao: cleanText(task.descricao),

    tipo: task.tipo || 'tarefa',
    categoria: task.categoria || getCategoryByType(task.tipo),

    status: task.status || 'pendente',
    prioridade: task.prioridade || 'normal',

    data_vencimento: task.data_vencimento || null,
    hora_vencimento: task.hora_vencimento || null,
    data_inicio: task.data_inicio || null,

    responsavel: cleanText(task.responsavel),
    responsavel_email: cleanEmail(task.responsavel_email),

    criado_por: cleanText(task.criado_por),
    criado_por_email: cleanEmail(task.criado_por_email),

    recorrente: Boolean(task.recorrente),
    recorrencia: task.recorrente ? task.recorrencia || 'mensal' : null,
    proxima_recorrencia: task.proxima_recorrencia || null,

    mensalidade_referencia_mes: normalizeInteger(task.mensalidade_referencia_mes),
    mensalidade_referencia_ano: normalizeInteger(task.mensalidade_referencia_ano),
    mes_referencia: cleanText(task.mes_referencia),
    quantidade_artigos: normalizeInteger(task.quantidade_artigos) || 0,
    valor_unitario: normalizeMoney(task.valor_unitario) || 0,
    valor_total: normalizeMoney(task.valor_total) || 0,
    faturavel: task.faturavel !== false,
    valor_previsto: normalizeMoney(task.valor_previsto),
    valor_pago: normalizeMoney(task.valor_pago),
    pago_em: task.pago_em || null,
    mes_arquivo: cleanText(task.mes_arquivo) || null,
    data_arquivamento: task.data_arquivamento || null,

    link_referencia: cleanText(task.link_referencia),
    observacoes: cleanText(task.observacoes),

    origem: task.origem || 'manual',
    atualizado_em: now,
  };

  if (!payload.titulo) {
    throw new Error('O titulo da tarefa e obrigatorio.');
  }

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateTask(taskId, task) {
  if (!taskId) {
    throw new Error('Tarefa invalida.');
  }

  const payload = {
    cliente_id: task.cliente_id || null,
    cliente_nome: cleanText(task.cliente_nome),

    titulo: cleanText(task.titulo),
    descricao: cleanText(task.descricao),

    tipo: task.tipo || 'tarefa',
    categoria: task.categoria || getCategoryByType(task.tipo),

    status: task.status || 'pendente',
    prioridade: task.prioridade || 'normal',

    data_vencimento: task.data_vencimento || null,
    hora_vencimento: task.hora_vencimento || null,
    data_inicio: task.data_inicio || null,

    responsavel: cleanText(task.responsavel),
    responsavel_email: cleanEmail(task.responsavel_email),

    recorrente: Boolean(task.recorrente),
    recorrencia: task.recorrente ? task.recorrencia || 'mensal' : null,
    proxima_recorrencia: task.proxima_recorrencia || null,

    mensalidade_referencia_mes: normalizeInteger(task.mensalidade_referencia_mes),
    mensalidade_referencia_ano: normalizeInteger(task.mensalidade_referencia_ano),
    mes_referencia: cleanText(task.mes_referencia),
    quantidade_artigos: normalizeInteger(task.quantidade_artigos) || 0,
    valor_unitario: normalizeMoney(task.valor_unitario) || 0,
    valor_total: normalizeMoney(task.valor_total) || 0,
    faturavel: task.faturavel !== false,
    valor_previsto: normalizeMoney(task.valor_previsto),
    valor_pago: normalizeMoney(task.valor_pago),
    pago_em: task.pago_em || null,
    mes_arquivo: cleanText(task.mes_arquivo) || null,
    data_arquivamento: task.data_arquivamento || null,

    link_referencia: cleanText(task.link_referencia),
    observacoes: cleanText(task.observacoes),

    atualizado_em: new Date().toISOString(),
  };

  if (!payload.titulo) {
    throw new Error('O titulo da tarefa e obrigatorio.');
  }

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .update(payload)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateTaskStatus(taskId, status) {
  if (!taskId) {
    throw new Error('Tarefa invalida.');
  }

  const payload = {
    status,
    atualizado_em: new Date().toISOString(),
  };

  if (status === 'concluido') {
    payload.data_conclusao = new Date().toISOString();
  }

  if (status !== 'concluido' && status !== 'arquivada') {
    payload.data_conclusao = null;
  }

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .update(payload)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function completeTask(taskId) {
  return updateTaskStatus(taskId, 'concluido');
}

export async function cancelTask(taskId) {
  return updateTaskStatus(taskId, 'cancelado');
}

export async function reopenTask(taskId) {
  return updateTaskStatus(taskId, 'pendente');
}

export async function deleteTask(taskId) {
  if (!taskId) {
    throw new Error('Tarefa invalida.');
  }

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .delete()
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveCompletedTasksByMonth(monthReference) {
  if (!monthReference) {
    throw new Error('Mes de arquivo invalido.');
  }

  const now = new Date().toISOString();
  const { startDate, endDate } = getMonthDateRange(monthReference);

  const { data: referencedTasks, error: referencedError } = await supabase
    .from(TASKS_TABLE)
    .update({
      status: 'arquivada',
      mes_arquivo: monthReference,
      data_arquivamento: now,
      atualizado_em: now,
    })
    .eq('status', 'concluido')
    .eq('mes_referencia', monthReference)
    .select();

  if (referencedError) {
    throw referencedError;
  }

  const { data: datedTasks, error: datedError } = await supabase
    .from(TASKS_TABLE)
    .update({
      status: 'arquivada',
      mes_arquivo: monthReference,
      data_arquivamento: now,
      atualizado_em: now,
    })
    .eq('status', 'concluido')
    .is('mes_referencia', null)
    .gte('data_vencimento', startDate)
    .lte('data_vencimento', endDate)
    .select();

  if (datedError) {
    throw datedError;
  }

  return [...(referencedTasks || []), ...(datedTasks || [])];
}

export async function createRecurringArticleTasks({ monthReference, responsible }) {
  if (!monthReference) {
    throw new Error('Informe o mes de referencia.');
  }

  const targetDueDate = buildMonthlyDueDate(monthReference, 10);
  const nextRecurrence = getNextMonthlyRecurrence(monthReference, 10);
  const { startDate, endDate } = getMonthDateRange(monthReference);

  const { data: recurringTemplates, error: recurringError } = await supabase
    .from(TASKS_TABLE)
    .select('*')
    .eq('recorrente', true)
    .eq('recorrencia', 'mensal')
    .not('proxima_recorrencia', 'is', null)
    .order('proxima_recorrencia', { ascending: true })
    .order('cliente_nome', { ascending: true });

  if (recurringError) {
    throw recurringError;
  }

  const templates = recurringTemplates || [];
  const eligibleTemplates = templates.filter((task) => {
    return getMonthReferenceFromDate(task.proxima_recorrencia) === monthReference;
  });

  if (eligibleTemplates.length === 0) {
    return {
      found: templates.length,
      eligible: 0,
      created: [],
      skipped: [],
      updatedTemplates: [],
    };
  }

  const { data: existingTasks, error: existingError } = await supabase
    .from(TASKS_TABLE)
    .select('id, cliente_id, cliente_nome, titulo, mes_referencia, data_vencimento')
    .or(`mes_referencia.eq.${monthReference},and(mes_referencia.is.null,data_vencimento.gte.${startDate},data_vencimento.lte.${endDate})`);

  if (existingError) {
    throw existingError;
  }

  const createdKeys = new Set();
  const skipped = [];
  const tasksToCreate = [];

  eligibleTemplates.forEach((template) => {
    const duplicateKey = getRecurringDuplicateKey(template, monthReference);
    const alreadyExists = (existingTasks || []).some((task) => {
      return task.id !== template.id && getRecurringDuplicateKey(task, monthReference) === duplicateKey;
    });

    if (alreadyExists || createdKeys.has(duplicateKey)) {
      skipped.push(template);
      return;
    }

    createdKeys.add(duplicateKey);

    const quantity = normalizeInteger(template.quantidade_artigos) || extractArticleQuantity(template.titulo) || 0;
    const unitValue = normalizeMoney(template.valor_unitario) || 0;
    const totalValue = normalizeMoney(template.valor_total) || quantity * unitValue;
    const clientName = template.cliente_nome || getRecurringBaseTitle(template.titulo) || 'Cliente';

    tasksToCreate.push({
      cliente_id: template.cliente_id || null,
      cliente_nome: clientName,
      titulo: buildRecurringTaskTitle(template, monthReference),
      descricao: cleanText(template.descricao) || 'Tarefa recorrente gerada para producao mensal de artigos.',
      tipo: template.tipo || 'artigo',
      categoria: template.categoria || 'operacional',
      status: 'pendente',
      prioridade: template.prioridade || 'normal',
      data_vencimento: targetDueDate,
      hora_vencimento: template.hora_vencimento || null,
      data_inicio: null,
      responsavel: cleanText(responsible || template.responsavel),
      responsavel_email: cleanEmail(template.responsavel_email),
      criado_por: cleanText(template.criado_por),
      criado_por_email: cleanEmail(template.criado_por_email),
      recorrente: false,
      recorrencia: null,
      proxima_recorrencia: null,
      mensalidade_referencia_mes: null,
      mensalidade_referencia_ano: null,
      mes_referencia: monthReference,
      quantidade_artigos: quantity,
      valor_unitario: unitValue,
      valor_total: totalValue,
      valor_previsto: totalValue,
      faturavel: template.faturavel !== false,
      link_referencia: cleanText(template.link_referencia),
      observacoes: cleanText(template.observacoes),
      origem: 'recorrente_artigos',
    });
  });

  let created = [];

  if (tasksToCreate.length > 0) {
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .insert(tasksToCreate)
      .select();

    if (error) {
      throw error;
    }

    created = data || [];
  }

  const processedTemplateIds = eligibleTemplates.map((template) => template.id).filter(Boolean);
  let updatedTemplates = [];

  if (processedTemplateIds.length > 0) {
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .update({
        proxima_recorrencia: nextRecurrence,
        atualizado_em: new Date().toISOString(),
      })
      .in('id', processedTemplateIds)
      .select('id, proxima_recorrencia');

    if (error) {
      throw error;
    }

    updatedTemplates = data || [];
  }

  return {
    found: templates.length,
    eligible: eligibleTemplates.length,
    created,
    skipped,
    updatedTemplates,
  };
}

export async function createMonthlyPaymentTaskFromClient(client) {
  if (!client?.id) {
    throw new Error('Cliente invalido.');
  }

  const now = new Date();
  const dueDay = normalizeInteger(client.dia_vencimento) || 10;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const dueDate = buildDueDate(currentYear, currentMonth, dueDay);

  return createTask({
    cliente_id: client.id,
    cliente_nome: client.nome || client.empresa || 'Cliente sem nome',

    titulo: `Mensalidade - ${client.nome || client.empresa || 'Cliente'}`,
    descricao: 'Cobranca mensal gerada a partir do cadastro do cliente.',

    tipo: 'mensalidade',
    categoria: 'financeiro',
    status: 'pendente',
    prioridade: 'alta',

    data_vencimento: dueDate,
    responsavel: client.responsavel_cliente || '',
    responsavel_email: '',

    recorrente: true,
    recorrencia: 'mensal',

    mensalidade_referencia_mes: currentMonth,
    mensalidade_referencia_ano: currentYear,
    valor_previsto: client.mensalidade || null,

    origem: 'cliente',
  });
}

function cleanText(value) {
  return String(value || '').trim();
}

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeInteger(value) {
  if (value === null || value === undefined || value === '') return null;

  const number = parseInt(value, 10);

  if (Number.isNaN(number)) return null;

  return number;
}

function normalizeMoney(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  const number = Number(
    String(value)
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );

  if (Number.isNaN(number)) return null;

  return number;
}

function getCategoryByType(type) {
  const normalizedType = String(type || '').trim();

  const financialTypes = ['mensalidade', 'cobranca', 'pagamento'];
  const contentTypes = ['artigo', 'post', 'relatorio', 'conteudo'];
  const serviceTypes = ['reuniao', 'aprovacao', 'ajuste'];
  const commercialTypes = ['follow_up', 'ligacao'];

  if (financialTypes.includes(normalizedType)) return 'financeiro';
  if (contentTypes.includes(normalizedType)) return 'conteudo';
  if (serviceTypes.includes(normalizedType)) return 'atendimento';
  if (commercialTypes.includes(normalizedType)) return 'comercial';

  return 'operacional';
}

function buildDueDate(year, month, day) {
  const safeDay = Math.min(Math.max(Number(day || 10), 1), 28);
  const safeMonth = String(month).padStart(2, '0');
  const safeDayText = String(safeDay).padStart(2, '0');

  return `${year}-${safeMonth}-${safeDayText}`;
}

function getMonthDateRange(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0);
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

  return { startDate, endDate };
}

function getMonthReferenceFromDate(value) {
  if (!value) return '';

  return String(value).slice(0, 7);
}

function buildMonthlyDueDate(monthReference, day = 10) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) {
    throw new Error('Mes de referencia invalido.');
  }

  return buildDueDate(year, month, day);
}

function getNextMonthlyRecurrence(monthReference, day = 10) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) {
    throw new Error('Mes de referencia invalido.');
  }

  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);

  return buildDueDate(date.getFullYear(), date.getMonth() + 1, day);
}

function getRecurringBaseTitle(title) {
  return cleanText(title)
    .replace(/\s+-\s+\d+\s+artigos?\s+para\s+.+$/i, '')
    .replace(/\s+para\s+(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de?\s*\d{4}$/i, '')
    .trim();
}

function extractArticleQuantity(title) {
  const match = String(title || '').match(/(\d+)\s+artigos?/i);

  return match ? normalizeInteger(match[1]) : 0;
}

function normalizeDuplicateText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function getRecurringDuplicateKey(task, monthReference) {
  const clientKey = task?.cliente_id || normalizeDuplicateText(task?.cliente_nome);
  const baseTitle = getRecurringBaseTitle(task?.titulo) || normalizeDuplicateText(task?.titulo);

  return `${clientKey}:${normalizeDuplicateText(baseTitle)}:${monthReference}`;
}

function buildRecurringTaskTitle(template, monthReference) {
  const quantity = normalizeInteger(template.quantidade_artigos) || extractArticleQuantity(template.titulo) || 0;
  const baseTitle = getRecurringBaseTitle(template.titulo) || template.cliente_nome || 'Cliente';
  const monthLabel = formatMonthReferenceLabel(monthReference);

  if (quantity > 0) {
    return `${baseTitle} - ${quantity} artigos para ${monthLabel}`;
  }

  return `${baseTitle} - artigos para ${monthLabel}`;
}

function formatMonthReferenceLabel(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return monthReference;

  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}
