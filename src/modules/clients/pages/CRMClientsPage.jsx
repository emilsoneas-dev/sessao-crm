import { useEffect, useMemo, useState } from 'react';
import {
  Columns3,
  Download,
  Edit3,
  Eye,
  Filter,
  List,
  MessageCircle,
  Plus,
  Search,
} from 'lucide-react';
import { getLeadInitials, getWhatsAppLink } from '../../leads/utils/leadHelpers.js';
import {
  archiveClient,
  createClientDetails,
  deleteClient,
  updateClientDetails,
} from '../../leads/services/leadsService.js';
import { ClientProfileTabsModal } from '../components/ClientProfileTabsModal.jsx';
import { ClientsKanbanView } from '../components/ClientsKanbanView.jsx';
import '../styles/clients.css';

const CLIENT_STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'implantacao', label: 'Implantacao' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'encerrado', label: 'Encerrado' },
];

const FINANCIAL_ALLOWED_ROLES = ['dono', 'gestor'];

const CLIENT_LINK_FIELDS = [
  'briefing_url',
  'estrategia_url',
  'contrato_url',
  'financeiro_url',
  'conteudos_url',
  'tarefas_url',
  'relatorios_url',
  'acessos_url',
  'drive_url',
  'historico_url',
];

const CLIENT_VIEW_MODE_STORAGE_KEY = 'crm_clients_view_mode';

