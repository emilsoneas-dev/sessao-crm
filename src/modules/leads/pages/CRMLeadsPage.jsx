import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { Sidebar } from '../../../components/layout/Sidebar.jsx';
import { Topbar } from '../../../components/layout/Topbar.jsx';
import { Toast } from '../../../components/ui/Toast.jsx';
import { KanbanBoard } from '../components/KanbanBoard.jsx';
import { LeadDetailsModal } from '../components/LeadDetailsModal.jsx';
import { CRMClientsPage } from '../../clients/pages/CRMClientsPage.jsx';
import { CRMTasksPage } from '../../tasks/pages/CRMTasksPage.jsx';
import { CRMSettingsPage } from '../../settings/pages/CRMSettingsPage.jsx';
import { CRMOverviewPage } from '../../overview/pages/CRMOverviewPage.jsx';
import { CRMDocumentsPage } from '../../documents/pages/CRMDocumentsPage.jsx';
import { CRMFinancePage } from '../../finance/pages/CRMFinancePage.jsx';
import { CRMHumanResourcesPage } from '../../hr/pages/CRMHumanResourcesPage.jsx';
import { InstagramDashboardPage } from '../../instagram/pages/InstagramDashboardPage.jsx';
import { ContentDashboardPage } from '../../content/pages/ContentDashboardPage.jsx';
import {
  archiveLead,
  convertLeadToClient,
  fetchLeads,
  updateLeadStage,
} from '../services/leadsService.js';
import { useLeadsRealtime } from '../../../hooks/useLeadsRealtime.js';
import { canAccessPage } from '../../../config/permissions.js';

const VALID_PAGES = [
  'visao-geral',
  'leads',
  'clientes',
  'tarefas',
  'financeiro',
  'recursos-humanos',
  'documentos',
  'instagram',
  'conteudo',
  'configuracoes',
];

const pageContent = {
  documentos: {
    title: 'Documentos',
    description:
      'Area preparada para centralizar propostas, briefings, links de apoio e materiais importantes.',
    icon: FileText,
  },
};

function isPipelineLead(lead) {
  return lead.status !== 'cliente' && lead.status !== 'arquivado';
}

function getPageFromPath() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];

  if (!lastSegment) return 'visao-geral';
  if (VALID_PAGES.includes(lastSegment)) return lastSegment;

  return 'leads';
}

function getPathFromPage(page) {
  if (page === 'leads') return '/leads';

  return `/${page}`;
}

function getFirstAllowedPage(role, extraPermissions = []) {
  return VALID_PAGES.find((page) => canAccessPage(role, page, extraPermissions)) || 'leads';
}

