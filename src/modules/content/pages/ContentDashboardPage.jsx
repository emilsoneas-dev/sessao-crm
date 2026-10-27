import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Copy,
  Edit3,
  FileText,
  FolderOpen,
  History,
  Link,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { ContentArticleEditorModal } from '../components/ContentArticleEditorModal.jsx';
import { ContentArticlesPanel } from '../components/ContentArticlesPanel.jsx';
import { ContentHistoryPanel } from '../components/ContentHistoryPanel.jsx';
import { EditorialStrategyPanel } from '../components/EditorialStrategyPanel.jsx';
import { ContentPackageModal } from '../components/ContentPackageModal.jsx';
import {
  createContentDelivery,
  createContentItem,
  createContentMagicReviewLink,
  deleteContentDelivery,
  deleteContentItem,
  duplicateContentItem,
  fetchContentBriefingsByDelivery,
  fetchContentDashboardDeliveries,
  fetchContentHistoryByDelivery,
  fetchContentItemsByDelivery,
  fetchContentMagicLinksByDelivery,
  getCurrentMonthReference,
  formatMonthReferenceLabel,
  getContentDeliveryStatusLabel,
  getContentDeliveryWorkflowKey,
  getContentDeliveryWorkflowStatus,
  updateContentItem,
  updateContentItemsOrder,
  updateContentEditorialStrategy,
  updateContentDelivery,
} from '../services/contentService.js';
import '../styles/content.css';

