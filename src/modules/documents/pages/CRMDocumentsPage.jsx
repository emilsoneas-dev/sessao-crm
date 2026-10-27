import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  Link2,
  Search,
  X,
} from 'lucide-react';
import { updateClientDetails } from '../../leads/services/leadsService.js';
import '../styles/documents.css';

const DOCUMENT_FIELDS = [
  { key: 'drive_url', label: 'Drive', group: 'base', priority: true },
  { key: 'documento_url', label: 'Apoio', group: 'base', priority: true },
  { key: 'briefing_url', label: 'Briefing', group: 'base', priority: true },
  { key: 'estrategia_url', label: 'Estrategia', group: 'entrega', priority: true },
  { key: 'conteudos_url', label: 'Conteudos', group: 'entrega', priority: true },
  { key: 'contrato_url', label: 'Contrato', group: 'comercial', priority: true },
  { key: 'relatorios_url', label: 'Relatorios', group: 'entrega' },
  { key: 'financeiro_url', label: 'Financeiro', group: 'financeiro' },
  { key: 'tarefas_url', label: 'Tarefas', group: 'operacao' },
  { key: 'acessos_url', label: 'Acessos', group: 'operacao' },
  { key: 'historico_url', label: 'Historico', group: 'operacao' },
];

const GROUP_LABELS = {
  todos: 'Todos',
  base: 'Base',
  comercial: 'Comercial',
  entrega: 'Entrega',
  financeiro: 'Financeiro',
  operacao: 'Operacao',
};

const STATUS_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'completo', label: 'Completo' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'sem_links', label: 'Sem documentos' },
  { value: 'precisa_revisar', label: 'Precisa revisar' },
  { value: 'sem_drive', label: 'Sem Drive' },
  { value: 'sem_contrato', label: 'Sem contrato' },
  { value: 'sem_briefing', label: 'Sem briefing' },
  { value: 'recentes', label: 'Atualizados recentemente' },
];

