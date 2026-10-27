import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Send,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { fetchTasks } from '../../tasks/services/tasksService.js';
import '../styles/overview.css';

const STAGE_LABELS = {
  entrou: 'Entrou',
  qualificacao: 'Qualificacao',
  diagnostico: 'Diagnostico',
  proposta_enviada: 'Proposta',
  negociacao: 'Negociacao',
  conclusao: 'Conclusao',
};

const STAGE_ORDER = [
  'entrou',
  'qualificacao',
  'diagnostico',
  'proposta_enviada',
  'negociacao',
  'conclusao',
];

const TASK_STAGE_ORDER = [
  { id: 'pendente', label: 'Pendentes', icon: Clock3, tone: 'amber' },
  { id: 'enviado_cliente', label: 'Enviadas', icon: Send, tone: 'blue' },
  { id: 'recebido', label: 'A receber', icon: FileText, tone: 'purple' },
  { id: 'concluido', label: 'Concluidas', icon: CheckCircle2, tone: 'green' },
];

export function CRMOverviewPage({
  leads = [],
  pipelineLeads = [],
  clientLeads = [],
  crmUser,
  activeView = 'estrategica',
  onNavigate,
}) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      try {
        const data = await fetchTasks();

        if (isMounted) {
          setTasks(data);
        }
      } catch (error) {
        console.error('Erro ao carregar tarefas da visao geral:', error);
      } finally {
        if (isMounted) {
          setLoadingTasks(false);
        }
      }
    }

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const monthReference = getCurrentMonthReference();

  const overview = useMemo(() => {
    const today = getTodayDate();
    const previousMonth = getPreviousMonthReference(monthReference);

    const visibleTasks = tasks.filter((task) => !['cancelado', 'arquivada'].includes(task.status));
    const openTasks = visibleTasks.filter((task) => normalizeTaskStatus(task.status) !== 'concluido');
    const overdueTasks = openTasks.filter((task) => task.data_vencimento && task.data_vencimento < today);
    const monthTasks = tasks.filter((task) => isTaskInMonth(task, monthReference));
    const billableMonthTasks = monthTasks.filter((task) => task.faturavel !== false && task.status !== 'cancelado');
    const completedBillableTasks = billableMonthTasks.filter((task) =>
      ['concluido', 'arquivada'].includes(normalizeTaskStatus(task.status))
    );
    const pendingBillableTasks = billableMonthTasks.filter((task) =>
      !['concluido', 'arquivada'].includes(normalizeTaskStatus(task.status))
    );

    const taskStageCounts = TASK_STAGE_ORDER.map((stage) => ({
      ...stage,
      value: visibleTasks.filter((task) => normalizeTaskStatus(task.status) === stage.id).length,
    }));

    const stageCounts = STAGE_ORDER.map((stage) => ({
      id: stage,
      label: STAGE_LABELS[stage],
      value: pipelineLeads.filter((lead) => lead.etapa === stage).length,
    }));

    const activeDemandClients = new Set(
      openTasks
        .filter((task) => task.cliente_id)
        .map((task) => task.cliente_id)
    ).size;

    const currentMonthLeads = leads.filter((lead) => getMonthFromDate(lead.data_entrada) === monthReference).length;
    const previousMonthLeads = leads.filter((lead) => getMonthFromDate(lead.data_entrada) === previousMonth).length;
    const growthRate = previousMonthLeads > 0
      ? Math.round(((currentMonthLeads - previousMonthLeads) / previousMonthLeads) * 100)
      : currentMonthLeads > 0
        ? 100
        : 0;

    const recurringClients = clientLeads.filter((client) => {
      return client.recorrente === true || Number(client.artigos_mensais || 0) > 0;
    });

    const expectedRevenue = billableMonthTasks.reduce((total, task) => total + getTaskTotal(task), 0);
    const completedRevenue = completedBillableTasks.reduce((total, task) => total + getTaskTotal(task), 0);
    const pendingRevenue = pendingBillableTasks.reduce((total, task) => total + getTaskTotal(task), 0);
    const monthArticles = billableMonthTasks.reduce((total, task) => total + Number(task.quantidade_artigos || 0), 0);
    const conversionRate = leads.length > 0 ? Math.round((clientLeads.length / leads.length) * 100) : 0;

    return {
      activeDemandClients,
      billableTasks: billableMonthTasks.length,
      completedRevenue,
      conversionRate,
      expectedRevenue,
      growthRate,
      monthArticles,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      pendingRevenue,
      recurringClients: recurringClients.length,
      stageCounts,
      taskStageCounts,
    };
  }, [clientLeads, leads, monthReference, pipelineLeads, tasks]);

  const monthlyEvolution = useMemo(() => {
    return getLastMonths(monthReference, 6).map((month) => {
      const monthTasks = tasks.filter((task) => isTaskInMonth(task, month));
      const revenue = monthTasks
        .filter((task) => task.faturavel !== false && task.status !== 'cancelado')
        .reduce((total, task) => total + getTaskTotal(task), 0);
      const leadsCount = leads.filter((lead) => getMonthFromDate(lead.data_entrada) === month).length;

      return {
        id: month,
        label: formatCompactMonth(month),
        revenue,
        leads: leadsCount,
      };
    });
  }, [leads, monthReference, tasks]);

  const activeClientDemands = useMemo(() => {
    const openTasks = tasks.filter((task) => {
      const status = normalizeTaskStatus(task.status);
      return task.cliente_id && !['concluido', 'cancelado', 'arquivada'].includes(status);
    });

    const grouped = new Map();

    openTasks.forEach((task) => {
      const key = task.cliente_id || task.cliente_nome || task.id;
      const current = grouped.get(key) || {
        id: key,
        name: task.cliente_nome || 'Cliente sem nome',
        tasks: 0,
        articles: 0,
      };

      current.tasks += 1;
      current.articles += Number(task.quantidade_artigos || 0);
      grouped.set(key, current);
    });

    return Array.from(grouped.values())
      .sort((first, second) => second.tasks - first.tasks)
      .slice(0, 5);
  }, [tasks]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.data_entrada || 0) - new Date(a.data_entrada || 0))
      .slice(0, 5);
  }, [leads]);

  return (
    <section className="overview-page">
      <div className="overview-context">
        <div>
          <strong>{activeView === 'operacional' ? 'Visao Operacional' : 'Visao Estrategica'}</strong>
          <span>
            {activeView === 'operacional'
              ? 'Execucao, atrasos, artigos e demandas ativas.'
              : 'Receita, crescimento, clientes e funil comercial.'}
          </span>
        </div>

        <small>{crmUser?.nome || 'CRM Panorama'} · {formatMonthReferenceLabel(monthReference)}</small>
      </div>

      {activeView === 'operacional' ? (
        <OverviewOperationalView
          activeClientDemands={activeClientDemands}
          loadingTasks={loadingTasks}
          monthReference={monthReference}
          onNavigate={onNavigate}
          overview={overview}
        />
      ) : (
        <OverviewStrategicView
          monthlyEvolution={monthlyEvolution}
          onNavigate={onNavigate}
          overview={overview}
          pipelineLeads={pipelineLeads}
          recentLeads={recentLeads}
        />
      )}
    </section>
  );
}

