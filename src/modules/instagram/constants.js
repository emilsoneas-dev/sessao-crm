export const INSTAGRAM_MODULE_ID = 'instagram';

export const INSTAGRAM_TABS = [
  {
    id: 'feed',
    label: 'Feed',
    description: 'Posts planejados para o perfil.',
  },
  {
    id: 'reels',
    label: 'Reels',
    description: 'Videos curtos planejados para revisao.',
  },
  {
    id: 'resultados',
    label: 'Resultados',
    description: 'Metricas manuais, simuladas ou futuras metricas da Meta.',
  },
];

export const INSTAGRAM_CONTENT_TYPES = [
  { value: 'feed', label: 'Feed' },
  { value: 'reels', label: 'Reels' },
  { value: 'story', label: 'Story' },
  { value: 'carrossel', label: 'Carrossel' },
];

export const INSTAGRAM_CONTENT_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_revisao', label: 'Em revisao' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'ajuste_solicitado', label: 'Ajuste solicitado' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'arquivado', label: 'Arquivado' },
];

export const INSTAGRAM_APPROVAL_ACTIONS = [
  { value: 'aprovar', label: 'Aprovar', nextStatus: 'aprovado' },
  { value: 'reprovar', label: 'Reprovar', nextStatus: 'reprovado', requiresComment: true },
  {
    value: 'solicitar_ajuste',
    label: 'Solicitar ajuste',
    nextStatus: 'ajuste_solicitado',
    requiresComment: true,
  },
];

export const INSTAGRAM_METRIC_SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'simulada', label: 'Simulada' },
  { value: 'meta_api', label: 'Meta API' },
];

export const INSTAGRAM_PLANNING_STATUS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_planejamento', label: 'Em planejamento' },
  { value: 'em_execucao', label: 'Em execucao' },
  { value: 'concluido', label: 'Concluido' },
  { value: 'pausado', label: 'Pausado' },
];

export const INSTAGRAM_COMMENT_AUTHOR_TYPES = [
  { value: 'agencia', label: 'Agencia' },
  { value: 'cliente', label: 'Cliente' },
];

export const INSTAGRAM_COMMENT_ORIGINS = [
  { value: 'crm', label: 'CRM' },
  { value: 'link_magico', label: 'Link magico' },
];

export const INSTAGRAM_INTERNAL_ALLOWED_ROLES = ['dono', 'gestor', 'funcionario'];
