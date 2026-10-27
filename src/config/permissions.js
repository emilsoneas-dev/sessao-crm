export const USER_ROLES = {
  OWNER: 'dono',
  MANAGER: 'gestor',
  EMPLOYEE: 'funcionario',
  CLIENT: 'cliente',
};

export const PAGE_PERMISSIONS = {
  leads: ['dono', 'gestor', 'funcionario'],
  clientes: ['dono', 'gestor'],
  financeiro: ['dono', 'gestor'],
  'recursos-humanos': ['dono', 'gestor'],
  tarefas: ['dono', 'gestor', 'funcionario'],
  documentos: ['dono', 'gestor', 'funcionario', 'cliente'],
  instagram: ['dono', 'gestor', 'funcionario'],
  conteudo: ['dono', 'gestor', 'funcionario'],
  'visao-geral': ['dono', 'gestor'],
  configuracoes: ['dono'],
};

export const ACTION_PERMISSIONS = {
  canSeeFinancials: ['dono', 'gestor'],
  canEditClient: ['dono', 'gestor'],
  canConvertLead: ['dono', 'gestor'],
  canArchiveLead: ['dono', 'gestor'],
  canManageUsers: ['dono'],
  canEditSettings: ['dono'],
};

export function canAccessPageByRole(role, page) {
  if (!role || !page) return false;

  return PAGE_PERMISSIONS[page]?.includes(role) || false;
}

export function canPerformActionByRole(role, action) {
  if (!role || !action) return false;

  return ACTION_PERMISSIONS[action]?.includes(role) || false;
}

export function hasExtraPermission(extraPermissions = [], recursoTipo, recursoId, permissao = 'visualizar') {
  return extraPermissions.some((item) => {
    return (
      item.ativo !== false &&
      item.recurso_tipo === recursoTipo &&
      item.recurso_id === recursoId &&
      item.permissao === permissao
    );
  });
}

export function canAccessPage(role, page, extraPermissions = []) {
  if (canAccessPageByRole(role, page)) {
    return true;
  }

  return hasExtraPermission(extraPermissions, 'pagina', page, 'visualizar');
}

export function canPerformAction(role, action) {
  return canPerformActionByRole(role, action);
}