export function CRMClientsPage({ clients = [], crmUser, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(getInitialClientViewMode);
  const [statusOverrides, setStatusOverrides] = useState({});
  const [editingClient, setEditingClient] = useState(null);
  const [savingClient, setSavingClient] = useState(false);
  const [movingClientId, setMovingClientId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'todos',
    modelo: 'todos',
    responsavel: 'todos',
    pendencia: 'todas',
  });

  const userRole = crmUser?.papel || 'funcionario';
  const canSeeFinancials = FINANCIAL_ALLOWED_ROLES.includes(userRole);
  const canManageClients = FINANCIAL_ALLOWED_ROLES.includes(userRole);

  useEffect(() => {
    window.localStorage.setItem(CLIENT_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const visibleClients = useMemo(() => {
    return clients.map((client) => {
      const overriddenStatus = statusOverrides[client.id];
      return overriddenStatus ? { ...client, status_cliente: overriddenStatus } : client;
    });
  }, [clients, statusOverrides]);

  const activeClientsCount = visibleClients.filter((client) => (client.status_cliente || 'ativo') === 'ativo').length;
  const recurringClientsCount = visibleClients.filter(isRecurringClient).length;
  const monthlyArticlesCount = visibleClients.reduce((total, client) => total + getArticleQuantity(client), 0);
  const clientsWithoutProductionConfig = visibleClients.filter(hasProductionConfigIssue).length;

  const availableResponsibles = useMemo(() => {
    const responsibles = visibleClients
      .map((client) => client.responsavel_cliente || client.responsavel)
      .filter(Boolean);

    return Array.from(new Set(responsibles));
  }, [visibleClients]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return visibleClients.filter((client) => {
      const statusCliente = client.status_cliente || 'ativo';
      const responsavel = client.responsavel_cliente || client.responsavel || '';
      const recurring = isRecurringClient(client);

      const content = [
        client.nome,
        client.email,
        client.whatsapp,
        client.telefone,
        client.cidade,
        client.empresa,
        client.contato_principal,
        client.servico_contratado,
        client.plano_contratado,
        client.servico_interesse,
        client.interesse,
        client.nicho,
        client.site,
        client.website,
        client.responsavel_cliente,
        client.responsavel,
        client.status_cliente,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalizedSearch || content.includes(normalizedSearch);
      const matchesStatus = filters.status === 'todos' || statusCliente === filters.status;
      const matchesModel =
        filters.modelo === 'todos' ||
        (filters.modelo === 'recorrente' && recurring) ||
        (filters.modelo === 'avulso' && !recurring);
      const matchesResponsavel = filters.responsavel === 'todos' || responsavel === filters.responsavel;
      const matchesPendencia =
        filters.pendencia === 'todas' ||
        (filters.pendencia === 'sem_responsavel' && !responsavel) ||
        (filters.pendencia === 'sem_artigos' && recurring && !getArticleQuantity(client)) ||
        (filters.pendencia === 'sem_valor_artigo' && recurring && !getMoneyNumber(client.valor_por_artigo)) ||
        (filters.pendencia === 'sem_site' && !client.site && !client.website && !client.drive_url);

      return matchesSearch && matchesStatus && matchesModel && matchesResponsavel && matchesPendencia;
    }).sort(sortClientsByAttention);
  }, [visibleClients, searchTerm, filters]);

  function createEditableClient(client) {
    return {
      id: client.id,
      nome: client.nome || '',
      email: client.email || '',
      telefone: client.telefone || client.whatsapp || '',
      whatsapp: client.whatsapp || client.telefone || '',
      cidade: client.cidade || '',
      empresa: client.empresa || '',
      contato_principal: client.contato_principal || '',
      status_cliente: client.status_cliente || 'ativo',
      plano_contratado: client.plano_contratado || '',
      servico_contratado: client.servico_contratado || client.servico_interesse || client.interesse || '',
      data_inicio_cliente: client.data_inicio_cliente || getInputDate(client.convertido_em || client.data_entrada),
      mensalidade: client.mensalidade ?? '',
      dia_vencimento: client.dia_vencimento || '',
      status_financeiro: client.status_financeiro || 'nao_informado',
      responsavel_cliente: client.responsavel_cliente || client.responsavel || 'Emilson',
      recorrente: Boolean(client.recorrente),
      artigos_mensais: client.artigos_mensais || '',
      valor_por_artigo: client.valor_por_artigo ?? '',
      responsavel_padrao: client.responsavel_padrao || client.responsavel_cliente || client.responsavel || 'Emilson',
      proxima_acao: client.proxima_acao || '',
      ultima_acao: client.ultima_acao || '',
      meses_estimados_contrato: client.meses_estimados_contrato || 12,
      documento_url: client.documento_url || '',
      briefing_url: client.briefing_url || '',
      estrategia_url: client.estrategia_url || '',
      contrato_url: client.contrato_url || '',
      financeiro_url: client.financeiro_url || '',
      conteudos_url: client.conteudos_url || '',
      tarefas_url: client.tarefas_url || '',
      relatorios_url: client.relatorios_url || '',
      acessos_url: client.acessos_url || '',
      drive_url: client.drive_url || '',
      historico_url: client.historico_url || '',
      observacoes_cliente: client.observacoes_cliente || client.observacoes || '',
      isNewClient: false,
    };
  }

  function createBlankClient() {
    const today = new Date().toISOString().slice(0, 10);

    return {
      id: null,
      nome: '',
      email: '',
      telefone: '',
      whatsapp: '',
      cidade: '',
      empresa: '',
      contato_principal: '',
      status_cliente: 'ativo',
      plano_contratado: '',
      servico_contratado: '',
      data_inicio_cliente: today,
      mensalidade: '',
      dia_vencimento: '',
      status_financeiro: 'nao_informado',
      responsavel_cliente: crmUser?.nome || 'Emilson',
      recorrente: false,
      artigos_mensais: '',
      valor_por_artigo: '',
      responsavel_padrao: crmUser?.nome || 'Emilson',
      proxima_acao: '',
      ultima_acao: '',
      meses_estimados_contrato: 12,
      documento_url: '',
      briefing_url: '',
      estrategia_url: '',
      contrato_url: '',
      financeiro_url: '',
      conteudos_url: '',
      tarefas_url: '',
      relatorios_url: '',
      acessos_url: '',
      drive_url: '',
      historico_url: '',
      observacoes_cliente: '',
      isNewClient: true,
    };
  }

  function handleOpenClientCard(client) {
    setFeedback('');
    setEditingClient(createEditableClient(client));
  }

  function handleOpenNewClient() {
    setFeedback('');
    setEditingClient(createBlankClient());
  }

  function handleCloseClientCard() {
    if (savingClient) return;
    setEditingClient(null);
    setFeedback('');
  }

  function handleChangeEditField(field, value) {
    setEditingClient((current) => ({ ...current, [field]: value }));
  }

  function handleChangeViewMode(nextViewMode) {
    setViewMode(nextViewMode);
  }

  async function handleMoveClientStatus(client, nextStatus) {
    if (!client?.id || !nextStatus) return;

    const currentStatus = client.status_cliente || 'ativo';
    if (currentStatus === nextStatus) return;

    try {
      setMovingClientId(client.id);
      setFeedback('Atualizando status do cliente...');
      setStatusOverrides((current) => ({ ...current, [client.id]: nextStatus }));
      await updateClientDetails(client.id, {
        ...createEditableClient(client),
        status_cliente: nextStatus,
      });
      setFeedback('Status do cliente atualizado.');
    } catch (error) {
      console.error('Erro ao mover cliente no kanban:', error);
      setStatusOverrides((current) => ({ ...current, [client.id]: currentStatus }));
      setFeedback('Nao foi possivel atualizar o status do cliente.');
    } finally {
      setMovingClientId(null);
    }
  }

  async function handleSaveClient() {
    if (!editingClient) return;

    if (!String(editingClient.nome || '').trim()) {
      setFeedback('Informe o nome do cliente.');
      return;
    }

    try {
      setSavingClient(true);
      setFeedback('');

      if (editingClient.isNewClient) {
        await createClientDetails(editingClient);
        setFeedback('Cliente criado com sucesso.');
      } else {
        await updateClientDetails(editingClient.id, editingClient);
        setFeedback('Cliente atualizado com sucesso.');
      }

      window.setTimeout(() => {
        setEditingClient(null);
        setFeedback('');
        window.location.reload();
      }, 900);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setFeedback('Nao foi possivel salvar o cliente.');
    } finally {
      setSavingClient(false);
    }
  }

  async function handleArchiveClient(client) {
    if (!client?.id) return;

    const shouldArchive = window.confirm(
      `Inativar o cliente ${client.nome || 'sem nome'}? Ele saira da carteira ativa, mas continuara salvo no CRM.`
    );

    if (!shouldArchive) return;

    try {
      setSavingClient(true);
      setFeedback('');
      await archiveClient(client.id);
      setFeedback('Cliente inativado com sucesso.');
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      console.error('Erro ao inativar cliente:', error);
      setFeedback('Nao foi possivel inativar o cliente.');
    } finally {
      setSavingClient(false);
    }
  }

  async function handleDeleteClient(client) {
    if (!client?.id) return;

    const shouldDelete = window.confirm(
      `Excluir definitivamente ${client.nome || 'este cliente'}? Essa acao remove o registro e nao deve ser usada se voce quiser manter historico.`
    );

    if (!shouldDelete) return;

    try {
      setSavingClient(true);
      setFeedback('');
      await deleteClient(client.id);
      setFeedback('Cliente excluido com sucesso.');
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      setFeedback('Nao foi possivel excluir o cliente.');
    } finally {
      setSavingClient(false);
    }
  }

  function handleClearFilters() {
    setFilters({
      status: 'todos',
      modelo: 'todos',
      responsavel: 'todos',
      pendencia: 'todas',
    });
  }

  return (
    <section className="clients-page">
      <div className="clients-dashboard-grid clients-dashboard-grid--compact">
        <section className="clients-table-card">
          <div className="clients-page-header">
            <div className="clients-page-summary" aria-label="Clientes exibidos">
              <strong>{filteredClients.length}</strong>
              <span>de {clients.length} clientes exibidos</span>
            </div>

            <div className="clients-toolbar">
              <div className="clients-view-toggle" role="group" aria-label="Modo de visualizacao dos clientes">
                <button
                  className={viewMode === 'lista' ? 'is-active' : ''}
                  type="button"
                  title="Ver em lista"
                  onClick={() => handleChangeViewMode('lista')}
                >
                  <List size={15} />
                  Lista
                </button>
                <button
                  className={viewMode === 'kanban' ? 'is-active' : ''}
                  type="button"
                  title="Ver em kanban"
                  onClick={() => handleChangeViewMode('kanban')}
                >
                  <Columns3 size={15} />
                  Kanban
                </button>
              </div>

              <label className="clients-search">
                <Search size={16} />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar cliente..." />
              </label>

              <button className="clients-tool-button" type="button" onClick={() => setFiltersOpen((current) => !current)}>
                <Filter size={16} />
                Filtros
              </button>

              <button className="clients-icon-button" type="button" title="Exportar clientes">
                <Download size={16} />
              </button>

              <button className="clients-primary-button" type="button" onClick={handleOpenNewClient}>
                <Plus size={16} />
                Novo cliente
              </button>
            </div>
          </div>

          <div className="clients-portfolio-strip" aria-label="Resumo da carteira">
            <PortfolioMetric label="Ativos" value={activeClientsCount} />
            <PortfolioMetric label="Recorrentes" value={recurringClientsCount} />
            <PortfolioMetric label="Artigos/mes" value={monthlyArticlesCount} />
            <PortfolioMetric label="Ajustar cadastro" value={clientsWithoutProductionConfig} tone="warning" />
          </div>

          {filtersOpen && (
            <div className="clients-filters-panel">
              <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))}>
                <option value="todos">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="implantacao">Implantacao</option>
                <option value="pausado">Pausado</option>
                <option value="encerrado">Encerrado</option>
              </FilterSelect>

              <FilterSelect label="Modelo" value={filters.modelo} onChange={(value) => setFilters((current) => ({ ...current, modelo: value }))}>
                <option value="todos">Todos</option>
                <option value="recorrente">Recorrentes</option>
                <option value="avulso">Avulsos</option>
              </FilterSelect>

              <FilterSelect label="Responsavel" value={filters.responsavel} onChange={(value) => setFilters((current) => ({ ...current, responsavel: value }))}>
                <option value="todos">Todos</option>
                {availableResponsibles.map((responsible) => (
                  <option key={responsible} value={responsible}>{responsible}</option>
                ))}
              </FilterSelect>

              <FilterSelect label="Pendencias" value={filters.pendencia} onChange={(value) => setFilters((current) => ({ ...current, pendencia: value }))}>
                <option value="todas">Todas</option>
                <option value="sem_responsavel">Sem responsavel</option>
                <option value="sem_artigos">Sem artigos definidos</option>
                <option value="sem_valor_artigo">Sem valor por artigo</option>
                <option value="sem_site">Sem site/link principal</option>
              </FilterSelect>

              <button type="button" className="clients-tool-button" onClick={handleClearFilters}>Limpar filtros</button>
            </div>
          )}

          {feedback && !editingClient && <div className="clients-inline-feedback">{feedback}</div>}

          {viewMode === 'lista' ? (
            <div className="clients-table-list">
              <div className="clients-table-head clients-table-head--compact">
                <span>Cliente</span>
                <span>Modelo</span>
                <span>Artigos</span>
                <span>Valor/artigo</span>
                <span>Responsavel</span>
                <span>Status</span>
                <span>Acoes</span>
              </div>

              {filteredClients.length === 0 ? (
                <div className="clients-empty">
                  <strong>Nenhum cliente encontrado.</strong>
                  <p>Quando um lead for marcado como cliente na etapa de conclusao, ele aparecera aqui.</p>
                </div>
              ) : (
                <div className="clients-list">
                  {filteredClients.map((client) => (
                    <ClientRow key={client.id} client={client} onOpenClientCard={handleOpenClientCard} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <ClientsKanbanView
              clients={filteredClients}
              movingClientId={movingClientId}
              onOpenClientCard={handleOpenClientCard}
              onMoveClientStatus={handleMoveClientStatus}
            />
          )}

          <div className="clients-table-footer">
            <span>{clientsWithoutProductionConfig} cliente(s) precisam completar dados de producao.</span>
            <span className="clients-table-footer__hint">
              {viewMode === 'lista'
                ? 'Use o icone de olho para abrir a ficha completa.'
                : 'Arraste clientes entre colunas para mudar o status.'}
            </span>
          </div>
        </section>
      </div>

      {editingClient && (
        <ClientProfileTabsModal
          client={editingClient}
          saving={savingClient}
          feedback={feedback}
          canSeeFinancials={canSeeFinancials}
          canManageClients={canManageClients}
          onChange={handleChangeEditField}
          onSave={handleSaveClient}
          onArchive={handleArchiveClient}
          onDelete={handleDeleteClient}
          onNavigate={onNavigate}
          onClose={handleCloseClientCard}
        />
      )}
    </section>
  );
}

function PortfolioMetric({ label, value, tone = 'neutral' }) {
  return (
    <div className={`clients-portfolio-metric clients-portfolio-metric--${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  );
}

function ClientRow({ client, onOpenClientCard }) {
  const telefoneLead = client.whatsapp || client.telefone || '';
  const whatsappLink = getWhatsAppLink(telefoneLead);
  const statusCliente = client.status_cliente || 'ativo';
  const responsavel = client.responsavel_cliente || client.responsavel || 'Emilson';
  const recurring = isRecurringClient(client);
  const articles = getArticleQuantity(client);
  const articleValue = getMoneyNumber(client.valor_por_artigo);

  return (
    <article className="client-row client-row--compact">
      <button className="client-row__main" type="button" onClick={() => onOpenClientCard(client)}>
        <div className="client-row__avatar">{getLeadInitials(client.nome)}</div>
        <div>
          <h4>{client.nome || 'Cliente sem nome'}</h4>
          <p>{getClientSubtitle(client)}</p>
        </div>
      </button>

      <div>
        <span className={`client-model-badge ${recurring ? 'is-recurring' : 'is-single'}`}>
          {recurring ? 'Recorrente' : 'Avulso'}
        </span>
      </div>

      <div className={`client-row__meta ${recurring && !articles ? 'client-row__meta--warning' : ''}`}>
        <span>{articles || '-'}</span>
        <small>Artigos/mes</small>
      </div>

      <div className={`client-row__meta ${recurring && !articleValue ? 'client-row__meta--warning' : ''}`}>
        <span>{articleValue ? formatCurrency(articleValue) : '-'}</span>
        <small>Por artigo</small>
      </div>

      <div className="client-row__responsible">
        <span>{getLeadInitials(responsavel)}</span>
        <strong>{responsavel}</strong>
      </div>

      <div><span className={`client-status client-status--${normalizeStatusClass(statusCliente)}`}>{getStatusLabel(statusCliente)}</span></div>

      <div className="client-row__actions">
        <button type="button" title="Abrir ficha completa" aria-label="Abrir ficha completa" onClick={() => onOpenClientCard(client)}><Eye size={16} /></button>
        {whatsappLink && (
          <a href={whatsappLink} target="_blank" rel="noreferrer" title="Chamar no WhatsApp"><MessageCircle size={16} /></a>
        )}
        <button type="button" title="Editar cliente" aria-label="Editar cliente" onClick={() => onOpenClientCard(client)}><Edit3 size={16} /></button>
      </div>
    </article>
  );
}

function getStatusLabel(status) {
  const found = CLIENT_STATUS_OPTIONS.find((option) => option.value === status);
  return found?.label || 'Ativo';
}

function normalizeStatusClass(status) {
  return String(status || 'ativo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function getClientSubtitle(client) {
  const service = client.nicho || client.servico_contratado || client.plano_contratado || client.servico_interesse || client.interesse;
  const site = client.site || client.website;

  if (service && site) return `${service} | ${site}`;
  if (service) return service;
  if (site) return site;

  return client.empresa || client.cidade || client.origem || 'Dados principais pendentes';
}

function getInputDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

function getMoneyNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;

  const normalized = String(value)
    .replace(/\s/g, '')
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.');

  const number = Number(normalized);
  return Number.isNaN(number) ? 0 : number;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function countClientLinks(client) {
  return [client.documento_url, ...CLIENT_LINK_FIELDS.map((field) => client[field])].filter(Boolean).length;
}

function isRecurringClient(client) {
  return client.recorrente === true || Number(client.artigos_mensais || 0) > 0;
}

function getArticleQuantity(client) {
  const quantity = Number(client.artigos_mensais || 0);
  return Number.isFinite(quantity) ? quantity : 0;
}

function hasProductionConfigIssue(client) {
  const recurring = isRecurringClient(client);
  const responsible = client.responsavel_padrao || client.responsavel_cliente || client.responsavel;

  return !responsible || (recurring && (!getArticleQuantity(client) || !getMoneyNumber(client.valor_por_artigo)));
}

function sortClientsByAttention(firstClient, secondClient) {
  const firstRank = getClientAttentionRank(firstClient);
  const secondRank = getClientAttentionRank(secondClient);

  if (firstRank !== secondRank) {
    return firstRank - secondRank;
  }

  return String(firstClient.nome || firstClient.empresa || '').localeCompare(
    String(secondClient.nome || secondClient.empresa || ''),
    'pt-BR'
  );
}

function getClientAttentionRank(client) {
  if (hasProductionConfigIssue(client)) return 0;
  if (!client.proxima_acao) return 1;
  if (!client.documento_url && countClientLinks(client) === 0) return 2;
  if ((client.status_cliente || 'ativo') === 'implantacao') return 3;
  return 5;
}

function getInitialClientViewMode() {
  if (typeof window === 'undefined') return 'lista';
  const savedViewMode = window.localStorage.getItem(CLIENT_VIEW_MODE_STORAGE_KEY);
  return savedViewMode === 'kanban' ? 'kanban' : 'lista';
}
