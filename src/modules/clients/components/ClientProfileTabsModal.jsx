import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { getLeadInitials, getWhatsAppLink } from '../../leads/utils/leadHelpers.js';
import { fetchClientTasks } from '../../tasks/services/tasksService.js';
import {
  activateInstagramProfileForClient,
  deactivateInstagramProfile,
  fetchActiveInstagramProfileByClient,
  updateInstagramProfile,
} from '../../instagram/services/instagramService.js';
import {
  activateContentDeliveryForClient,
  fetchContentDeliveryByClient,
  formatMonthReferenceLabel as formatContentMonthReferenceLabel,
} from '../../content/services/contentService.js';
import './client-profile-tabs.css';

const CLIENT_STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'implantacao', label: 'Implantacao' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'encerrado', label: 'Encerrado' },
];

const CLIENT_LINK_FIELDS = [
  { key: 'documento_url', label: 'Apoio' },
  { key: 'briefing_url', label: 'Briefing' },
  { key: 'estrategia_url', label: 'Estrategia' },
  { key: 'contrato_url', label: 'Contrato' },
  { key: 'financeiro_url', label: 'Financeiro' },
  { key: 'conteudos_url', label: 'Conteudos' },
  { key: 'tarefas_url', label: 'Tarefas' },
  { key: 'relatorios_url', label: 'Relatorios' },
  { key: 'acessos_url', label: 'Acessos' },
  { key: 'drive_url', label: 'Drive' },
  { key: 'historico_url', label: 'Historico' },
];