function OverviewOperationalView({
  activeClientDemands,
  loadingTasks,
  monthReference,
  onNavigate,
  overview,
}) {
  return (
    <>
      <div className="overview-stats overview-stats--six">
        {overview.taskStageCounts.map((stage) => (
          <OverviewStat
            key={stage.id}
            label={stage.label}
            value={stage.value}
            helper="Controle de tarefas"
            icon={stage.icon}
            type={stage.tone}
            onClick={() => onNavigate?.('tarefas')}
          />
        ))}
        <OverviewStat
          label="Atrasadas"
          value={overview.overdueTasks}
          helper="Alerta visual"
          icon={AlertCircle}
          type="red"
          onClick={() => onNavigate?.('tarefas')}
        />
        <OverviewStat
          label="Artigos do mes"
          value={overview.monthArticles}
          helper={formatMonthReferenceLabel(monthReference)}
          icon={FileText}
          type="slate"
          onClick={() => onNavigate?.('tarefas')}
        />
      </div>

      <div className="overview-grid overview-grid--balanced">
        <section className="overview-card">
          <div className="overview-card__header">
            <div>
              <h3>Fluxo de producao</h3>
              <p>Status das tarefas ativas no operacional.</p>
            </div>
          </div>

          <div className="overview-pipeline-bars">
            {overview.taskStageCounts.map((stage) => (
              <OverviewBarRow
                key={stage.id}
                label={stage.label}
                value={stage.value}
                total={overview.openTasks + getStageValue(overview.taskStageCounts, 'concluido')}
              />
            ))}
          </div>
        </section>

        <section className="overview-card">
          <div className="overview-card__header">
            <div>
              <h3>Atencao agora</h3>
              <p>Sinais que pedem acao operacional.</p>
            </div>
          </div>

          <div className="overview-alert-list">
            <OverviewAlert icon={AlertCircle} label="Tarefas atrasadas" value={overview.overdueTasks} tone="red" />
            <OverviewAlert icon={Clock3} label="Tarefas em aberto" value={overview.openTasks} tone="amber" />
            <OverviewAlert icon={Users} label="Clientes com demanda ativa" value={overview.activeDemandClients} tone="blue" />
            <OverviewAlert icon={FileText} label="Artigos planejados" value={overview.monthArticles} tone="green" />
          </div>

          {loadingTasks && <p className="overview-muted">Atualizando tarefas...</p>}
        </section>

        <section className="overview-card overview-card--wide">
          <div className="overview-card__header">
            <div>
              <h3>Demandas por cliente</h3>
              <p>Carteiras com tarefas abertas neste momento.</p>
            </div>
          </div>

          <div className="overview-list">
            {activeClientDemands.length === 0 ? (
              <EmptyOverviewText text="Nenhum cliente com demanda ativa." />
            ) : (
              activeClientDemands.map((client) => (
                <article className="overview-list-row" key={client.id}>
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.tasks} tarefa(s) em aberto</span>
                  </div>
                  <b>{client.articles} artigo(s)</b>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function OverviewStrategicView({
  monthlyEvolution,
  onNavigate,
  overview,
  pipelineLeads,
  recentLeads,
}) {
  const maxRevenue = Math.max(...monthlyEvolution.map((month) => month.revenue), 1);

  return (
    <>
      <div className="overview-stats overview-stats--six">
        <OverviewStat label="Receita prevista" value={formatCurrency(overview.expectedRevenue)} helper="Tarefas faturaveis" icon={DollarSign} type="green" onClick={() => onNavigate?.('financeiro')} />
        <OverviewStat label="Receita concluida" value={formatCurrency(overview.completedRevenue)} helper="Concluidas e arquivadas" icon={CheckCircle2} type="blue" onClick={() => onNavigate?.('financeiro')} />
        <OverviewStat label="Receita pendente" value={formatCurrency(overview.pendingRevenue)} helper="Ainda em producao" icon={AlertCircle} type="amber" onClick={() => onNavigate?.('financeiro')} />
        <OverviewStat label="Clientes recorrentes" value={overview.recurringClients} helper="Demanda mensal" icon={UserCheck} type="purple" onClick={() => onNavigate?.('clientes')} />
        <OverviewStat label="Leads em aberto" value={pipelineLeads.length} helper="Funil comercial" icon={TrendingUp} type="slate" onClick={() => onNavigate?.('leads')} />
        <OverviewStat label="Crescimento" value={`${overview.growthRate}%`} helper="Leads vs. mes anterior" icon={Target} type="red" />
      </div>

      <div className="overview-grid overview-grid--balanced">
        <section className="overview-card overview-card--wide">
          <div className="overview-card__header">
            <div>
              <h3>Evolucao mensal</h3>
              <p>Receita prevista por tarefas e entradas de leads.</p>
            </div>
          </div>

          <div className="overview-evolution">
            {monthlyEvolution.map((month) => (
              <article className="overview-evolution-row" key={month.id}>
                <div>
                  <strong>{month.label}</strong>
                  <span>{month.leads} lead(s)</span>
                </div>
                <div className="overview-pipeline-track">
                  <span style={{ width: getBarWidth(month.revenue, maxRevenue) }} />
                </div>
                <b>{formatCurrency(month.revenue)}</b>
              </article>
            ))}
          </div>
        </section>

        <section className="overview-card">
          <div className="overview-card__header">
            <div>
              <h3>Funil comercial</h3>
              <p>Distribuicao atual das oportunidades abertas.</p>
            </div>
          </div>

          <div className="overview-pipeline-bars">
            {overview.stageCounts.map((stage) => (
              <OverviewBarRow
                key={stage.id}
                label={stage.label}
                value={stage.value}
                total={pipelineLeads.length}
              />
            ))}
          </div>
        </section>

        <section className="overview-card">
          <div className="overview-card__header">
            <div>
              <h3>Entradas recentes</h3>
              <p>Ultimos leads recebidos no CRM.</p>
            </div>
          </div>

          <div className="overview-list">
            {recentLeads.length === 0 ? (
              <EmptyOverviewText text="Nenhum lead registrado ainda." />
            ) : (
              recentLeads.map((lead) => (
                <article className="overview-list-row" key={lead.id}>
                  <div>
                    <strong>{lead.nome || lead.empresa || 'Lead sem nome'}</strong>
                    <span>{lead.servico_interesse || lead.origem || 'Origem nao informada'}</span>
                  </div>
                  <b>{formatShortDate(lead.data_entrada)}</b>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function OverviewStat({ label, value, helper, icon: Icon, type, onClick }) {
  function handleKeyDown(event) {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <article
      className={`overview-stat overview-stat--${type} ${onClick ? 'is-clickable' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper && <p>{helper}</p>}
      </div>
      <div className="overview-stat__icon">
        <Icon size={20} />
      </div>
    </article>
  );
}

function OverviewAlert({ icon: Icon, label, value, tone }) {
  return (
    <article className={`overview-alert overview-alert--${tone}`}>
      <div className="overview-alert__icon">
        <Icon size={18} />
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function OverviewBarRow({ label, value, total }) {
  return (
    <div className="overview-pipeline-row">
      <div>
        <strong>{label}</strong>
        <span>{value} registro(s)</span>
      </div>

      <div className="overview-pipeline-track">
        <span style={{ width: getBarWidth(value, total) }} />
      </div>
    </div>
  );
}

function getStageValue(stages, stageId) {
  return stages.find((stage) => stage.id === stageId)?.value || 0;
}

function EmptyOverviewText({ text }) {
  return <p className="overview-empty">{text}</p>;
}

function normalizeTaskStatus(status) {
  if (status === 'aguardando_cliente') return 'enviado_cliente';
  if (status === 'em_andamento' || status === 'atrasado') return 'pendente';

  return status || 'pendente';
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonthReference() {
  return new Date().toISOString().slice(0, 7);
}

function getPreviousMonthReference(monthReference) {
  const [year, month] = String(monthReference).split('-').map(Number);
  const date = new Date(year, month - 2, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getLastMonths(monthReference, count) {
  const [year, month] = String(monthReference).split('-').map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - count + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}

function getMonthFromDate(value) {
  if (!value) return '';

  return String(value).slice(0, 7);
}

function isTaskInMonth(task, monthReference) {
  return (
    task.mes_referencia === monthReference ||
    task.mes_arquivo === monthReference ||
    (!task.mes_referencia && getMonthFromDate(task.data_vencimento) === monthReference)
  );
}

function getBarWidth(value, total) {
  if (!total || !value) return '4%';

  return `${Math.max(Math.round((value / total) * 100), 6)}%`;
}

function getTaskTotal(task) {
  const explicitTotal = getMoneyNumber(task.valor_total);
  if (explicitTotal > 0) return explicitTotal;

  return Number(task.quantidade_artigos || 0) * getMoneyNumber(task.valor_unitario);
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

function formatShortDate(value) {
  if (!value) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function formatCompactMonth(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return monthReference;

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  }).format(new Date(year, month - 1, 1));
}

function formatMonthReferenceLabel(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return monthReference;

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}