export function CRMLeadsPage({
  onLogout,
  session,
  crmUser,
  extraPermissions = [],
}) {
  const kanbanScrollRef = useRef(null);
  const leadSoundRef = useRef(null);

  const userRole = crmUser?.papel || null;

  const [activePage, setActivePage] = useState(getPageFromPath);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('crm_lead_sound_enabled') === 'true';
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('crm_theme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('crm_sidebar_collapsed') === 'true';
  });
  const [overviewView, setOverviewView] = useState(() => {
    return localStorage.getItem('crm_overview_view') || 'estrategica';
  });
  const [financeFilterSignal, setFinanceFilterSignal] = useState(0);
  const [humanResourcesTotal, setHumanResourcesTotal] = useState(0);
  const [instagramTotal, setInstagramTotal] = useState(0);

  useEffect(() => {
    if (!userRole) return;

    function handlePopState() {
      const pageFromPath = getPageFromPath();

      if (canAccessPage(userRole, pageFromPath, extraPermissions)) {
        setActivePage(pageFromPath);
        return;
      }

      const fallbackPage = getFirstAllowedPage(userRole, extraPermissions);
      const fallbackPath = getPathFromPage(fallbackPage);

      setActivePage(fallbackPage);
      window.history.replaceState({}, '', fallbackPath);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [userRole, extraPermissions]);

  useEffect(() => {
    if (!userRole) return;
    if (canAccessPage(userRole, activePage, extraPermissions)) return;

    const fallbackPage = getFirstAllowedPage(userRole, extraPermissions);
    const fallbackPath = getPathFromPage(fallbackPage);

    setActivePage(fallbackPage);

    if (window.location.pathname !== fallbackPath) {
      window.history.replaceState({}, '', fallbackPath);
    }
  }, [activePage, userRole, extraPermissions]);

  useEffect(() => {
    leadSoundRef.current = new Audio('/sounds/novo-lead.mp3');
    leadSoundRef.current.volume = 0.65;
  }, []);

  useEffect(() => {
    localStorage.setItem('crm_lead_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('crm_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('crm_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('crm_overview_view', overviewView);
  }, [overviewView]);

  function playLeadSound() {
    if (!soundEnabled || !leadSoundRef.current) return;

    leadSoundRef.current.currentTime = 0;

    leadSoundRef.current.play().catch((error) => {
      console.warn('Som de novo lead bloqueado pelo navegador:', error);
    });
  }

  async function handleEnableSound() {
    setSoundEnabled((current) => {
      const nextValue = !current;

      if (nextValue && leadSoundRef.current) {
        leadSoundRef.current.currentTime = 0;

        leadSoundRef.current.play().catch((error) => {
          console.warn('Nao foi possivel testar o som:', error);
        });
      }

      return nextValue;
    });
  }

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchLeads();
      setLeads(data);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useLeadsRealtime({
    onNewLead: (newLead) => {
      setLeads((current) => {
        const leadAlreadyExists = current.some((lead) => lead.id === newLead.id);

        if (leadAlreadyExists) return current;

        return [newLead, ...current];
      });

      playLeadSound();
      setToast(newLead.nome ? `Novo lead: ${newLead.nome}` : 'Novo lead recebido');
      window.setTimeout(() => setToast(null), 4500);
    },
    onLeadUpdated: (updatedLead) => {
      setLeads((current) =>
        current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
      );

      setSelectedLead((current) => {
        if (!current || current.id !== updatedLead.id) return current;

        return updatedLead;
      });
    },
  });

  async function handleMoveLead(leadId, newStage) {
    const oldLeads = leads;

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              etapa: newStage,
              data_ultima_atualizacao: new Date().toISOString(),
            }
          : lead
      )
    );

    try {
      await updateLeadStage(leadId, newStage);
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      setLeads(oldLeads);
      setToast('Nao foi possivel mover o lead.');
      window.setTimeout(() => setToast(null), 4500);
    }
  }

  async function handleConvertLeadToClient(leadId) {
    const oldLeads = leads;
    const now = new Date().toISOString();

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: 'cliente',
              convertido_em: now,
              data_ultima_atualizacao: now,
            }
          : lead
      )
    );

    setSelectedLead(null);

    try {
      const updatedLead = await convertLeadToClient(leadId);

      setLeads((current) =>
        current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
      );

      setToast('Lead convertido em cliente.');
      window.setTimeout(() => setToast(null), 4500);
    } catch (error) {
      console.error('Erro ao converter lead em cliente:', error);
      setLeads(oldLeads);
      setToast('Nao foi possivel converter o lead.');
      window.setTimeout(() => setToast(null), 4500);
    }
  }

  async function handleArchiveLead(leadId) {
    const oldLeads = leads;
    const now = new Date().toISOString();

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: 'arquivado',
              arquivado_em: now,
              data_ultima_atualizacao: now,
            }
          : lead
      )
    );

    setSelectedLead(null);

    try {
      const updatedLead = await archiveLead(leadId);

      setLeads((current) =>
        current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
      );

      setToast('Lead arquivado para contato futuro.');
      window.setTimeout(() => setToast(null), 4500);
    } catch (error) {
      console.error('Erro ao arquivar lead:', error);
      setLeads(oldLeads);
      setToast('Nao foi possivel arquivar o lead.');
      window.setTimeout(() => setToast(null), 4500);
    }
  }

  function scrollKanban(direction) {
    const container = kanbanScrollRef.current;

    if (!container) return;

    container.scrollBy({
      left: direction === 'left' ? -430 : 430,
      behavior: 'smooth',
    });
  }

  function handleOpenFinancialAlerts() {
    setFinanceFilterSignal((current) => current + 1);
    handleNavigate('financeiro');
    setToast('Mostrando alertas financeiros.');
    window.setTimeout(() => setToast(null), 3500);
  }

  function handleNavigate(page) {
    if (!VALID_PAGES.includes(page)) return;

    if (!userRole) {
      setToast('Carregando permissoes do usuario. Tente novamente em instantes.');
      window.setTimeout(() => setToast(null), 3500);
      return;
    }

    if (!canAccessPage(userRole, page, extraPermissions)) {
      setToast('Voce nao tem permissao para acessar esta area.');
      window.setTimeout(() => setToast(null), 4500);
      return;
    }

    const nextPath = getPathFromPage(page);

    setActivePage(page);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const pipelineLeads = useMemo(() => {
    return leads.filter(isPipelineLead);
  }, [leads]);

  const clientLeads = useMemo(() => {
    return leads.filter((lead) => lead.status === 'cliente');
  }, [leads]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const leadsToday = leads.filter((lead) =>
      String(lead.data_entrada || '').startsWith(today)
    );
    const clients = leads.filter((lead) => lead.status === 'cliente');
    const archived = leads.filter((lead) => lead.status === 'arquivado');

    return {
      historicalTotal: leads.length,
      pipelineTotal: pipelineLeads.length,
      today: leadsToday.length,
      proposal: pipelineLeads.filter((lead) => lead.etapa === 'proposta_enviada').length,
      closed: pipelineLeads.filter((lead) => lead.etapa === 'conclusao').length,
      activeClients: clients.length,
      newClients: clients.filter((lead) =>
        String(lead.convertido_em || '').startsWith(today)
      ).length,
      archived: archived.length,
      pendingTasks: 0,
    };
  }, [leads, pipelineLeads]);

  const topbarTotal =
    activePage === 'recursos-humanos'
      ? humanResourcesTotal
      : activePage === 'instagram'
        ? instagramTotal
      : ['clientes', 'financeiro', 'documentos', 'tarefas'].includes(activePage)
        ? clientLeads.length
        : stats.pipelineTotal;

  const topbarPhrase =
    activePage === 'visao-geral'
      ? overviewView === 'operacional'
        ? 'Execucao do mes, tarefas, atrasos e demandas ativas.'
        : 'Receita, crescimento, carteira e indicadores de direcao.'
      : activePage === 'clientes'
      ? 'Carteira organizada, dados essenciais e proximos movimentos.'
      : activePage === 'financeiro'
        ? 'Receita, indicadores internos e leitura administrativa da agencia.'
        : activePage === 'recursos-humanos'
          ? 'Equipe, cargos, acessos e cadastros internos da agencia.'
          : activePage === 'tarefas'
          ? 'Controle de tarefas, entregas, recorrentes e fluxo de producao.'
          : activePage === 'documentos'
            ? 'Centralize contratos, briefings, drives e materiais de apoio dos clientes.'
            : activePage === 'instagram'
            ? 'Perfis Instagram ativados para clientes da carteira.'
            : activePage === 'conteudo'
            ? 'Pacotes mensais, revisoes e aprovacoes.'
            : 'Clareza para decidir, consistencia para executar.';

  return (
    <div className={`crm-shell theme-${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        activePage={activePage}
        activeOverviewView={overviewView}
        userRole={userRole || 'funcionario'}
        extraPermissions={extraPermissions}
        onNavigate={handleNavigate}
        onOverviewViewChange={setOverviewView}
        onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
      />

      <main className="crm-main">
        <Topbar
          totalLeads={topbarTotal}
          theme={theme}
          crmUser={crmUser}
          userEmail={session?.user?.email}
          clients={clientLeads}
          dailyPhrase={topbarPhrase}
          onLogout={onLogout}
          onOpenFinancialAlerts={handleOpenFinancialAlerts}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        />

        {activePage === 'leads' ? (
          <section className="leads-page">
            <section className="stats-grid">
              <StatCard label="Funil ativo" value={stats.pipelineTotal} type="blue" icon={TrendingUp} />
              <StatCard label="Novos hoje" value={stats.today} type="green" icon={UserPlus} />
              <StatCard label="Propostas" value={stats.proposal} type="amber" icon={FileText} />
              <StatCard label="Conclusao" value={stats.closed} type="purple" icon={CheckCircle2} />
            </section>

            <section className="agency-overview">
              <PreviewCard
                label="Historico"
                value={stats.historicalTotal}
                description="Leads registrados"
                icon={Briefcase}
              />
              <PreviewCard
                label="Convertidos"
                value={stats.activeClients}
                description="Viraram clientes"
                icon={Users}
              />
              <PreviewCard
                label="Arquivados"
                value={stats.archived}
                description="Contato futuro"
                icon={Clock3}
              />
            </section>

            <section className="pipeline-panel">
              <div className="pipeline-panel__header">
                <div>
                  <p>Leads</p>
                  <h2>Funil comercial</h2>
                  <span>Oportunidades em andamento, propostas e conversoes.</span>
                </div>

                <div className="pipeline-panel__controls">
                  <button
                    type="button"
                    onClick={handleEnableSound}
                    title={soundEnabled ? 'Som de novos leads ativo' : 'Ativar som de novos leads'}
                    aria-label={soundEnabled ? 'Som de novos leads ativo' : 'Ativar som de novos leads'}
                  >
                    {soundEnabled ? <Bell size={17} /> : <BellOff size={17} />}
                  </button>

                  <button type="button" onClick={() => scrollKanban('left')}>
                    <ArrowLeft size={17} />
                  </button>

                  <button type="button" onClick={() => scrollKanban('right')}>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>

              <div className="kanban-scroll" ref={kanbanScrollRef}>
                {loading ? (
                  <div className="loading-box">Carregando leads...</div>
                ) : (
                  <KanbanBoard
                    leads={pipelineLeads}
                    onMoveLead={handleMoveLead}
                    onConvertLead={handleConvertLeadToClient}
                    onArchiveLead={handleArchiveLead}
                    onOpenLead={setSelectedLead}
                  />
                )}
              </div>
            </section>
          </section>
        ) : activePage === 'visao-geral' ? (
          <CRMOverviewPage
            leads={leads}
            pipelineLeads={pipelineLeads}
            clientLeads={clientLeads}
            crmUser={crmUser}
            activeView={overviewView}
            onNavigate={handleNavigate}
          />
        ) : activePage === 'clientes' ? (
          <CRMClientsPage clients={clientLeads} crmUser={crmUser} onNavigate={handleNavigate} />
        ) : activePage === 'financeiro' ? (
          <CRMFinancePage clients={clientLeads} financialAlertSignal={financeFilterSignal} />
        ) : activePage === 'recursos-humanos' ? (
          <CRMHumanResourcesPage
            crmUser={crmUser}
            onUsersTotalChange={setHumanResourcesTotal}
          />
        ) : activePage === 'tarefas' ? (
          <CRMTasksPage clients={clientLeads} crmUser={crmUser} />
        ) : activePage === 'documentos' ? (
          <CRMDocumentsPage clients={clientLeads} />
        ) : activePage === 'instagram' ? (
          <InstagramDashboardPage onTotalChange={setInstagramTotal} onNavigate={handleNavigate} />
        ) : activePage === 'conteudo' ? (
          <ContentDashboardPage />
        ) : activePage === 'configuracoes' ? (
          <CRMSettingsPage crmUser={crmUser} />
        ) : (
          <PlaceholderPage page={activePage} />
        )}
      </main>

      <LeadDetailsModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onConvertLead={handleConvertLeadToClient}
        onArchiveLead={handleArchiveLead}
      />

      <Toast visible={Boolean(toast)} message={toast} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, type }) {
  return (
    <article className={`stat-card stat-card--${type}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="stat-card__icon">
        <Icon size={22} />
      </div>
    </article>
  );
}

function PreviewCard({ label, value, description, icon: Icon }) {
  return (
    <article className="preview-card">
      <div className="preview-card__icon">
        <Icon size={19} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{description}</p>
      </div>
    </article>
  );
}

function PlaceholderPage({ page }) {
  const content = pageContent[page] || pageContent.documentos;
  const Icon = content.icon;

  return (
    <section className="placeholder-page">
      <div className="placeholder-page__icon">
        <Icon size={26} />
      </div>

      <div>
        <p>Area em construcao</p>
        <h2>{content.title}</h2>
        <span>{content.description}</span>
      </div>
    </section>
  );
}
