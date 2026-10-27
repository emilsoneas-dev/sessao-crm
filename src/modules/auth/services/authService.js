import { supabase } from '../../../services/supabase/supabaseClient.js';

const USERS_TABLE = 'crm_usuarios';

export async function fetchCurrentCrmUser(session) {
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .eq('email', email)
    .eq('ativo', true)
    .maybeSingle();

  if (error) {
    console.error('[CRM] Erro ao buscar usuário do CRM:', error);
    return null;
  }

  return data || null;
}