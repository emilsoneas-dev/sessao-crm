import { supabase } from '../../../services/supabase/supabaseClient.js';

const USERS_TABLE = 'crm_usuarios';
const PERMISSIONS_TABLE = 'crm_permissoes_usuario';

async function getFunctionErrorMessage(error) {
  if (!error) {
    return 'Erro desconhecido ao chamar a função.';
  }

  try {
    if (error.context) {
      const response = error.context;

      if (typeof response.json === 'function') {
        const body = await response.json();

        if (body?.error) return body.error;
        if (body?.message) return body.message;
        if (body?.details) return body.details;
      }

      if (typeof response.text === 'function') {
        const text = await response.text();

        if (text) return text;
      }
    }
  } catch (parseError) {
    console.error('[CRM] Erro ao ler resposta da Edge Function:', parseError);
  }

  return error.message || 'Erro ao executar a Edge Function.';
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    throw new Error('Sessão expirada. Saia do CRM, entre novamente e tente outra vez.');
  }

  return accessToken;
}

export async function fetchCrmUsers() {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createCrmUser({
  nome,
  email,
  papel = 'funcionario',
  ativo = true,
}) {
  const payload = {
    nome: String(nome || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    papel,
    ativo,
  };

  if (!payload.nome || !payload.email) {
    throw new Error('Nome e e-mail são obrigatórios.');
  }

  const accessToken = await getAccessToken();

  const { data, error } = await supabase.functions.invoke('create-crm-user', {
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    const message = await getFunctionErrorMessage(error);
    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.user;
}

export async function fetchAllExtraPermissions() {
  const { data, error } = await supabase
    .from(PERMISSIONS_TABLE)
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createUserPagePermission({
  usuario_email,
  recurso_id,
  permissao = 'visualizar',
}) {
  const payload = {
    usuario_email: String(usuario_email || '').trim().toLowerCase(),
    recurso_tipo: 'pagina',
    recurso_id,
    permissao,
    ativo: true,
    atualizado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(PERMISSIONS_TABLE)
    .upsert(payload, {
      onConflict: 'usuario_email,recurso_tipo,recurso_id,permissao',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function disableUserPermission(permissionId) {
  const { data, error } = await supabase
    .from(PERMISSIONS_TABLE)
    .update({
      ativo: false,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', permissionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function cancelUserInvite(userId) {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update({
      ativo: false,
      convite_status: 'cancelado',
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function disableCrmUserAccess(userId) {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update({
      ativo: false,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteCrmUser(userId, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!userId || !normalizedEmail) {
    throw new Error('Usuário inválido.');
  }

  const { error: permissionsError } = await supabase
    .from(PERMISSIONS_TABLE)
    .delete()
    .eq('usuario_email', normalizedEmail);

  if (permissionsError) {
    throw permissionsError;
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .delete()
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}