export function ClientProfileTabsModal({
  client,
  saving,
  feedback,
  canSeeFinancials,
  canManageClients,
  initialTab = 'resumo',
  onChange,
  onSave,
  onArchive,
  onDelete,
  onNavigate,
  onClose,
}) {
  const initialVisibleTab = initialTab === 'financeiro' && !canSeeFinancials ? 'resumo' : initialTab;
  const [activeTab, setActiveTab] = useState(initialVisibleTab);
  const [activeLinkField, setActiveLinkField] = useState(null);
  const [linkDraft, setLinkDraft] = useState('');
  const [clientTasks, setClientTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [instagramProfile, setInstagramProfile] = useState(null);
  const [instagramDraft, setInstagramDraft] = useState(createInstagramDraft());
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const [savingInstagram, setSavingInstagram] = useState(false);
  const [instagramFeedback, setInstagramFeedback] = useState('');
  const [contentDelivery, setContentDelivery] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [contentFeedback, setContentFeedback] = useState('');

  const telefoneLead = client.whatsapp || client.telefone || '';
  const whatsappLink = getWhatsAppLink(telefoneLead);
  const documents = useMemo(() => {
    return CLIENT_LINK_FIELDS.map((field) => ({
      ...field,
      value: client[field.key] || '',
    }));
  }, [client]);
  const documentsCount = documents.filter((doc) => doc.value).length;
  const deliverySummary = useMemo(() => getDeliverySummary(clientTasks), [clientTasks]);

  const visibleTabs = [
    { id: 'resumo', label: 'Resumo', icon: UserRound },
    { id: 'contato', label: 'Contato', icon: Phone },
    { id: 'contrato', label: 'Contrato', icon: CalendarClock },
    { id: 'entregas', label: 'Entregas', icon: ClipboardCheck },
    { id: 'conteudo', label: 'Conteudo', icon: FileText },
    { id: 'instagram', label: 'Instagram', icon: Camera },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    ...(canSeeFinancials ? [{ id: 'financeiro', label: 'Financeiro', icon: CreditCard }] : []),
  ];

  useEffect(() => {
    let ignore = false;

    async function loadClientTasks() {
      if (!client?.id || client.isNewClient) {
        setClientTasks([]);
        return;
      }

      try {
        setLoadingTasks(true);
        const data = await fetchClientTasks(client.id);

        if (!ignore) {
          setClientTasks(data);
        }
      } catch (error) {
        console.error('Erro ao carregar tarefas do cliente:', error);

        if (!ignore) {
          setClientTasks([]);
        }
      } finally {
        if (!ignore) {
          setLoadingTasks(false);
        }
      }
    }

    loadClientTasks();

    return () => {
      ignore = true;
    };
  }, [client?.id, client?.isNewClient]);

  useEffect(() => {
    let ignore = false;

    async function loadContentDelivery() {
      if (!client?.id || client.isNewClient) {
        setContentDelivery(null);
        setContentFeedback('');
        return;
      }

      try {
        setLoadingContent(true);
        setContentFeedback('');
        const delivery = await fetchContentDeliveryByClient(client.id);

        if (!ignore) {
          setContentDelivery(delivery);
        }
      } catch (error) {
        console.error('Erro ao carregar Central de Conteudo:', error);

        if (!ignore) {
          setContentDelivery(null);
          setContentFeedback('Nao foi possivel carregar a Central de Conteudo deste cliente.');
        }
      } finally {
        if (!ignore) {
          setLoadingContent(false);
        }
      }
    }

    loadContentDelivery();

    return () => {
      ignore = true;
    };
  }, [client?.id, client?.isNewClient]);

  useEffect(() => {
    let ignore = false;

    async function loadInstagramProfile() {
      if (!client?.id || client.isNewClient) {
        setInstagramProfile(null);
        setInstagramDraft(createInstagramDraft());
        setInstagramFeedback('');
        return;
      }

      try {
        setLoadingInstagram(true);
        setInstagramFeedback('');
        const profile = await fetchActiveInstagramProfileByClient(client.id);

        if (!ignore) {
          setInstagramProfile(profile);
          setInstagramDraft(createInstagramDraft(profile));
        }
      } catch (error) {
        console.error('Erro ao carregar perfil Instagram:', error);

        if (!ignore) {
          setInstagramProfile(null);
          setInstagramDraft(createInstagramDraft());
          setInstagramFeedback('Nao foi possivel carregar o Instagram deste cliente.');
        }
      } finally {
        if (!ignore) {
          setLoadingInstagram(false);
        }
      }
    }

    loadInstagramProfile();

    return () => {
      ignore = true;
    };
  }, [client?.id, client?.isNewClient]);

  function handleOpenLinkEditor(field) {
    setActiveLinkField(field);
    setLinkDraft(client[field.key] || '');
  }

  function handleCloseLinkEditor() {
    setActiveLinkField(null);
    setLinkDraft('');
  }

  function handleSaveLinkField() {
    if (!activeLinkField) return;

    onChange(activeLinkField.key, linkDraft.trim());
    handleCloseLinkEditor();
  }

  function handleClearLinkField() {
    if (!activeLinkField) return;

    onChange(activeLinkField.key, '');
    handleCloseLinkEditor();
  }

  function handleChangeInstagramDraft(field, value) {
    setInstagramFeedback('');
    setInstagramDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleActivateInstagram() {
    if (!canManageClients || !client?.id || client.isNewClient) return;

    try {
      setSavingInstagram(true);
      setInstagramFeedback('');
      const profile = await activateInstagramProfileForClient(client, client.responsavel_cliente || client.responsavel || '');
      setInstagramProfile(profile);
      setInstagramDraft(createInstagramDraft(profile));
      setInstagramFeedback('Instagram ativado para este cliente.');
    } catch (error) {
      console.error('Erro ao ativar Instagram:', error);
      setInstagramFeedback(error?.message || 'Nao foi possivel ativar o Instagram.');
    } finally {
      setSavingInstagram(false);
    }
  }

  async function handleSaveInstagramProfile() {
    if (!canManageClients || !instagramProfile?.id) return;

    try {
      setSavingInstagram(true);
      setInstagramFeedback('');
      const profile = await updateInstagramProfile(instagramProfile.id, instagramDraft);
      setInstagramProfile(profile);
      setInstagramDraft(createInstagramDraft(profile));
      setInstagramFeedback('Perfil Instagram salvo.');
    } catch (error) {
      console.error('Erro ao salvar Instagram:', error);
      setInstagramFeedback(error?.message || 'Nao foi possivel salvar o Instagram.');
    } finally {
      setSavingInstagram(false);
    }
  }

  async function handleDeactivateInstagram() {
    if (!canManageClients || !instagramProfile?.id) return;

    const shouldDeactivate = window.confirm('Desativar Instagram deste cliente? As informacoes ficam salvas, mas o modulo sera ocultado para este cliente.');

    if (!shouldDeactivate) return;

    try {
      setSavingInstagram(true);
      setInstagramFeedback('');
      await deactivateInstagramProfile(instagramProfile.id);
      setInstagramProfile(null);
      setInstagramDraft(createInstagramDraft());
      setInstagramFeedback('Instagram desativado para este cliente.');
    } catch (error) {
      console.error('Erro ao desativar Instagram:', error);
      setInstagramFeedback(error?.message || 'Nao foi possivel desativar o Instagram.');
    } finally {
      setSavingInstagram(false);
    }
  }

  async function handleActivateContent() {
    if (!canManageClients || !client?.id || client.isNewClient) return;

    try {
      setSavingContent(true);
      setContentFeedback('');
      const delivery = await activateContentDeliveryForClient(
        client,
        client.responsavel_cliente || client.responsavel || ''
      );
      setContentDelivery(delivery);
      setContentFeedback('Central de Conteudo ativada para este cliente.');
    } catch (error) {
      console.error('Erro ao ativar Central de Conteudo:', error);
      setContentFeedback(error?.message || 'Nao foi possivel ativar a Central de Conteudo.');
    } finally {
      setSavingContent(false);
    }
  }

  function handleOpenInstagramDashboard() {
    if (typeof onNavigate === 'function') {
      onNavigate('instagram');
      onClose?.();
      return;
    }

    window.history.pushState({}, '', '/instagram');
    window.dispatchEvent(new PopStateEvent('popstate'));
    onClose?.();
  }

  function handleOpenContentDashboard() {
    if (typeof onNavigate === 'function') {
      onNavigate('conteudo');
      onClose?.();
      return;
    }

    window.history.pushState({}, '', '/conteudo');
    window.dispatchEvent(new PopStateEvent('popstate'));
    onClose?.();
  }

  return (
    <div className="client-profile-backdrop" onClick={onClose}>
      <aside className="client-profile-modal client-profile-modal--tabs" onClick={(event) => event.stopPropagation()}>
        <header className="client-profile-header client-profile-header--tabs">
          <div className="client-profile-identity">
            <div className="client-profile-avatar">{getLeadInitials(client.nome)}</div>

            <div>
              <p>{client.isNewClient ? 'Novo cliente' : 'Central do cliente'}</p>
              <h2>{client.nome || 'Cliente sem nome'}</h2>
              <span>{client.empresa || client.cidade || 'Dados, contrato, documentos e financeiro'}</span>
            </div>
          </div>

          <div className="client-profile-header-actions">
            <button
              type="button"
              className={`client-profile-content-button ${activeTab === 'conteudo' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('conteudo')}
            >
              <FileText size={16} />
              <span>Conteudo</span>
            </button>

            <button
              type="button"
              className={`client-profile-instagram-button ${activeTab === 'instagram' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('instagram')}
            >
              <Camera size={16} />
              <span>Instagram</span>
            </button>

            <button type="button" className="client-profile-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </header>

        <nav className="client-profile-tabs" aria-label="Secoes do cliente">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={`client-profile-tab ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="client-profile-body client-profile-body--tabs">
          {activeTab === 'resumo' && (
            <section className="client-profile-section">
              <div className="client-profile-section__title">
                <h3>Resumo operacional</h3>
                <span>Status, responsavel e proximos passos</span>
              </div>

              <div className="client-summary-grid">
                <SummaryBox label="Status" value={getStatusLabel(client.status_cliente)} />
                <SummaryBox label="Responsavel" value={client.responsavel_cliente || 'Sem responsavel'} />
                <SummaryBox label="Inicio" value={formatShortDate(client.data_inicio_cliente)} />
                <SummaryBox label="Proxima acao" value={client.proxima_acao || 'Sem proxima acao'} tone={client.proxima_acao ? 'neutral' : 'warning'} />
                {canSeeFinancials && (
                  <>
                    <SummaryBox label="Mensalidade" value={formatCurrency(getMoneyNumber(client.mensalidade))} tone="green" />
                    <SummaryBox label="Vencimento" value={client.dia_vencimento ? `Dia ${client.dia_vencimento}` : 'Sem dia'} />
                    <SummaryBox label="Financeiro" value={getFinancialLabel(client.status_financeiro)} tone={getFinancialTone(client.status_financeiro)} />
                  </>
                )}
                <SummaryBox label="Documentos" value={`${documentsCount} cadastrados`} tone={documentsCount ? 'green' : 'warning'} />
                <SummaryBox label="Entregas" value={`${deliverySummary.total} tarefas`} tone={deliverySummary.pending ? 'warning' : 'green'} />
              </div>

              <div className="client-edit-grid">
                <EditField
                  label="Proxima acao"
                  value={client.proxima_acao}
                  onChange={(value) => onChange('proxima_acao', value)}
                />

                <EditField
                  label="Ultima acao"
                  value={client.ultima_acao}
                  onChange={(value) => onChange('ultima_acao', value)}
                />

                <div className="client-edit-field client-edit-field--full">
                  <label>Observacoes</label>
                  <textarea
                    value={client.observacoes_cliente || ''}
                    onChange={(event) => onChange('observacoes_cliente', event.target.value)}
                    rows={6}
                    placeholder="Anote historico, combinados, detalhes importantes e proximos passos..."
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'contato' && (
            <section className="client-profile-section">
              <div className="client-profile-section__title">
                <h3>Contato</h3>
                <span>Canais e identificacao do cliente</span>
              </div>

              <div className="client-edit-grid">
                <EditField label="Nome" value={client.nome} onChange={(value) => onChange('nome', value)} />
                <EditField label="Empresa / Clinica" value={client.empresa} onChange={(value) => onChange('empresa', value)} />
                <EditField label="Contato principal" value={client.contato_principal} onChange={(value) => onChange('contato_principal', value)} />
                <EditField label="E-mail" type="email" value={client.email} onChange={(value) => onChange('email', value)} />
                <EditField label="Telefone" value={client.telefone} onChange={(value) => onChange('telefone', value)} />
                <EditField label="WhatsApp" value={client.whatsapp} onChange={(value) => onChange('whatsapp', value)} />
                <EditField label="Cidade" value={client.cidade} onChange={(value) => onChange('cidade', value)} />
              </div>

              <div className="client-profile-actions">
                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noreferrer">
                    <MessageCircle size={15} />
                    WhatsApp
                  </a>
                )}

                {client.email && (
                  <a href={`mailto:${client.email}`}>
                    <Mail size={15} />
                    E-mail
                  </a>
                )}
              </div>
            </section>
          )}

          {activeTab === 'contrato' && (
            <section className="client-profile-section">
              <div className="client-profile-section__title">
                <h3>Contrato</h3>
                <span>Plano, servico, status e tempo estimado</span>
              </div>

              <div className="client-edit-grid">
                <EditField label="Servico contratado" value={client.servico_contratado} onChange={(value) => onChange('servico_contratado', value)} />
                <EditField label="Plano contratado" value={client.plano_contratado} onChange={(value) => onChange('plano_contratado', value)} />

                <div className="client-edit-field">
                  <label>Status do cliente</label>
                  <select value={client.status_cliente} onChange={(event) => onChange('status_cliente', event.target.value)}>
                    {CLIENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <EditField label="Data de inicio" type="date" value={client.data_inicio_cliente} onChange={(value) => onChange('data_inicio_cliente', value)} />
                <EditField label="Responsavel" value={client.responsavel_cliente} onChange={(value) => onChange('responsavel_cliente', value)} />
                <EditField label="Meses estimados de contrato" type="number" value={client.meses_estimados_contrato} onChange={(value) => onChange('meses_estimados_contrato', value)} />

                <div className="client-edit-field client-edit-field--toggle">
                  <label>Cliente recorrente</label>
                  <button
                    type="button"
                    className={`client-toggle-button ${client.recorrente ? 'is-active' : ''}`}
                    onClick={() => onChange('recorrente', !client.recorrente)}
                  >
                    {client.recorrente ? 'Recorrente ativo' : 'Nao recorrente'}
                  </button>
                </div>

                <EditField label="Artigos mensais" type="number" value={client.artigos_mensais} onChange={(value) => onChange('artigos_mensais', value)} placeholder="Ex: 4" />
                <EditField label="Valor por artigo" value={client.valor_por_artigo} onChange={(value) => onChange('valor_por_artigo', value)} placeholder="Ex: 250,00" />
                <EditField label="Responsavel padrao" value={client.responsavel_padrao} onChange={(value) => onChange('responsavel_padrao', value)} />
              </div>
            </section>
          )}

          {activeTab === 'entregas' && (
            <section className="client-profile-section client-deliveries-section">
              <div className="client-profile-section__title">
                <h3>Entregas e historico</h3>
                <span>Tarefas vinculadas ao cliente, artigos e progresso operacional</span>
              </div>

              <div className="client-summary-grid client-summary-grid--deliveries">
                <SummaryBox label="Total" value={deliverySummary.total} />
                <SummaryBox label="Concluidas" value={deliverySummary.completed} tone="green" />
                <SummaryBox label="Pendentes" value={deliverySummary.pending} tone={deliverySummary.pending ? 'warning' : 'green'} />
                <SummaryBox label="Artigos" value={deliverySummary.articles} />
                {canSeeFinancials && (
                  <SummaryBox label="Faturavel" value={formatCurrency(deliverySummary.revenue)} tone="green" />
                )}
              </div>

              {loadingTasks ? (
                <div className="client-deliveries-empty">Carregando entregas...</div>
              ) : clientTasks.length === 0 ? (
                <div className="client-deliveries-empty">
                  Nenhuma entrega vinculada a este cliente ainda.
                </div>
              ) : (
                <div className="client-deliveries-list">
                  {clientTasks.slice(0, 10).map((task) => (
                    <article className="client-delivery-row" key={task.id}>
                      <div className="client-delivery-row__main">
                        <span className={`client-delivery-status client-delivery-status--${normalizeTaskStatus(task.status)}`}>
                          {isTaskCompleted(task) ? <CheckCircle2 size={14} /> : <ClipboardCheck size={14} />}
                        </span>
                        <div>
                          <strong>{task.titulo || 'Tarefa sem titulo'}</strong>
                          <span>{task.mes_referencia ? formatMonthReferenceLabel(task.mes_referencia) : formatShortDate(task.data_vencimento)}</span>
                        </div>
                      </div>

                      <div className="client-delivery-row__meta">
                        <strong>{getTaskStatusLabel(task.status)}</strong>
                        <span>Status</span>
                      </div>

                      <div className="client-delivery-row__meta">
                        <strong>{Number(task.quantidade_artigos || 0)}</strong>
                        <span>Artigos</span>
                      </div>

                      <div className="client-delivery-row__meta">
                        <strong>{task.responsavel || 'Sem responsavel'}</strong>
                        <span>Responsavel</span>
                      </div>

                      {canSeeFinancials && (
                        <div className="client-delivery-row__meta is-money">
                          <strong>{formatCurrency(getTaskTotal(task))}</strong>
                          <span>Valor</span>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'instagram' && (
            <section className="client-profile-section client-instagram-section">
              <div className="client-profile-section__title">
                <h3>Instagram</h3>
                <span>Ative o perfil, salve os dados e acompanhe posts no dashboard</span>
              </div>

              {client.isNewClient ? (
                <div className="client-instagram-empty">
                  Salve o cliente antes de ativar o Instagram.
                </div>
              ) : loadingInstagram ? (
                <div className="client-instagram-empty">
                  Carregando perfil Instagram...
                </div>
              ) : !instagramProfile ? (
                <div className="client-instagram-activation-card">
                  <div className="client-instagram-activation-card__icon">
                    <Camera size={22} />
                  </div>

                  <div>
                    <strong>Instagram desativado</strong>
                    <p>Ative o modulo para cadastrar o perfil, montar planejamento, criar posts e gerar preview para o cliente.</p>
                  </div>

                  <button
                    type="button"
                    className="clients-primary-button"
                    onClick={handleActivateInstagram}
                    disabled={!canManageClients || savingInstagram}
                  >
                    <Camera size={16} />
                    {savingInstagram ? 'Ativando...' : 'Ativar Instagram'}
                  </button>
                </div>
              ) : (
                <div className="client-instagram-panel">
                  <div className="client-instagram-status">
                    <div className="client-instagram-avatar">
                      {instagramDraft.foto_url ? (
                        <img src={normalizeUrl(instagramDraft.foto_url)} alt="" />
                      ) : (
                        <Camera size={20} />
                      )}
                    </div>

                    <div>
                      <strong>{instagramDraft.nome || client.nome || 'Perfil Instagram'}</strong>
                      <span>{instagramDraft.usuario ? `@${normalizeInstagramDisplayUser(instagramDraft.usuario)}` : 'Usuario nao informado'}</span>
                    </div>

                    <button
                      type="button"
                      className="client-toggle-button is-active"
                      onClick={handleDeactivateInstagram}
                      disabled={!canManageClients || savingInstagram}
                    >
                      Instagram ativo
                    </button>
                  </div>

                  <div className="client-edit-grid">
                    <EditField
                      label="Nome do perfil"
                      value={instagramDraft.nome}
                      onChange={(value) => handleChangeInstagramDraft('nome', value)}
                      placeholder="Ex: Panorama Marketing"
                      disabled={!canManageClients || savingInstagram}
                    />
                    <EditField
                      label="@usuario"
                      value={instagramDraft.usuario}
                      onChange={(value) => handleChangeInstagramDraft('usuario', value)}
                      placeholder="Ex: panorama.agencia"
                      disabled={!canManageClients || savingInstagram}
                    />
                    <EditField
                      label="Link do perfil"
                      value={instagramDraft.site}
                      onChange={(value) => handleChangeInstagramDraft('site', value)}
                      placeholder="https://instagram.com/usuario"
                      disabled={!canManageClients || savingInstagram}
                    />
                    <EditField
                      label="Foto do perfil"
                      value={instagramDraft.foto_url}
                      onChange={(value) => handleChangeInstagramDraft('foto_url', value)}
                      placeholder="URL da imagem"
                      disabled={!canManageClients || savingInstagram}
                    />
                    <div className="client-edit-field client-edit-field--full">
                      <label>Bio</label>
                      <textarea
                        value={instagramDraft.bio || ''}
                        onChange={(event) => handleChangeInstagramDraft('bio', event.target.value)}
                        disabled={!canManageClients || savingInstagram}
                        rows={4}
                        placeholder="Bio atual ou planejada do perfil..."
                      />
                    </div>
                  </div>

                  <div className="client-instagram-actions">
                    <button
                      type="button"
                      className="clients-tool-button"
                      onClick={handleOpenInstagramDashboard}
                    >
                      <Camera size={15} />
                      Abrir dashboard
                    </button>

                    <button
                      type="button"
                      className="clients-tool-button is-danger"
                      onClick={handleDeactivateInstagram}
                      disabled={!canManageClients || savingInstagram}
                    >
                      Desativar
                    </button>

                    <button
                      type="button"
                      className="clients-primary-button"
                      onClick={handleSaveInstagramProfile}
                      disabled={!canManageClients || savingInstagram}
                    >
                      <Save size={15} />
                      {savingInstagram ? 'Salvando...' : 'Salvar Instagram'}
                    </button>
                  </div>
                </div>
              )}

              {instagramFeedback && <span className="client-instagram-feedback">{instagramFeedback}</span>}
            </section>
          )}

          {activeTab === 'conteudo' && (
            <section className="client-profile-section client-content-section">
              <div className="client-profile-section__title">
                <h3>Conteudo</h3>
                <span>Central de revisao, entregas mensais e aprovacao guiada</span>
              </div>

              {client.isNewClient ? (
                <div className="client-content-empty">
                  Salve o cliente antes de ativar a Central de Conteudo.
                </div>
              ) : loadingContent ? (
                <div className="client-content-empty">
                  Carregando Central de Conteudo...
                </div>
              ) : !contentDelivery ? (
                <div className="client-content-activation-card">
                  <div className="client-content-activation-card__icon">
                    <FileText size={22} />
                  </div>

                  <div>
                    <strong>Central de Revisao de Conteudo</strong>
                    <p>Ative o modulo para organizar pacotes mensais, revisar artigos e preparar aprovacoes por link magico nas proximas etapas.</p>
                  </div>

                  <button
                    type="button"
                    className="clients-primary-button"
                    onClick={handleActivateContent}
                    disabled={!canManageClients || savingContent}
                  >
                    <FileText size={16} />
                    {savingContent ? 'Ativando...' : 'Ativar modulo'}
                  </button>
                </div>
              ) : (
                <div className="client-content-panel">
                  <div className="client-content-status">
                    <div className="client-content-status__icon">
                      <FileText size={20} />
                    </div>

                    <div>
                      <strong>{contentDelivery.titulo || 'Central de Revisao de Conteudo'}</strong>
                      <span>{getContentDeliveryStatusLabel(contentDelivery.status)}</span>
                    </div>

                    <button
                      type="button"
                      className="client-toggle-button is-active"
                      disabled
                    >
                      Modulo ativo
                    </button>
                  </div>

                  <div className="client-summary-grid">
                    <SummaryBox label="Nome interno" value={contentDelivery.titulo} />
                    <SummaryBox label="Conteudos/mes" value={contentDelivery.quantidade_prevista ?? 0} />
                    <SummaryBox label="Mes/Ano" value={formatContentMonthReferenceLabel(contentDelivery.mes_referencia)} />
                    <SummaryBox label="Responsavel" value={contentDelivery.responsavel || 'Sem responsavel'} />
                  </div>

                  <div className="client-content-actions">
                    <button
                      type="button"
                      className="clients-primary-button"
                      onClick={handleOpenContentDashboard}
                    >
                      <FileText size={15} />
                      Abrir Central de Conteudo
                    </button>
                  </div>
                </div>
              )}

              {contentFeedback && <span className="client-content-feedback">{contentFeedback}</span>}
            </section>
          )}

          {activeTab === 'documentos' && (
            <section className="client-profile-section client-documents-section">
              <div className="client-profile-section__title">
                <h3>Documentos e atalhos</h3>
                <span>Clique em um card para adicionar ou alterar o link</span>
              </div>

              <div className="client-documents-grid">
                {documents.map((field) => {
                  const hasLink = Boolean(field.value);

                  return (
                    <button
                      key={field.key}
                      type="button"
                      className={`client-document-card ${hasLink ? 'has-link' : 'is-empty'}`}
                      onClick={() => handleOpenLinkEditor(field)}
                    >
                      <div className="client-document-card__icon">
                        {hasLink ? <Link2 size={18} /> : <Plus size={18} />}
                      </div>

                      <div className="client-document-card__content">
                        <strong>{field.label}</strong>
                        <span>{hasLink ? 'Link cadastrado' : 'Adicionar link'}</span>
                      </div>

                      {hasLink && (
                        <a
                          href={normalizeUrl(field.value)}
                          target="_blank"
                          rel="noreferrer"
                          className="client-document-card__open"
                          onClick={(event) => event.stopPropagation()}
                          title={`Abrir ${field.label}`}
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </button>
                  );
                })}
              </div>

              {activeLinkField && (
                <div className="client-link-editor">
                  <div>
                    <p>Editando link</p>
                    <h4>{activeLinkField.label}</h4>
                  </div>

                  <input
                    value={linkDraft}
                    onChange={(event) => setLinkDraft(event.target.value)}
                    placeholder="Cole aqui a URL do Google Drive, Docs, planilha ou pagina..."
                    autoFocus
                  />

                  <div className="client-link-editor__actions">
                    <button type="button" className="clients-tool-button" onClick={handleCloseLinkEditor}>Cancelar</button>

                    {client[activeLinkField.key] && (
                      <button type="button" className="clients-tool-button is-danger" onClick={handleClearLinkField}>
                        Remover link
                      </button>
                    )}

                    <button type="button" className="clients-primary-button" onClick={handleSaveLinkField}>
                      <Save size={15} />
                      Salvar link
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'financeiro' && canSeeFinancials && (
            <section className="client-profile-section is-sensitive-financial">
              <div className="client-profile-section__title">
                <h3>Financeiro</h3>
                <span>Informacoes visiveis apenas para dono e gestor</span>
              </div>

              <div className="client-summary-grid">
                <SummaryBox label="Mensalidade" value={formatCurrency(getMoneyNumber(client.mensalidade))} />
                <SummaryBox label="Vencimento" value={client.dia_vencimento ? `Dia ${client.dia_vencimento}` : 'Sem dia'} />
                <SummaryBox label="Status" value={getFinancialLabel(client.status_financeiro)} />
              </div>

              <div className="client-edit-grid">
                <EditField label="Mensalidade" value={client.mensalidade} onChange={(value) => onChange('mensalidade', value)} placeholder="Ex: 2490,00" />
                <EditField label="Dia de vencimento" type="number" value={client.dia_vencimento} onChange={(value) => onChange('dia_vencimento', value)} placeholder="Ex: 10" />

                <div className="client-edit-field">
                  <label>Status financeiro</label>
                  <select value={client.status_financeiro} onChange={(event) => onChange('status_financeiro', event.target.value)}>
                    <option value="nao_informado">Nao informado</option>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>
              </div>
            </section>
          )}
        </div>

        {feedback && <span className="client-edit-feedback">{feedback}</span>}

        <footer className="client-profile-footer">
          <div className="client-profile-footer__danger">
            {canManageClients && !client.isNewClient && (
              <>
                <button type="button" className="clients-danger-soft-button" onClick={() => onArchive(client)} disabled={saving}>
                  <Archive size={16} />
                  Inativar cliente
                </button>

                <button type="button" className="clients-danger-button" onClick={() => onDelete(client)} disabled={saving}>
                  <Trash2 size={16} />
                  Excluir cliente
                </button>
              </>
            )}
          </div>

          <div className="client-profile-footer__actions">
            <button type="button" className="clients-tool-button" onClick={onClose}>Cancelar</button>
            <button type="button" className="clients-primary-button" onClick={onSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'Salvando...' : client.isNewClient ? 'Criar cliente' : 'Salvar cliente'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) {
  return (
    <div className="client-edit-field">
      <label>{label}</label>
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SummaryBox({ label, value, tone = 'neutral' }) {
  const displayValue = value === null || value === undefined || value === '' ? 'Nao informado' : value;

  return (
    <div className={`client-summary-box client-summary-box--${tone}`}>
      <span>{label}</span>
      <strong>{displayValue}</strong>
    </div>
  );
}

function createInstagramDraft(profile = {}) {
  return {
    nome: profile.nome || '',
    usuario: profile.usuario || '',
    bio: profile.bio || '',
    site: profile.site || '',
    foto_url: profile.foto_url || '',
  };
}

function getDeliverySummary(tasks) {
  return tasks.reduce((summary, task) => {
    const isCompleted = isTaskCompleted(task);
    const revenue = task.faturavel === false || task.status === 'cancelado' ? 0 : getTaskTotal(task);

    return {
      total: summary.total + 1,
      completed: summary.completed + (isCompleted ? 1 : 0),
      pending: summary.pending + (isCompleted || task.status === 'cancelado' ? 0 : 1),
      articles: summary.articles + Number(task.quantidade_artigos || 0),
      revenue: summary.revenue + revenue,
    };
  }, {
    total: 0,
    completed: 0,
    pending: 0,
    articles: 0,
    revenue: 0,
  });
}

function isTaskCompleted(task) {
  return ['concluido', 'arquivada'].includes(task?.status);
}

function getTaskTotal(task) {
  const explicitTotal = getMoneyNumber(task?.valor_total);

  if (explicitTotal > 0) return explicitTotal;

  return Number(task?.quantidade_artigos || 0) * getMoneyNumber(task?.valor_unitario);
}

function normalizeTaskStatus(status) {
  if (status === 'aguardando_cliente') return 'enviado_cliente';
  if (status === 'em_andamento' || status === 'atrasado') return 'pendente';

  return status || 'pendente';
}

function getTaskStatusLabel(status) {
  const labels = {
    pendente: 'Pendente',
    enviado_cliente: 'Enviado ao Cliente',
    aguardando_cliente: 'Enviado ao Cliente',
    recebido: 'A receber',
    concluido: 'Concluido',
    arquivada: 'Arquivada',
    cancelado: 'Cancelada',
  };

  return labels[status] || labels[normalizeTaskStatus(status)] || 'Pendente';
}

function formatMonthReferenceLabel(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return monthReference || 'Sem mes';

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

function getStatusLabel(status) {
  const found = CLIENT_STATUS_OPTIONS.find((option) => option.value === status);
  return found?.label || 'Ativo';
}

function getFinancialLabel(status) {
  const labels = {
    pago: 'Pago',
    pendente: 'Pendente',
    atrasado: 'Atrasado',
    nao_informado: 'Nao informado',
  };

  return labels[status] || 'Nao informado';
}

function getFinancialTone(status) {
  const tones = {
    pago: 'green',
    pendente: 'warning',
    atrasado: 'danger',
    nao_informado: 'warning',
  };

  return tones[status] || 'warning';
}

function formatShortDate(date) {
  if (!date) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
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
  }).format(Number(value || 0));
}

function normalizeUrl(url) {
  if (!url) return '';

  const trimmedUrl = String(url).trim();

  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function normalizeInstagramDisplayUser(value) {
  return String(value || '').trim().replace(/^@+/, '');
}

function getContentDeliveryStatusLabel(status) {
  const labels = {
    rascunho: 'Rascunho',
    em_revisao: 'Em revisao',
    aprovado: 'Aprovado',
    revisar: 'Revisar',
    publicado: 'Publicado',
  };

  return labels[status] || 'Rascunho';
}
