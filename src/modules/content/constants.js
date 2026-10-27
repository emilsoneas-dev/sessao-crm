export const CONTENT_MODULE_ID = 'content';

export const CONTENT_MODULE_LABEL = 'Central de Revisao de Conteudo';

export const CONTENT_PACKAGE_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_revisao', label: 'Em revisao' },
  { value: 'parcialmente_aprovado', label: 'Parcialmente aprovado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'ajustes_pendentes', label: 'Ajustes pendentes' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'arquivado', label: 'Arquivado' },
];

export const CONTENT_ARTICLE_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'aguardando_aprovacao', label: 'Aguardando aprovacao' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'ajuste_solicitado', label: 'Ajuste solicitado' },
  { value: 'revisado', label: 'Revisado' },
  { value: 'publicado', label: 'Publicado' },
];

export const CONTENT_REVIEW_ACTIONS = [
  { value: 'aprovar', label: 'Aprovar', nextStatus: 'aprovado' },
  { value: 'revisar', label: 'Revisar', nextStatus: 'ajuste_solicitado', requiresComment: true },
  { value: 'comentar', label: 'Comentar', nextStatus: null },
];

export const CONTENT_COMMENT_AUTHOR_TYPES = [
  { value: 'agencia', label: 'Agencia' },
  { value: 'cliente', label: 'Cliente' },
];

export const CONTENT_COMMENT_ORIGINS = [
  { value: 'crm', label: 'CRM' },
  { value: 'link_magico', label: 'Link magico' },
];

export const CONTENT_BRIEFING_STATUS = [
  { value: 'nao_iniciado', label: 'Nao iniciado' },
  { value: 'dispensado', label: 'Agora nao' },
  { value: 'enviado', label: 'Enviado' },
];

export const CONTENT_INTERNAL_ALLOWED_ROLES = ['dono', 'gestor', 'funcionario'];