export function CRMDocumentsPage({ clients = [] }) {
  const [documentClients, setDocumentClients] = useState(clients);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [draftLinks, setDraftLinks] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    group: 'todos',
    status: 'todos',
  });

  useEffect(() => {
    setDocumentClients(clients);
  }, [clients]);

  const selectedClient = useMemo(() => {
    return documentClients.find((client) => String(client.id) === String(selectedClientId)) || null;
  }, [documentClients, selectedClientId]);

  const documentStats = useMemo(() => {
    const totalClients = documentClients.length;
    const completeClients = documentClients.filter((client) => getDocumentStatus(client).value === 'completo').length;
    const clientsWithoutDocuments = documentClients.filter((client) => countClientDocuments(client) === 0).length;
    const updatedRecently = documentClients.filter(wasClientRecentlyUpdated).length;
    const filledSlots = documentClients.reduce((total, client) => total + countClientDocuments(client), 0);

    return {
      totalClients,
      completeClients,
      clientsWithoutDocuments,
      updatedRecently,
      filledSlots,
    };
  }, [documentClients]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = normalizeSearch(searchTerm);

    return documentClients.filter((client) => {
      const documents = getClientDocuments(client, filters.group);
      const filledDocuments = documents.filter((doc) => doc.value);
      const status = getDocumentStatus(client);
      const content = [
        client.nome,
        client.empresa,
        client.email,
        client.servico_contratado,
        client.plano_contratado,
        client.responsavel_cliente,
        client.responsavel,
        ...DOCUMENT_FIELDS.map((field) => field.label),
      ].filter(Boolean).join(' ');

      const matchesSearch = !normalizedSearch || normalizeSearch(content).includes(normalizedSearch);
      const matchesStatus =
        filters.status === 'todos' ||
        (filters.status === 'completo' && status.value === 'completo') ||
        (filters.status === 'parcial' && status.value === 'parcial') ||
        (filters.status === 'sem_links' && filledDocuments.length === 0) ||
        (filters.status === 'precisa_revisar' && status.value === 'precisa_revisar') ||
        (filters.status === 'sem_drive' && !client.drive_url) ||
        (filters.status === 'sem_contrato' && !client.contrato_url) ||
        (filters.status === 'sem_briefing' && !client.briefing_url) ||
        (filters.status === 'recentes' && wasClientRecentlyUpdated(client));

      return matchesSearch && matchesStatus;
    });
  }, [documentClients, filters, searchTerm]);

  function openClientDrawer(client) {
    setSelectedClientId(client.id);
    setDraftLinks(buildDraftLinks(client));
    setFeedback('');
    setCopiedKey('');
  }

  function closeClientDrawer() {
    if (saving) return;

    setSelectedClientId('');
    setDraftLinks({});
    setFeedback('');
    setCopiedKey('');
  }

  function handleClearFilters() {
    setFilters({
      group: 'todos',
      status: 'todos',
    });
    setSearchTerm('');
  }

  function applyQuickFilter(status) {
    setFilters((current) => ({
      ...current,
      status,
    }));
  }

  function handleChangeDraft(field, value) {
    setDraftLinks((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveLinks() {
    if (!selectedClient) return;

    try {
      setSaving(true);
      setFeedback('');

      const updatedClient = await updateClientDetails(selectedClient.id, {
        ...selectedClient,
        ...draftLinks,
      });

      setDocumentClients((current) => current.map((client) => (
        String(client.id) === String(updatedClient.id) ? updatedClient : client
      )));
      setDraftLinks(buildDraftLinks(updatedClient));
      setFeedback('Links salvos com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar documentos:', error);
      setFeedback(error?.message || 'Nao foi possivel salvar os links.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink(field, value) {
    const safeLink = normalizeUrl(value);
    if (!safeLink || !navigator?.clipboard) return;

    await navigator.clipboard.writeText(safeLink);
    setCopiedKey(field);

    window.setTimeout(() => setCopiedKey(''), 1200);
  }

  return (
    <section className="documents-page">
      <div className="documents-stats">
        <DocumentStat
          label="Completos"
          value={documentStats.completeClients}
          helper="Clientes com links principais"
          icon={CheckCircle2}
          type="green"
          active={filters.status === 'completo'}
          onClick={() => applyQuickFilter('completo')}
        />
        <DocumentStat
          label="Sem documentos"
          value={documentStats.clientsWithoutDocuments}
          helper="Precisam de cadastro"
          icon={AlertCircle}
          type="red"
          active={filters.status === 'sem_links'}
          onClick={() => applyQuickFilter('sem_links')}
        />
        <DocumentStat
          label="Links ativos"
          value={documentStats.filledSlots}
          helper="Atalhos cadastrados"
          icon={Link2}
          type="blue"
          active={filters.status === 'todos'}
          onClick={() => applyQuickFilter('todos')}
        />
        <DocumentStat
          label="Atualizados"
          value={documentStats.updatedRecently}
          helper="Nos ultimos 30 dias"
          icon={FolderOpen}
          type="amber"
          active={filters.status === 'recentes'}
          onClick={() => applyQuickFilter('recentes')}
        />
      </div>

      <section className="documents-card">
        <div className="documents-card__header">
          <div>
            <span>Documentos</span>
            <h3>Central de links da carteira</h3>
            <p>Mostrando {filteredClients.length} de {documentClients.length} cliente(s)</p>
          </div>

          <div className="documents-toolbar">
            <label className="documents-search">
              <Search size={16} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar cliente, empresa, documento..."
              />
            </label>

            <button
              type="button"
              className="documents-tool-button"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <Filter size={16} />
              Filtros
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="documents-filters-panel">
            <label>
              <span>Categoria</span>
              <select
                value={filters.group}
                onChange={(event) => setFilters((current) => ({ ...current, group: event.target.value }))}
              >
                {Object.entries(GROUP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>

            <button type="button" className="documents-tool-button" onClick={handleClearFilters}>
              Limpar filtros
            </button>
          </div>
        )}

        <div className="documents-table">
          <div className="documents-table__head">
            <span>Cliente</span>
            <span>Status</span>
            <span>Links principais</span>
            <span>Ultima atualizacao</span>
            <span>Acoes</span>
          </div>

          {filteredClients.length === 0 ? (
            <div className="documents-empty">
              <strong>Nenhum cliente encontrado.</strong>
              <p>Cadastre clientes ou ajuste os filtros para ver os documentos disponiveis.</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <ClientDocumentsRow
                key={client.id}
                client={client}
                group={filters.group}
                onOpen={openClientDrawer}
                onCopy={handleCopyLink}
                copiedKey={copiedKey}
              />
            ))
          )}
        </div>
      </section>

      {selectedClient && (
        <DocumentDrawer
          client={selectedClient}
          draftLinks={draftLinks}
          feedback={feedback}
          saving={saving}
          copiedKey={copiedKey}
          onChange={handleChangeDraft}
          onCopy={handleCopyLink}
          onClose={closeClientDrawer}
          onSave={handleSaveLinks}
        />
      )}
    </section>
  );
}

function DocumentStat({ label, value, helper, icon: Icon, type, active, onClick }) {
  return (
    <button
      type="button"
      className={`document-stat document-stat--${type} ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
      <div className="document-stat__icon">
        <Icon size={20} />
      </div>
    </button>
  );
}

function ClientDocumentsRow({ client, group, onOpen, onCopy, copiedKey }) {
  const documents = getClientDocuments(client, group);
  const filledDocuments = documents.filter((doc) => doc.value);
  const priorityDocuments = getPriorityDocuments(client).filter((doc) => group === 'todos' || doc.group === group);
  const status = getDocumentStatus(client);
  const primaryLink = normalizeUrl(client.drive_url || client.documento_url || filledDocuments[0]?.value);

  return (
    <article className="documents-table-row">
      <div className="documents-client-cell">
        <div className="documents-client-avatar">
          {getInitials(client.nome || client.empresa)}
        </div>
        <div>
          <strong>{client.nome || client.empresa || 'Cliente sem nome'}</strong>
          <span>{client.empresa || client.servico_contratado || 'Carteira de cliente'}</span>
        </div>
      </div>

      <div>
        <span className={`documents-status documents-status--${status.value}`}>
          {status.label}
        </span>
        <small className="documents-muted">{filledDocuments.length} de {documents.length} links</small>
      </div>

      <div className="documents-link-pills">
        {priorityDocuments.map((doc) => (
          <DocumentMiniLink
            key={doc.key}
            document={doc}
            onCopy={() => onCopy(`${client.id}-${doc.key}`, doc.value)}
            copied={copiedKey === `${client.id}-${doc.key}`}
          />
        ))}
      </div>

      <div className="documents-date-cell">
        <span>{formatDate(client.data_ultima_atualizacao || client.updated_at || client.criado_em)}</span>
        <small>{wasClientRecentlyUpdated(client) ? 'Atualizado recentemente' : 'Sem movimento recente'}</small>
      </div>

      <div className="documents-row-actions">
        {primaryLink && (
          <a href={primaryLink} target="_blank" rel="noreferrer" title="Abrir link principal">
            <ExternalLink size={15} />
          </a>
        )}
        <button type="button" onClick={() => onOpen(client)} title="Editar links">
          <Edit3 size={15} />
        </button>
      </div>
    </article>
  );
}

function DocumentMiniLink({ document, onCopy, copied }) {
  const safeLink = normalizeUrl(document.value);

  if (!safeLink) {
    return (
      <span className="documents-mini-link is-empty">
        {document.label}
      </span>
    );
  }

  return (
    <span className="documents-mini-link has-link">
      <a href={safeLink} target="_blank" rel="noreferrer">
        {document.label}
      </a>
      <button type="button" onClick={onCopy} title="Copiar link">
        {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
      </button>
    </span>
  );
}

function DocumentDrawer({
  client,
  draftLinks,
  feedback,
  saving,
  copiedKey,
  onChange,
  onCopy,
  onClose,
  onSave,
}) {
  const status = getDocumentStatus({ ...client, ...draftLinks });
  const filledCount = countClientDocuments({ ...client, ...draftLinks });

  return (
    <div className="documents-drawer-backdrop" onClick={onClose}>
      <aside className="documents-drawer" onClick={(event) => event.stopPropagation()}>
        <header className="documents-drawer__header">
          <div>
            <span>Documentos do cliente</span>
            <h3>{client.nome || client.empresa || 'Cliente sem nome'}</h3>
            <p>{filledCount} links cadastrados na central</p>
          </div>
          <button type="button" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="documents-drawer__summary">
          <span className={`documents-status documents-status--${status.value}`}>{status.label}</span>
          <small>Edite, copie ou abra os atalhos sem sair da pagina.</small>
        </div>

        <div className="documents-drawer__links">
          {DOCUMENT_FIELDS.map((field) => {
            const value = draftLinks[field.key] || '';
            const safeLink = normalizeUrl(value);
            const copyId = `${client.id}-${field.key}-drawer`;

            return (
              <label key={field.key} className="documents-drawer-field">
                <span>{field.label}</span>
                <div>
                  <input
                    value={value}
                    onChange={(event) => onChange(field.key, event.target.value)}
                    placeholder={`Link de ${field.label.toLowerCase()}`}
                  />
                  {safeLink && (
                    <>
                      <button type="button" onClick={() => onCopy(copyId, value)} title="Copiar link">
                        {copiedKey === copyId ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                      </button>
                      <a href={safeLink} target="_blank" rel="noreferrer" title="Abrir link">
                        <ExternalLink size={15} />
                      </a>
                    </>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {feedback && <div className="documents-drawer-feedback">{feedback}</div>}

        <footer className="documents-drawer__footer">
          <button type="button" className="documents-tool-button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="documents-primary-button" onClick={onSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar links'}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function getClientDocuments(client, group = 'todos') {
  return DOCUMENT_FIELDS
    .filter((field) => group === 'todos' || field.group === group)
    .map((field) => ({
      ...field,
      value: client[field.key],
    }));
}

function getPriorityDocuments(client) {
  const priorityDocuments = DOCUMENT_FIELDS.filter((field) => field.priority);

  return priorityDocuments.map((field) => ({
    ...field,
    value: client[field.key],
  }));
}

function countClientDocuments(client) {
  return DOCUMENT_FIELDS.filter((field) => Boolean(client[field.key])).length;
}

function getDocumentStatus(client) {
  const filledCount = countClientDocuments(client);
  const priorityMissing = DOCUMENT_FIELDS
    .filter((field) => field.priority)
    .some((field) => !client[field.key]);

  if (filledCount === 0) return { value: 'sem_links', label: 'Sem documentos' };
  if (!priorityMissing) return { value: 'completo', label: 'Completo' };
  if (!client.drive_url || !client.briefing_url || !client.contrato_url) {
    return { value: 'precisa_revisar', label: 'Precisa revisar' };
  }

  return { value: 'parcial', label: 'Parcial' };
}

function buildDraftLinks(client) {
  return DOCUMENT_FIELDS.reduce((draft, field) => ({
    ...draft,
    [field.key]: client[field.key] || '',
  }), {});
}

function wasClientRecentlyUpdated(client) {
  const value = client.data_ultima_atualizacao || client.updated_at || client.criado_em;
  if (!value) return false;

  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) return false;

  const diffInDays = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays <= 30;
}

function formatDate(value) {
  if (!value) return 'Sem data';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function getInitials(value) {
  if (!value) return 'C';

  return String(value)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeUrl(url) {
  if (!url) return '';

  const trimmedUrl = String(url).trim();

  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}