export function ContentDashboardPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeDeliveryId, setActiveDeliveryId] = useState('');
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [contentItems, setContentItems] = useState([]);
  const [contentItemsLoading, setContentItemsLoading] = useState(false);
  const [contentBriefings, setContentBriefings] = useState([]);
  const [contentHistory, setContentHistory] = useState([]);
  const [contentMagicLinks, setContentMagicLinks] = useState([]);
  const [contentItemsDeliveryId, setContentItemsDeliveryId] = useState('');
  const [contentBriefingsDeliveryId, setContentBriefingsDeliveryId] = useState('');
  const [contentHistoryDeliveryId, setContentHistoryDeliveryId] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState('summary');
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingContentItem, setEditingContentItem] = useState(null);
  const [focusedContentItemId, setFocusedContentItemId] = useState('');
  const [magicLink, setMagicLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardView, setDashboardView] = useState('month');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback('');

      const data = await fetchContentDashboardDeliveries();
      setDeliveries(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar dashboard de conteudo:', error);
      setFeedback('Nao foi possivel carregar a Central de Conteudo.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const clientRows = useMemo(() => buildClientRows(deliveries), [deliveries]);
  const currentMonth = useMemo(() => getCurrentMonthReference(), []);
  const monthClientRows = useMemo(() => (
    buildClientRows(deliveries.filter((delivery) => delivery.mes_referencia === currentMonth))
  ), [currentMonth, deliveries]);

  const dashboardRows = dashboardView === 'month' ? monthClientRows : clientRows;

  const filteredClientRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return dashboardRows;

    return dashboardRows.filter((row) => {
      const clientName = String(getClientName(row.delivery)).toLowerCase();
      const companyName = String(row.delivery.cliente?.empresa || '').toLowerCase();
      const title = String(row.delivery.titulo || '').toLowerCase();

      return clientName.includes(search) || companyName.includes(search) || title.includes(search);
    });
  }, [dashboardRows, searchTerm]);

  const selectedClientDeliveries = useMemo(() => {
    if (!selectedClient?.id) return [];

    return sortDeliveries(
      deliveries.filter((delivery) => delivery.cliente_id === selectedClient.id)
    );
  }, [deliveries, selectedClient]);

  const activeDelivery = useMemo(() => {
    return selectedClientDeliveries.find((delivery) => delivery.id === activeDeliveryId) || selectedClientDeliveries[0] || null;
  }, [activeDeliveryId, selectedClientDeliveries]);

  const summary = useMemo(() => {
    const clientIds = new Set(deliveries.map((delivery) => delivery.cliente_id).filter(Boolean));

    return {
      activeClients: clientIds.size,
      monthDeliveries: deliveries.filter((delivery) => delivery.mes_referencia === currentMonth).length,
      totalContents: deliveries.reduce((total, delivery) => total + Number(delivery.conteudos_total || 0), 0),
      pendingReview: deliveries.reduce((total, delivery) => total + Number(delivery.pendentes_revisao_total || 0), 0),
      readyToPublish: deliveries.filter((delivery) => getContentDeliveryWorkflowKey(delivery) === 'pronto_publicar').length,
      revisionRequested: deliveries.filter((delivery) => getContentDeliveryWorkflowKey(delivery) === 'ajustes_solicitados').length,
    };
  }, [currentMonth, deliveries]);

  const readyToPublishDeliveries = useMemo(() => (
    deliveries.filter((delivery) => getContentDeliveryWorkflowKey(delivery) === 'pronto_publicar')
  ), [deliveries]);

  const revisionRequestedDeliveries = useMemo(() => (
    deliveries.filter((delivery) => getContentDeliveryWorkflowKey(delivery) === 'ajustes_solicitados')
  ), [deliveries]);

  const loadContentItems = useCallback(async (deliveryId = activeDelivery?.id, options = {}) => {
    if (!deliveryId) {
      setContentItems([]);
      setContentItemsDeliveryId('');
      return [];
    }

    if (!options.force && contentItemsDeliveryId === deliveryId) {
      return contentItems;
    }

    try {
      setContentItemsLoading(true);

      const data = await fetchContentItemsByDelivery(deliveryId);
      setContentItems(data);
      setContentItemsDeliveryId(deliveryId);
      return data;
    } catch (error) {
      console.error('Erro ao carregar conteudos:', error);
      setFeedback('Nao foi possivel carregar os itens deste pacote.');
      return [];
    } finally {
      setContentItemsLoading(false);
    }
  }, [activeDelivery?.id, contentItems, contentItemsDeliveryId]);

  const loadContentBriefings = useCallback(async (deliveryId = activeDelivery?.id, options = {}) => {
    if (!deliveryId) {
      setContentBriefings([]);
      setContentBriefingsDeliveryId('');
      return [];
    }

    if (!options.force && contentBriefingsDeliveryId === deliveryId) {
      return contentBriefings;
    }

    try {
      const data = await fetchContentBriefingsByDelivery(deliveryId);
      setContentBriefings(data);
      setContentBriefingsDeliveryId(deliveryId);
      return data;
    } catch (error) {
      console.error('Erro ao carregar briefings de conteudo:', error);
      setFeedback('Nao foi possivel carregar as sugestoes do proximo mes.');
      return [];
    }
  }, [activeDelivery?.id, contentBriefings, contentBriefingsDeliveryId]);

  const loadContentHistory = useCallback(async (deliveryId = activeDelivery?.id, options = {}) => {
    if (!deliveryId) {
      setContentHistory([]);
      setContentMagicLinks([]);
      setContentHistoryDeliveryId('');
      return {
        history: [],
        magicLinks: [],
      };
    }

    if (!options.force && contentHistoryDeliveryId === deliveryId) {
      return {
        history: contentHistory,
        magicLinks: contentMagicLinks,
      };
    }

    try {
      const [history, magicLinks] = await Promise.all([
        fetchContentHistoryByDelivery(deliveryId),
        fetchContentMagicLinksByDelivery(deliveryId),
      ]);

      setContentHistory(history);
      setContentMagicLinks(magicLinks);
      setContentHistoryDeliveryId(deliveryId);

      return { history, magicLinks };
    } catch (error) {
      console.error('Erro ao carregar historico de conteudo:', error);
      setFeedback('Nao foi possivel carregar o historico desta entrega.');
      return {
        history: [],
        magicLinks: [],
      };
    }
  }, [activeDelivery?.id, contentHistory, contentHistoryDeliveryId, contentMagicLinks]);

  useEffect(() => {
    if (!activeDelivery?.id) {
      setContentBriefings([]);
      setContentHistory([]);
      setContentMagicLinks([]);
      setContentItems([]);
      setContentItemsDeliveryId('');
      setContentBriefingsDeliveryId('');
      setContentHistoryDeliveryId('');
      return;
    }

    loadContentItems(activeDelivery.id);
    loadContentBriefings(activeDelivery.id);
    loadContentHistory(activeDelivery.id);
  }, [activeDelivery?.id, loadContentBriefings, loadContentHistory, loadContentItems]);

  function openClientWorkspace(delivery) {
    setSelectedClient(delivery.cliente || { id: delivery.cliente_id, nome: getClientName(delivery) });
    setActiveDeliveryId(delivery.id);
    setContentItems([]);
    setContentBriefings([]);
    setContentHistory([]);
    setContentMagicLinks([]);
    setContentItemsDeliveryId('');
    setContentBriefingsDeliveryId('');
    setContentHistoryDeliveryId('');
    setWorkspaceTab('summary');
    setFocusedContentItemId('');
    setMagicLink(null);
    setFeedback('');
  }

  function openDeliveryContents(delivery) {
    if (!delivery?.id) return;

    setActiveDeliveryId(delivery.id);
    setWorkspaceTab('contents');
    setFocusedContentItemId('');
    setMagicLink(null);
    setFeedback('');
  }

  function openCreatePackageModal() {
    setEditingDelivery(null);
    setPackageModalOpen(true);
    setFeedback('');
  }

  function openCreateContentModal() {
    setEditingContentItem(null);
    setArticleModalOpen(true);
    setFeedback('');
  }

  function openEditContentModal(item) {
    setEditingContentItem(item);
    setArticleModalOpen(true);
    setFeedback('');
  }

  function openEditPackageModal(delivery) {
    setEditingDelivery(delivery);
    setPackageModalOpen(true);
    setFeedback('');
  }

  async function handleSavePackage(payload) {
    if (!selectedClient?.id) return;

    try {
      setSaving(true);

      const savedDelivery = editingDelivery?.id
        ? await updateContentDelivery(editingDelivery.id, payload)
        : await createContentDelivery(selectedClient, payload);

      await loadDeliveries();
      setActiveDeliveryId(savedDelivery.id);
      setPackageModalOpen(false);
      setEditingDelivery(null);
      setFeedback(editingDelivery?.id ? 'Entrega atualizada com sucesso.' : 'Entrega criada com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar entrega de conteudo:', error);
      setFeedback(error?.message || 'Nao foi possivel salvar a entrega.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePackage(delivery) {
    if (!delivery?.id) return;

    const confirmed = window.confirm('Tem certeza que deseja excluir esta entrega? Essa acao nao pode ser desfeita.');

    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteContentDelivery(delivery.id);

      const updatedDeliveries = await loadDeliveries();
      const remainingClientDeliveries = sortDeliveries(
        updatedDeliveries.filter((item) => item.cliente_id === delivery.cliente_id)
      );

      setActiveDeliveryId(remainingClientDeliveries[0]?.id || '');
      setPackageModalOpen(false);
      setEditingDelivery(null);
      setFeedback('Entrega excluida com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir entrega de conteudo:', error);
      setFeedback(error?.message || 'Nao foi possivel excluir a entrega.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveContentItem(payload) {
    if (!activeDelivery?.id) return;

    try {
      setSaving(true);

      const savedItem = editingContentItem?.id
        ? await updateContentItem(editingContentItem.id, payload)
        : await createContentItem(activeDelivery, payload);

      await loadContentItems(activeDelivery.id, { force: true });
      await loadDeliveries();
      setArticleModalOpen(false);
      setEditingContentItem(null);
      setFocusedContentItemId(savedItem?.id || '');
      setWorkspaceTab('contents');
      setFeedback(editingContentItem?.id ? 'Item atualizado com sucesso.' : 'Item criado com sucesso.');
      return savedItem;
    } catch (error) {
      console.error('Erro ao salvar conteudo:', error);
      setFeedback(error?.message || 'Nao foi possivel salvar o item.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContentItem(item) {
    if (!item?.id) return;

    const confirmed = window.confirm('Excluir este item da entrega? Essa acao nao pode ser desfeita.');

    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteContentItem(item.id);
      await loadContentItems(activeDelivery.id, { force: true });
      await loadDeliveries();
      setFeedback('Item excluido com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir conteudo:', error);
      setFeedback(error?.message || 'Nao foi possivel excluir o item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicateContentItem(item) {
    if (!item?.id) return;

    try {
      setSaving(true);
      const nextOrder = contentItems.length + 1;

      const duplicatedItem = await duplicateContentItem(item, nextOrder);
      await loadContentItems(activeDelivery.id, { force: true });
      await loadDeliveries();
      setFocusedContentItemId(duplicatedItem?.id || '');
      setWorkspaceTab('contents');
      setFeedback('Item duplicado com sucesso.');
    } catch (error) {
      console.error('Erro ao duplicar conteudo:', error);
      setFeedback(error?.message || 'Nao foi possivel duplicar o item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveContentItem(item, direction) {
    const orderedItems = [...contentItems].sort((first, second) => Number(first.ordem || 0) - Number(second.ordem || 0));
    const currentIndex = orderedItems.findIndex((current) => current.id === item.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedItems.length) return;

    const reorderedItems = [...orderedItems];
    const [movedItem] = reorderedItems.splice(currentIndex, 1);
    reorderedItems.splice(targetIndex, 0, movedItem);

    try {
      setSaving(true);
      await updateContentItemsOrder(reorderedItems);
      await loadContentItems(activeDelivery.id, { force: true });
      await loadDeliveries();
      setFocusedContentItemId(item.id);
      setFeedback('Ordem da entrega atualizada.');
    } catch (error) {
      console.error('Erro ao reordenar conteudos:', error);
      setFeedback(error?.message || 'Nao foi possivel reordenar os itens.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateReviewLink() {
    if (!activeDelivery?.id) return;

    try {
      setSaving(true);
      setFeedback('');

      const link = await createContentMagicReviewLink(activeDelivery);

      setMagicLink(link);
      await loadContentHistory(activeDelivery.id, { force: true });
      setFeedback('Link de revisao gerado com sucesso.');
    } catch (error) {
      console.error('Erro ao gerar link de revisao:', error);
      setFeedback(error?.message || 'Nao foi possivel gerar o link de revisao.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyReviewLink() {
    if (!magicLink?.url) return;

    try {
      await window.navigator.clipboard.writeText(magicLink.url);
      setFeedback('Link copiado para a area de transferencia.');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      setFeedback('Nao foi possivel copiar automaticamente. Selecione e copie o link exibido.');
    }
  }

  async function handleSaveStrategy(payload) {
    if (!activeDelivery?.id) return;

    try {
      setSaving(true);

      await updateContentEditorialStrategy(activeDelivery.id, payload);
      await loadDeliveries();
      setFeedback('Estrategia editorial salva com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao salvar estrategia editorial:', error);
      setFeedback(error?.message || 'Nao foi possivel salvar a estrategia editorial.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (selectedClient) {
    return (
      <>
        <ContentClientWorkspace
          client={selectedClient}
          deliveries={selectedClientDeliveries}
          activeDelivery={activeDelivery}
          feedback={feedback}
          onBack={() => {
            setSelectedClient(null);
            setActiveDeliveryId('');
            setFeedback('');
          }}
          onCreateDelivery={openCreatePackageModal}
          onOpenDelivery={openDeliveryContents}
          onEditDelivery={openEditPackageModal}
          onDeleteDelivery={handleDeletePackage}
          saving={saving}
          onSaveStrategy={handleSaveStrategy}
          contentItems={contentItems}
          contentBriefings={contentBriefings}
          contentHistory={contentHistory}
          contentMagicLinks={contentMagicLinks}
          contentItemsLoading={contentItemsLoading}
          workspaceTab={workspaceTab}
          onChangeWorkspaceTab={setWorkspaceTab}
          onManageContents={() => {
            setWorkspaceTab('contents');
            setFeedback('');
          }}
          onCreateContent={openCreateContentModal}
          onEditContent={openEditContentModal}
          onDeleteContent={handleDeleteContentItem}
          onDuplicateContent={handleDuplicateContentItem}
          onMoveContent={handleMoveContentItem}
          magicLink={magicLink}
          onGenerateReviewLink={handleGenerateReviewLink}
          onCopyReviewLink={handleCopyReviewLink}
        />

        <ContentPackageModal
          client={selectedClient}
          delivery={editingDelivery}
          open={packageModalOpen}
          saving={saving}
          onClose={() => {
            setPackageModalOpen(false);
            setEditingDelivery(null);
          }}
          onSave={handleSavePackage}
          onDelete={handleDeletePackage}
        />

        <ContentArticleEditorModal
          open={articleModalOpen}
          item={editingContentItem}
          nextOrder={contentItems.length + 1}
          saving={saving}
          onClose={() => {
            setArticleModalOpen(false);
            setEditingContentItem(null);
          }}
          onSave={handleSaveContentItem}
        />
      </>
    );
  }

  return (
    <section className="content-page">
      <div className="content-summary-grid" aria-label="Resumo da Central de Conteudo">
        <SummaryCard
          icon={CalendarDays}
          label="Entregas do mes"
          value={summary.monthDeliveries}
          helper={formatMonthReferenceLabel(currentMonth)}
          actionLabel="Ver entregas"
          active={dashboardView === 'month'}
          onClick={() => setDashboardView('month')}
        />
        <SummaryCard
          icon={Users}
          label="Clientes ativos"
          value={summary.activeClients}
          helper="Com central ativa"
          actionLabel="Ver clientes"
          active={dashboardView === 'active'}
          onClick={() => setDashboardView('active')}
        />
        <SummaryCard
          icon={FileText}
          label="Itens cadastrados"
          value={summary.totalContents}
          helper="Conteudos da carteira"
          actionLabel="Ver carteira"
          onClick={() => setDashboardView('active')}
        />
        <SummaryCard
          icon={Clock3}
          label="Aguardando cliente"
          value={summary.pendingReview}
          helper="Pendentes de retorno"
          actionLabel="Ver entregas"
          onClick={() => setDashboardView('month')}
        />
      </div>

      <ReviewAlertsPanel
        readyDeliveries={readyToPublishDeliveries}
        revisionDeliveries={revisionRequestedDeliveries}
        onOpenDelivery={openClientWorkspace}
      />

      <article className="content-panel">
        <div className="content-panel__toolbar">
          <div>
            <span className="content-kicker">Carteira de conteudo</span>
            <h2>{dashboardView === 'month' ? 'Clientes com entrega do mes' : 'Clientes ativos'}</h2>
            <p>
              {filteredClientRows.length} de {dashboardRows.length} cliente(s) exibido(s)
              {dashboardView === 'month' ? ` em ${formatMonthReferenceLabel(currentMonth)}` : ''}
            </p>
          </div>

          <label className="content-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar cliente ou empresa..."
            />
          </label>
        </div>

        <div className="content-dashboard-tabs" aria-label="Visualizacao da carteira de conteudo">
          <button
            type="button"
            className={dashboardView === 'month' ? 'is-active' : ''}
            onClick={() => setDashboardView('month')}
          >
            <CalendarDays size={16} aria-hidden="true" />
            Entregas do mes
            <span>{monthClientRows.length}</span>
          </button>
          <button
            type="button"
            className={dashboardView === 'active' ? 'is-active' : ''}
            onClick={() => setDashboardView('active')}
          >
            <Users size={16} aria-hidden="true" />
            Clientes ativos
            <span>{clientRows.length}</span>
          </button>
        </div>

        {feedback && <div className="content-feedback content-feedback--danger">{feedback}</div>}

        {loading ? (
          <ContentEmptyState title="Carregando entregas..." description="Buscando pacotes e revisoes dos clientes." compact />
        ) : filteredClientRows.length ? (
          <div className="content-table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Entrega atual</th>
                  <th>Conteudos</th>
                  <th>Revisados</th>
                  <th>Status</th>
                  <th>Ultima atualizacao</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientRows.map((row) => (
                  <tr key={row.clientId}>
                    <td>
                      <ClientCell delivery={row.delivery} />
                    </td>
                    <td>
                      <strong>{row.delivery.titulo || 'Entrega sem titulo'}</strong>
                      <small>{formatMonthReferenceLabel(row.delivery.mes_referencia)}</small>
                    </td>
                    <td>{Number(row.delivery.conteudos_total || 0)}</td>
                    <td>{Number(row.delivery.revisados_total || 0)}</td>
                    <td>
                      <StatusBadge status={row.delivery.workflow_status} label={getContentDeliveryWorkflowStatus(row.delivery)} />
                    </td>
                    <td>{formatDateTime(row.delivery.atualizado_em || row.delivery.criado_em)}</td>
                    <td>
                      <button
                        type="button"
                        className="content-action-button"
                        onClick={() => openClientWorkspace(row.delivery)}
                      >
                        <FolderOpen size={16} aria-hidden="true" />
                        Abrir cliente
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ContentEmptyState
            title={dashboardView === 'month' ? 'Nenhuma entrega para este mes' : 'Nenhum cliente com Conteudo ativo'}
            description={
              dashboardView === 'month'
                ? 'Crie uma entrega mensal para os clientes que terao conteudos revisados neste periodo.'
                : 'Ative o modulo na ficha do cliente para acompanhar entregas, revisoes e aprovacoes aqui.'
            }
          />
        )}
      </article>
    </section>
  );
}

function ContentClientWorkspace({
  client,
  deliveries,
  activeDelivery,
  feedback,
  onBack,
  onCreateDelivery,
  onOpenDelivery,
  onEditDelivery,
  onDeleteDelivery,
  saving,
  onSaveStrategy,
  contentItems,
  contentBriefings,
  contentHistory,
  contentMagicLinks,
  contentItemsLoading,
  workspaceTab,
  onChangeWorkspaceTab,
  onManageContents,
  onCreateContent,
  onEditContent,
  onDeleteContent,
  onDuplicateContent,
  onMoveContent,
  magicLink,
  onGenerateReviewLink,
  onCopyReviewLink,
}) {
  const clientName = client?.nome || client?.empresa || 'Cliente sem nome';
  const activeReviewSummary = getInternalReviewStats(contentItems, activeDelivery);

  return (
    <section className="content-page">
      <header className="content-page__header content-page__header--workspace">
        <button type="button" className="content-back-button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar
        </button>

        <div>
          <h1>{clientName}</h1>
          <p>{activeDelivery?.titulo || 'Entregas e revisoes do cliente'}</p>
        </div>

        <button type="button" className="content-primary-button" onClick={onCreateDelivery}>
          <Plus size={16} aria-hidden="true" />
          Nova entrega
        </button>
      </header>

      {feedback && <div className="content-feedback">{feedback}</div>}

      {activeDelivery?.revisao_concluida_em && (
        <article className={`content-review-finished-banner content-review-finished-banner--${getContentDeliveryWorkflowKey(activeDelivery)}`}>
          <div>
            <span className="content-kicker">Revisao concluida</span>
            <h2>{getContentDeliveryWorkflowStatus(activeDelivery)}</h2>
            <p>
              Finalizada em {formatDateTime(activeDelivery.revisao_concluida_em)}.
              Acao recomendada: {getNextStepLabel(activeDelivery)}.
            </p>
          </div>

          <dl className="content-review-finished-banner__stats" aria-label="Resumo da revisao finalizada">
            <div>
              <dt>Conteudos</dt>
              <dd>{activeReviewSummary.total}</dd>
            </div>
            <div>
              <dt>Aprovados</dt>
              <dd>{activeReviewSummary.approved}</dd>
            </div>
            <div>
              <dt>Ajustes</dt>
              <dd>{activeReviewSummary.revisions}</dd>
            </div>
          </dl>
        </article>
      )}

      <DeliverySelector
        deliveries={deliveries}
        activeDelivery={activeDelivery}
        onOpenDelivery={onOpenDelivery}
        onCreateDelivery={onCreateDelivery}
        onEditDelivery={onEditDelivery}
        onDeleteDelivery={onDeleteDelivery}
      />

      <nav className="content-workspace-tabs" aria-label="Navegacao da entrega">
        <button
          type="button"
          className={workspaceTab === 'summary' ? 'is-active' : ''}
          onClick={() => onChangeWorkspaceTab('summary')}
        >
          <CalendarDays size={16} aria-hidden="true" />
          Resumo
        </button>
        <button
          type="button"
          className={workspaceTab === 'strategy' ? 'is-active' : ''}
          onClick={() => onChangeWorkspaceTab('strategy')}
        >
          <Edit3 size={16} aria-hidden="true" />
          Estrategia
        </button>
        <button
          type="button"
          className={workspaceTab === 'contents' ? 'is-active' : ''}
          onClick={() => {
            onChangeWorkspaceTab('contents');
            onManageContents();
          }}
        >
          <FileText size={16} aria-hidden="true" />
          Itens
        </button>
        <button
          type="button"
          className={workspaceTab === 'review' ? 'is-active' : ''}
          onClick={() => onChangeWorkspaceTab('review')}
        >
          <Link size={16} aria-hidden="true" />
          Link de revisao
        </button>
        <button
          type="button"
          className={workspaceTab === 'history' ? 'is-active' : ''}
          onClick={() => onChangeWorkspaceTab('history')}
        >
          <History size={16} aria-hidden="true" />
          Historico
        </button>
      </nav>

      {workspaceTab === 'summary' && (
        <DeliverySummaryPanel
          activeDelivery={activeDelivery}
          contentItems={contentItems}
          contentMagicLinks={contentMagicLinks}
          saving={saving}
          onCreateDelivery={onCreateDelivery}
          onChangeWorkspaceTab={onChangeWorkspaceTab}
          onManageContents={onManageContents}
          onGenerateReviewLink={onGenerateReviewLink}
        />
      )}

      {workspaceTab === 'strategy' && (
        <EditorialStrategyPanel
          client={client}
          delivery={activeDelivery}
          saving={saving}
          onSave={onSaveStrategy}
          onManageContents={onManageContents}
        />
      )}

      {workspaceTab === 'review' && activeDelivery && (
        <>
          <ReviewLinkPanel
            magicLink={magicLink}
            existingLinks={contentMagicLinks}
            saving={saving}
            onGenerate={onGenerateReviewLink}
            onCopy={onCopyReviewLink}
          />

          {contentBriefings?.length > 0 && (
            <NextMonthSuggestionsPanel
              delivery={activeDelivery}
              briefings={contentBriefings}
            />
          )}
        </>
      )}

      {workspaceTab === 'history' && activeDelivery && (
        <ContentHistoryPanel
          client={client}
          delivery={activeDelivery}
          items={contentItems}
          comments={collectContentComments(contentItems)}
          history={contentHistory}
          briefings={contentBriefings}
          magicLinks={contentMagicLinks}
        />
      )}

      {workspaceTab === 'contents' && activeDelivery && (
        <ContentArticlesPanel
          delivery={activeDelivery}
          items={contentItems}
          loading={contentItemsLoading}
          focusItemId={focusedContentItemId}
          onCreate={onCreateContent}
          onEdit={onEditContent}
          onDelete={onDeleteContent}
          onDuplicate={onDuplicateContent}
          onMove={onMoveContent}
        />
      )}
    </section>
  );
}

function DeliverySummaryPanel({
  activeDelivery,
  contentItems,
  contentMagicLinks,
  saving,
  onCreateDelivery,
  onChangeWorkspaceTab,
  onManageContents,
  onGenerateReviewLink,
}) {
  if (!activeDelivery) {
    return (
      <article className="content-panel">
        <ContentEmptyState
          title="Nenhuma entrega mensal criada"
          description="Crie um pacote para reunir estrategia, itens e aprovacao do cliente."
          action={
            <button type="button" className="content-primary-button" onClick={onCreateDelivery}>
              <Plus size={16} aria-hidden="true" />
              Criar entrega
            </button>
          }
        />
      </article>
    );
  }

  const approved = contentItems.filter((item) => item.status === 'aprovado' || item.status === 'publicado').length;
  const revisions = contentItems.filter((item) => item.status === 'revisar').length;
  const reviewed = contentItems.filter((item) => ['aprovado', 'revisar', 'publicado'].includes(item.status)).length;
  const nextAction = getDeliveryNextAction({
    delivery: activeDelivery,
    items: contentItems,
    links: contentMagicLinks,
    onChangeWorkspaceTab,
    onManageContents,
    onGenerateReviewLink,
  });

  return (
    <>
      <article className="content-panel content-delivery-overview">
        <div className="content-panel__toolbar">
          <div>
            <span className="content-kicker">Resumo da entrega</span>
            <h2>{activeDelivery.titulo || 'Entrega sem titulo'}</h2>
            <p>{formatMonthReferenceLabel(activeDelivery.mes_referencia)} - {getContentDeliveryWorkflowStatus(activeDelivery)}</p>
          </div>

          <StatusBadge status={activeDelivery.workflow_status} label={getContentDeliveryWorkflowStatus(activeDelivery)} />
        </div>

        <div className="content-delivery-overview__grid">
          <SummaryCard icon={FileText} label="Itens" value={contentItems.length || Number(activeDelivery.conteudos_total || 0)} helper="No pacote" />
          <SummaryCard icon={Clock3} label="Revisados" value={reviewed || Number(activeDelivery.revisados_total || 0)} helper="Com retorno" />
          <SummaryCard icon={Users} label="Aprovados" value={approved || Number(activeDelivery.aprovados_total || 0)} helper="Prontos para uso" />
          <SummaryCard icon={CalendarDays} label="Ajustes" value={revisions || Number(activeDelivery.ajustes_total || 0)} helper="Pedem revisao" />
        </div>

        <div className="content-delivery-next-action">
          <div>
            <span className="content-kicker">Proximo passo</span>
            <strong>{nextAction.title}</strong>
            <p>{nextAction.description}</p>
          </div>

          <button
            type="button"
            className="content-primary-button"
            onClick={nextAction.onClick}
            disabled={saving || nextAction.disabled}
          >
            {saving ? 'Aguarde...' : nextAction.actionLabel}
          </button>
        </div>
      </article>

    </>
  );
}

function DeliverySelector({
  deliveries,
  activeDelivery,
  onOpenDelivery,
  onCreateDelivery,
  onEditDelivery,
  onDeleteDelivery,
}) {
  if (!deliveries.length) return null;

  return (
    <article className="content-delivery-selector" aria-label="Selecionar entrega mensal">
      <div>
        <span className="content-kicker">Pacote ativo</span>
        <label>
          <select
            value={activeDelivery?.id || ''}
            onChange={(event) => {
              const selectedDelivery = deliveries.find((delivery) => delivery.id === event.target.value);
              if (selectedDelivery) onOpenDelivery(selectedDelivery);
            }}
          >
            {deliveries.map((delivery) => (
              <option key={delivery.id} value={delivery.id}>
                {formatMonthReferenceLabel(delivery.mes_referencia)} - {delivery.titulo || 'Entrega sem titulo'}
              </option>
            ))}
          </select>
        </label>
        <small>{deliveries.length} pacote(s) mensal(is) cadastrado(s)</small>
      </div>

      <div className="content-delivery-selector__actions">
        <button type="button" className="content-action-button" onClick={() => onEditDelivery(activeDelivery)} disabled={!activeDelivery}>
          <Edit3 size={16} aria-hidden="true" />
          Editar
        </button>
        <button type="button" className="content-icon-button content-icon-button--danger" onClick={() => onDeleteDelivery(activeDelivery)} disabled={!activeDelivery} aria-label="Excluir entrega ativa">
          <Trash2 size={16} aria-hidden="true" />
        </button>
        <button type="button" className="content-primary-button" onClick={onCreateDelivery}>
          <Plus size={16} aria-hidden="true" />
          Novo pacote
        </button>
      </div>
    </article>
  );
}

function NextMonthSuggestionsPanel({ delivery, briefings }) {
  return (
    <article className="content-panel content-next-suggestions">
      <div className="content-panel__toolbar">
        <div>
          <span className="content-kicker">Proximo planejamento</span>
          <h2>Sugestoes para o proximo mes</h2>
          <p>{delivery?.titulo || 'Entrega relacionada'}</p>
        </div>
      </div>

      {briefings?.length ? (
        <div className="content-next-suggestions__grid">
          {briefings.map((briefing) => (
            <section key={briefing.id} className="content-next-suggestions__card">
              <header>
                <span>Enviado em {formatDateTime(briefing.enviado_em || briefing.criado_em)}</span>
                <strong>{delivery?.titulo || 'Entrega relacionada'}</strong>
              </header>

              <SuggestionItem
                label="Servico, produto ou procedimento"
                value={briefing.servico_produto_destaque}
              />
              <SuggestionItem
                label="Campanha, evento ou data"
                value={briefing.campanha_evento_data}
              />
              <SuggestionItem
                label="Perguntas frequentes"
                value={briefing.perguntas_frequentes_clientes}
              />
              <SuggestionItem
                label="Observacoes para equipe"
                value={briefing.observacoes_equipe}
              />
            </section>
          ))}
        </div>
      ) : (
        <ContentEmptyState
          title="Sem sugestoes para o proximo mes"
          description="Quando o cliente responder o briefing opcional, as respostas ficarao aqui."
          compact
        />
      )}
    </article>
  );
}

function SuggestionItem({ label, value }) {
  return (
    <div className="content-next-suggestions__item">
      <span>{label}</span>
      <p>{value || 'Nao informado.'}</p>
    </div>
  );
}

function ReviewLinkPanel({ magicLink, existingLinks = [], saving, onGenerate, onCopy }) {
  const existingActiveLink = existingLinks.find((link) => link.ativo !== false);
  const hasVisibleLink = Boolean(magicLink?.url);
  const hasStoredLink = Boolean(existingActiveLink && !hasVisibleLink);
  const buttonLabel = hasStoredLink ? 'Gerar novo link' : 'Gerar link';

  return (
    <article className="content-review-link-panel">
      <div>
        <span className="content-kicker">Link publico</span>
        <h2>Link de revisao</h2>
        <p>Envie um acesso seguro para o cliente revisar o pacote sem entrar no CRM.</p>
      </div>

      <div className="content-review-link-panel__actions">
        <button type="button" className="content-primary-button" onClick={onGenerate} disabled={saving}>
          <Link size={16} aria-hidden="true" />
          {saving ? 'Gerando...' : buttonLabel}
        </button>

        {hasVisibleLink && (
          <button type="button" className="content-action-button" onClick={onCopy}>
            <Copy size={16} aria-hidden="true" />
            Copiar link
          </button>
        )}
      </div>

      {hasVisibleLink && (
        <div className="content-review-link-panel__url">
          <strong>{magicLink.url}</strong>
          <span>Expira em {formatDateTime(magicLink.expiresAt)}</span>
        </div>
      )}

      {hasStoredLink && (
        <div className="content-review-link-panel__url content-review-link-panel__url--notice">
          <strong>Esta entrega ja possui um link ativo.</strong>
          <span>Por seguranca, o link completo aparece apenas no momento da criacao. Gere um novo link se precisar copiar novamente.</span>
          <span>Expira em {formatDateTime(existingActiveLink.expira_em)}</span>
        </div>
      )}
    </article>
  );
}

function SummaryCard({ icon: Icon, label, value, helper, actionLabel = 'Abrir', active = false, onClick }) {
  const Component = onClick ? 'button' : 'article';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      className={`content-summary-card${onClick ? ' is-clickable' : ''}${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
        {onClick && <em>{actionLabel}</em>}
      </div>
      <div className="content-summary-card__icon">
        <Icon size={20} aria-hidden="true" />
      </div>
    </Component>
  );
}

function ReviewAlertsPanel({ readyDeliveries, revisionDeliveries, onOpenDelivery }) {
  if (!readyDeliveries.length && !revisionDeliveries.length) {
    return (
      <article className="content-review-alerts content-review-alerts--empty">
        <div>
          <span className="content-kicker">Avisos da Central</span>
          <h2>Nenhuma acao urgente.</h2>
          <p>Pacotes finalizados aparecerao aqui quando estiverem prontos para publicar ou exigirem ajustes.</p>
        </div>
      </article>
    );
  }

  return (
    <section className="content-review-alerts-grid" aria-label="Avisos de revisao de conteudo">
      <ReviewAlertColumn
        tone="ready"
        title="Prontos para publicar"
        description="O cliente aprovou todos os itens do pacote."
        items={readyDeliveries}
        emptyText="Nenhum pacote pronto para publicar."
        nextStep="Publicar itens"
        onOpenDelivery={onOpenDelivery}
      />
      <ReviewAlertColumn
        tone="revision"
        title="Ajustes solicitados"
        description="O cliente pediu alteracao em um ou mais itens."
        items={revisionDeliveries}
        emptyText="Nenhum ajuste pendente."
        nextStep="Revisar itens"
        onOpenDelivery={onOpenDelivery}
      />
    </section>
  );
}

function ReviewAlertColumn({ tone = 'ready', title, description, items, emptyText, nextStep, onOpenDelivery }) {
  return (
    <article className={`content-review-alerts content-review-alerts--${tone}`}>
      <header>
        <div>
          <span className="content-kicker">Aviso rapido</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <strong>{items.length}</strong>
      </header>

      {items.length ? (
        <div className="content-review-alerts__list">
          {items.slice(0, 5).map((delivery) => (
            <button key={delivery.id} type="button" onClick={() => onOpenDelivery(delivery)}>
              <span>{getClientName(delivery)}</span>
              <strong>{delivery.titulo || 'Entrega sem titulo'}</strong>
              <small>{formatMonthReferenceLabel(delivery.mes_referencia)} - {formatDateTime(delivery.revisao_concluida_em)}</small>
              <em>{nextStep}</em>
            </button>
          ))}
        </div>
      ) : (
        <p className="content-review-alerts__empty">{emptyText}</p>
      )}
    </article>
  );
}

function ClientCell({ delivery }) {
  const clientName = getClientName(delivery);
  const companyName = delivery.cliente?.empresa || 'Carteira de cliente';

  return (
    <div className="content-client-cell">
      <span>{getInitials(clientName)}</span>
      <div>
        <strong>{clientName}</strong>
        <small>{companyName}</small>
      </div>
    </div>
  );
}

function StatusBadge({ status, label }) {
  return (
    <span className={`content-status content-status--${status || 'default'}`}>
      {label || getContentDeliveryStatusLabel(status)}
    </span>
  );
}

function ContentEmptyState({ title, description, action, compact = false }) {
  return (
    <div className={`content-empty-state${compact ? ' content-empty-state--compact' : ''}`}>
      <FileText size={24} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{description}</span>
      {action && <div className="content-empty-state__action">{action}</div>}
    </div>
  );
}

function buildClientRows(items) {
  const rowsByClient = new Map();

  sortDeliveries(items).forEach((delivery) => {
    if (!delivery.cliente_id || rowsByClient.has(delivery.cliente_id)) return;

    rowsByClient.set(delivery.cliente_id, {
      clientId: delivery.cliente_id,
      delivery,
    });
  });

  return Array.from(rowsByClient.values());
}

function collectContentComments(items) {
  return items.flatMap((item) => (
    (item.comentarios || []).map((comment) => ({
      ...comment,
      item_titulo: item.titulo,
    }))
  ));
}

function sortDeliveries(items) {
  return [...items].sort((first, second) => {
    const firstMonth = String(first.mes_referencia || '');
    const secondMonth = String(second.mes_referencia || '');

    if (firstMonth !== secondMonth) {
      return secondMonth.localeCompare(firstMonth);
    }

    return new Date(second.atualizado_em || second.criado_em || 0) - new Date(first.atualizado_em || first.criado_em || 0);
  });
}

function getClientName(delivery) {
  const client = delivery.cliente || {};
  return client.nome || client.empresa || 'Cliente sem nome';
}

function getNextStepLabel(delivery) {
  const workflowStatus = getContentDeliveryWorkflowKey(delivery);

  if (workflowStatus === 'ajustes_solicitados') return 'Aplicar ajustes';
  if (workflowStatus === 'pronto_publicar') return 'Publicar itens';

  return 'Acompanhar entrega';
}

function getInternalReviewStats(items = [], delivery = {}) {
  const approved = items.filter((item) => item.status === 'aprovado' || item.status === 'publicado').length;
  const revisions = items.filter((item) => item.status === 'revisar').length;
  const reviewed = items.filter((item) => ['aprovado', 'revisar', 'publicado'].includes(item.status)).length;
  const total = items.length || Number(delivery?.conteudos_total || 0);

  return {
    total,
    reviewed: reviewed || Number(delivery?.revisados_total || 0),
    approved: approved || Number(delivery?.aprovados_total || 0),
    revisions: revisions || Number(delivery?.ajustes_total || 0),
  };
}

function getDeliveryNextAction({
  delivery,
  items = [],
  links = [],
  onChangeWorkspaceTab,
  onManageContents,
  onGenerateReviewLink,
}) {
  const hasStrategy = hasDeliveryStrategy(delivery);
  const activeLinks = links.filter((link) => link.ativo !== false);
  const workflowStatus = getContentDeliveryWorkflowKey(delivery);

  if (!hasStrategy) {
    return {
      title: 'Definir estrategia',
      description: 'Registre objetivo, publico, tom e prioridades antes de criar os itens.',
      actionLabel: 'Abrir estrategia',
      onClick: () => onChangeWorkspaceTab('strategy'),
    };
  }

  if (!items.length) {
    return {
      title: 'Cadastrar itens do pacote',
      description: 'A estrategia esta pronta. Agora adicione os textos que o cliente vai revisar.',
      actionLabel: 'Gerenciar itens',
      onClick: onManageContents,
    };
  }

  if (workflowStatus === 'ajustes_solicitados') {
    return {
      title: 'Aplicar ajustes solicitados',
      description: 'O cliente pediu alteracoes. Abra os itens, leia os comentarios e atualize os textos.',
      actionLabel: 'Ver ajustes',
      onClick: onManageContents,
    };
  }

  if (workflowStatus === 'pronto_publicar') {
    return {
      title: 'Publicar itens aprovados',
      description: 'A revisao foi concluida e o pacote esta liberado para publicacao ou entrega final.',
      actionLabel: 'Abrir itens',
      onClick: onManageContents,
    };
  }

  if (!activeLinks.length) {
    return {
      title: 'Enviar revisao ao cliente',
      description: 'Os itens ja foram cadastrados. Gere o link para o cliente revisar sem login.',
      actionLabel: 'Gerar link',
      onClick: onGenerateReviewLink,
    };
  }

  return {
    title: 'Acompanhar revisao do cliente',
    description: 'O link ja foi criado. Acompanhe acessos, comentarios e progresso do cliente.',
    actionLabel: 'Ver revisao',
    onClick: () => onChangeWorkspaceTab('review'),
  };
}

function hasDeliveryStrategy(delivery) {
  return [
    delivery?.objetivo_estrategia,
    delivery?.publico_alvo,
    delivery?.tom_comunicacao,
    delivery?.palavras_chave,
    delivery?.servicos_priorizados,
    delivery?.objetivos_seo,
  ].some((value) => String(value || '').trim());
}

function getInitials(value) {
  const words = String(value || 'C')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return (words.map((word) => word[0]).join('') || 'C').toUpperCase();
}

function formatDateTime(value) {
  if (!value) return 'Nao informado';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
