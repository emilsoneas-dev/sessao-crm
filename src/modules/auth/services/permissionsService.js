import { supabase } from '../../../services/supabase/supabaseClient.js';

const PERMISSIONS_TABLE = 'crm_permissoes_usuario';

export async function fetchUserExtraPermissions(email) {
  if (!email) return [];

  const { data, error } = await supabase
    .from(PERMISSIONS_TABLE)
    .select('*')
    .eq('usuario_email', email)
    .eq('ativo', true);

  if (error) {
    console.error('[CRM] Erro ao buscar permissões extras:', error);
    return [];
  }

  return data || [];
}