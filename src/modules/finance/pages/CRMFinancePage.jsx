import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  FileText,
  Filter,
  Layers3,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { fetchFinanceTasksByMonth, fetchTasks } from '../../tasks/services/tasksService.js';
import '../styles/finance.css';

const TASK_STATUS_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'enviado_cliente', label: 'Enviado ao Cliente' },
  { value: 'recebido', label: 'A receber' },
  { value: 'concluido', label: 'Concluido' },
  { value: 'arquivada', label: 'Arquivada' },
];

export function CRMFinancePage({ financialAlertSignal = 0 }) {
  const [monthReference, setMonthReference] = useState(getCurrentMonthReference);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [quickFilter, setQuickFilter] = useState('todos');
  const [feedback, setFeedback] = useState('');

  async function loadTasks() {
    try {
      setLoading(true);
      setFeedback('');
      const [monthData, allData] = await Promise.all([
        fetchFinanceTasksByMonth(monthReference),
        fetchTasks(),
      ]);

      setTasks(monthData);
      setAllTasks(allData);
    } catch (error) {
      console.error('Erro ao carregar financeiro por tarefas:', error);
      setFeedback('Nao foi possivel carregar o financeiro do mes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [monthReference]);

  useEffect(() => {
    if (!financialAlertSignal) return;
    setQuickFilter('pendentes');
  }, [financialAlertSignal]);

  const billableTasks = useMemo(() => {
    return tasks.filter((task) => task.faturavel !== false && task.status !== 'cancelado');
  }, [tasks]);

  const allBillableTasks = useMemo(() => {
    return allTasks.filter((task) => task.faturavel !== false && task.status !== 'cancelado');
  }, [allTasks]);

  const stats = useMemo(() => {
    const completedTasks = billableTasks.filter((task) => ['concluido', 'arquivada'].includes(task.status));
    const pendingTasks = billableTasks.filter((task) => !['concluido', 'arquivada'].includes(task.status));
    const expectedRevenue = billableTasks.reduce((total, task) => total + getTaskTotal(task), 0);
    const completedRevenue = completedTasks.reduce((total, task) => total + getTaskTotal(task), 0);
    const pendingRevenue = pendingTasks.reduce((total, task) => total + getTaskTotal(task), 0);
    const articles = billableTasks.reduce((total, task) => total + Number(task.quantidade_artigos || 0), 0);

    return {
      expectedRevenue,
      completedRevenue,
      pendingRevenue,
      billableTasks: billableTasks.length,
      articles,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      averageTicket: billableTasks.length ? expectedRevenue / billableTasks.length : 0,
    };
  }, [billableTasks]);

  const businessAnalysis = useMemo(() => {
    const monthlyEvolution = getMonthlyEvolution(allBillableTasks);
    const serviceBreakdown = getServiceBreakdown(allBillableTasks);
    const bestMonth = getBestBy(monthlyEvolution, 'expectedRevenue');
    const worstMonth = getWorstBy(monthlyEvolution, 'expectedRevenue');
    const mostTasksMonth = getBestBy(monthlyEvolution, 'tasks');
    const fewestTasksMonth = getWorstBy(monthlyEvolution, 'tasks');
    const totalRevenue = monthlyEvolution.reduce((total, month) => total + month.expectedRevenue, 0);
    const completedRevenue = monthlyEvolution.reduce((total, month) => total + month.completedRevenue, 0);
    const totalTasks = monthlyEvolution.reduce((total, month) => total + month.tasks, 0);
    const totalArticles = monthlyEvolution.reduce((total, month) => total + month.articles, 0);

    return {
      monthlyEvolution,
      serviceBreakdown,
      bestMonth,
      worstMonth,
      mostTasksMonth,
      fewestTasksMonth,
      totalRevenue,
      completedRevenue,
      totalTasks,
      totalArticles,
    };
  }, [allBillableTasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return billableTasks.filter((task) => {
      const normalizedStatus = normalizeTaskStatus(task.status);
      const content = [
        task.titulo,
        task.cliente_nome,
        task.responsavel,
        task.mes_referencia,
        task.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalizedSearch || content.includes(normalizedSearch);
      const matchesStatus = statusFilter === 'todos' || normalizedStatus === statusFilter || task.status === statusFilter;
      const matchesQuick =
        quickFilter === 'todos' ||
        (quickFilter === 'concluidas' && ['concluido', 'arquivada'].includes(task.status)) ||
        (quickFilter === 'pendentes' && !['concluido', 'arquivada'].includes(task.status));

      return matchesSearch && matchesStatus && matchesQuick;
    }).sort(sortFinanceTasks);
  }, [billableTasks, searchTerm, statusFilter, quickFilter]);

  function handleClearFilters() {
    setSearchTerm('');
    setStatusFilter('todos');
    setQuickFilter('todos');
  }

  return (
    <section className="finance-page">
      <div className="finance-stats finance-stats--simple">
        <FinanceStat label="Receita prevista" value={formatCurrency(stats.expectedRevenue)} helper="Soma das tarefas faturaveis" icon={DollarSign} type="green" />
        <FinanceStat label="Receita concluida" value={formatCurrency(stats.completedRevenue)} helper={`${stats.completedTasks} tarefa(s) concluidas`} icon={CheckCircle2} type="blue" />
        <FinanceStat
          label="Receita pendente"
          value={formatCurrency(stats.pendingRevenue)}
          helper={`${stats.pendingTasks} tarefa(s) pendentes`}
          icon={AlertTriangle}
          type="amber"
          active={quickFilter === 'pendentes'}
          onClick={() => setQuickFilter((current) => current === 'pendentes' ? 'todos' : 'pendentes')}
        />
        <FinanceStat label="Total historico" value={formatCurrency(businessAnalysis.totalRevenue)} helper={`${businessAnalysis.totalTasks} tarefa(s) faturaveis`} icon={BarChart3} type="purple" />
      </div>

      <section className="finance-card finance-intelligence-card">
        <div className="finance-card__header">
          <div>
            <h3>Analise da agencia</h3>
            <p>Faturamento, servicos e volume operacional sem listar cliente por cliente.</p>
          </div>

          <div className="finance-analysis-summary">
            <span>{businessAnalysis.monthlyEvolution.length} mes(es)</span>
            <strong>{businessAnalysis.totalArticles} artigos</strong>
          </div>
        </div>

        <div className="finance-insight-grid">
          <FinanceInsightCard
            label="Melhor mes"
            value={businessAnalysis.bestMonth ? formatCurrency(businessAnalysis.bestMonth.expectedRevenue) : formatCurrency(0)}
            helper={businessAnalysis.bestMonth ? formatMonthReferenceLabel(businessAnalysis.bestMonth.month) : 'Sem historico'}
            icon={TrendingUp}
            tone="green"
            onClick={businessAnalysis.bestMonth ? () => setMonthReference(businessAnalysis.bestMonth.month) : null}
          />

          <FinanceInsightCard
            label="Menor mes"
            value={businessAnalysis.worstMonth ? formatCurrency(businessAnalysis.worstMonth.expectedRevenue) : formatCurrency(0)}
            helper={businessAnalysis.worstMonth ? formatMonthReferenceLabel(businessAnalysis.worstMonth.month) : 'Sem historico'}
            icon={TrendingDown}
            tone="amber"
            onClick={businessAnalysis.worstMonth ? () => setMonthReference(businessAnalysis.worstMonth.month) : null}
          />

          <FinanceInsightCard
            label="Mais tarefas"
            value={businessAnalysis.mostTasksMonth?.tasks || 0}
            helper={businessAnalysis.mostTasksMonth ? formatMonthReferenceLabel(businessAnalysis.mostTasksMonth.month) : 'Sem historico'}
            icon={CalendarClock}
            tone="blue"
            onClick={businessAnalysis.mostTasksMonth ? () => setMonthReference(businessAnalysis.mostTasksMonth.month) : null}
          />

          <FinanceInsightCard
            label="Menos tarefas"
            value={businessAnalysis.fewestTasksMonth?.tasks || 0}
            helper={businessAnalysis.fewestTasksMonth ? formatMonthReferenceLabel(businessAnalysis.fewestTasksMonth.month) : 'Sem historico'}
            icon={FileText}
            tone="amber"
            onClick={businessAnalysis.fewestTasksMonth ? () => setMonthReference(businessAnalysis.fewestTasksMonth.month) : null}
          />

          <FinanceInsightCard
            label="Ticket medio"
            value={formatCurrency(stats.averageTicket)}
            helper="Media por tarefa no mes"
            icon={DollarSign}
            tone="purple"
          />
        </div>

        <div className="finance-analytics-grid">
          <MonthlyRevenueChart
            months={businessAnalysis.monthlyEvolution}
            selectedMonth={monthReference}
            onSelectMonth={setMonthReference}
          />

          <ServiceBreakdownChart services={businessAnalysis.serviceBreakdown} />
        </div>
      </section>

      <section className="finance-card finance-card--contracts">
        <div className="finance-card__header">
          <div>
            <h3>Direcao e gestao interna</h3>
            <p>Mostrando {filteredTasks.length} de {billableTasks.length} tarefa(s) faturaveis</p>
          </div>

          <div className="finance-toolbar">
            <label className="finance-month-field">
              <span>Mes</span>
              <input
                type="month"
                value={monthReference}
                onChange={(event) => setMonthReference(event.target.value)}
              />
            </label>

            <label className="finance-search">
              <Search size={16} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar tarefa, cliente, responsavel..."
              />
            </label>

            <button type="button" className="finance-tool-button" onClick={() => setFiltersOpen((current) => !current)}>
              <Filter size={16} />
              Filtros
            </button>
          </div>
        </div>

        {feedback && <div className="finance-active-filter"><span>{feedback}</span></div>}

        <div className="finance-due-filters" aria-label="Filtros por situacao">
          <FinanceDueFilterButton label="Todos" active={quickFilter === 'todos'} onClick={() => setQuickFilter('todos')} />
          <FinanceDueFilterButton label="Pendentes" active={quickFilter === 'pendentes'} tone="warning" onClick={() => setQuickFilter((current) => current === 'pendentes' ? 'todos' : 'pendentes')} />
          <FinanceDueFilterButton label="Concluidas" active={quickFilter === 'concluidas'} tone="green" onClick={() => setQuickFilter((current) => current === 'concluidas' ? 'todos' : 'concluidas')} />
        </div>

        <div className="finance-situation-grid finance-situation-grid--compact">
          <FinanceSituationCard label="Tarefas faturaveis" value={stats.billableTasks} icon={CalendarClock} tone="blue" />
          <FinanceSituationCard label="Total de artigos" value={stats.articles} icon={FileText} tone="purple" />
          <FinanceSituationCard label="Concluidas" value={stats.completedTasks} icon={CheckCircle2} tone="green" />
          <FinanceSituationCard label="Pendentes" value={stats.pendingTasks} icon={AlertTriangle} tone="amber" />
        </div>

        {filtersOpen && (
          <div className="finance-filters-panel">
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {TASK_STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <button type="button" className="finance-tool-button" onClick={handleClearFilters}>
              Limpar filtros
            </button>
          </div>
        )}

        <div className="finance-table-scroll">
          <div className="finance-table finance-table--tasks">
            <div className="finance-table__head">
              <span>Tarefa</span>
              <span>Status</span>
              <span>Artigos</span>
              <span>Valor unitario</span>
              <span>Total</span>
              <span>Vencimento</span>
            </div>

            {loading ? (
              <div className="finance-empty">
                <strong>Carregando financeiro...</strong>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="finance-empty">
                <strong>Nenhuma tarefa faturavel encontrada.</strong>
                <p>Gere tarefas recorrentes ou cadastre tarefas faturaveis para este mes.</p>
              </div>
            ) : (
              <div className="finance-table__body">
                {filteredTasks.map((task) => (
                  <FinanceTaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

function FinanceTaskRow({ task }) {
  return (
    <article className="finance-row finance-row--task">
      <div className="finance-row__client">
        <div className="finance-row__avatar">{getInitials(task.cliente_nome || task.titulo)}</div>
        <div>
          <h4>{task.titulo || 'Tarefa sem titulo'}</h4>
          <p>{task.cliente_nome || 'Sem cliente'}</p>
        </div>
      </div>

      <div>
        <span className={`finance-status finance-status--${normalizeTaskStatus(task.status)}`}>
          {getTaskStatusLabel(task.status)}
        </span>
      </div>

      <div className="finance-row__meta">
        <span>{Number(task.quantidade_artigos || 0)}</span>
        <small>Artigos</small>
      </div>

      <div className="finance-row__meta is-money">
        <span>{formatCurrency(task.valor_unitario)}</span>
        <small>Unitario</small>
      </div>

      <div className="finance-row__meta is-money">
        <span>{formatCurrency(getTaskTotal(task))}</span>
        <small>Total</small>
      </div>

      <div className="finance-row__due">
        <CalendarClock size={15} />
        <span>{formatDate(task.data_vencimento)}</span>
      </div>
    </article>
  );
}

function FinanceStat({ label, value, helper, icon: Icon, type, active = false, onClick }) {
  function handleKeyDown(event) {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <article
      className={`finance-stat finance-stat--${type} ${active ? 'is-active' : ''} ${onClick ? 'is-clickable' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? active : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{helper}</p>
      </div>
      <div className="finance-stat__icon">
        <Icon size={20} />
      </div>
    </article>
  );
}

function FinanceDueFilterButton({ label, active = false, tone = 'neutral', onClick }) {
  return (
    <button
      className={`finance-due-filter finance-due-filter--${tone} ${active ? 'is-active' : ''}`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function FinanceSituationCard({ label, value, icon: Icon, tone }) {
  return (
    <div className={`finance-situation-card finance-situation-card--${tone}`}>
      <span><Icon size={16} /></span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function FinanceInsightCard({ label, value, helper, icon: Icon, tone, onClick }) {
  return (
    <button
      type="button"
      className={`finance-insight-card finance-insight-card--${tone} ${onClick ? 'is-clickable' : ''}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <span><Icon size={16} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{helper}</em>
      </div>
    </button>
  );
}

function MonthlyRevenueChart({ months, selectedMonth, onSelectMonth }) {
  const visibleMonths = months.slice(-12);
  const maxRevenue = Math.max(...visibleMonths.map((month) => month.expectedRevenue), 1);

  return (
    <section className="finance-chart-card">
      <div className="finance-chart-card__header">
        <div>
          <h4>Faturamento por mes</h4>
          <p>Previsto e concluido por tarefas faturaveis.</p>
        </div>
        <BarChart3 size={18} />
      </div>

      {visibleMonths.length === 0 ? (
        <div className="finance-empty is-small">Sem historico financeiro ainda.</div>
      ) : (
        <div className="finance-month-chart">
          {visibleMonths.map((month) => {
            const expectedWidth = getPercent(month.expectedRevenue, maxRevenue);
            const completedWidth = getPercent(month.completedRevenue, maxRevenue);

            return (
              <button
                type="button"
                key={month.month}
                className={`finance-month-bar ${selectedMonth === month.month ? 'is-active' : ''}`}
                onClick={() => onSelectMonth(month.month)}
              >
                <span>{formatShortMonthReference(month.month)}</span>
                <div className="finance-month-bar__track">
                  <i style={{ width: `${expectedWidth}%` }} />
                  <b style={{ width: `${completedWidth}%` }} />
                </div>
                <strong>{formatCurrency(month.expectedRevenue)}</strong>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ServiceBreakdownChart({ services }) {
  const visibleServices = services.slice(0, 6);
  const maxRevenue = Math.max(...visibleServices.map((service) => service.revenue), 1);

  return (
    <section className="finance-chart-card">
      <div className="finance-chart-card__header">
        <div>
          <h4>Receita por servico</h4>
          <p>Distribuicao por tipo de entrega cadastrada.</p>
        </div>
        <Layers3 size={18} />
      </div>

      {visibleServices.length === 0 ? (
        <div className="finance-empty is-small">Nenhum servico faturavel encontrado.</div>
      ) : (
        <div className="finance-service-chart">
          {visibleServices.map((service) => (
            <div className="finance-service-row" key={service.label}>
              <div>
                <strong>{service.label}</strong>
                <span>{service.tasks} tarefa(s) - {service.articles} artigo(s)</span>
              </div>
              <div className="finance-service-row__bar">
                <i style={{ width: `${getPercent(service.revenue, maxRevenue)}%` }} />
              </div>
              <b>{formatCurrency(service.revenue)}</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function getTaskTotal(task) {
  const explicitTotal = getMoneyNumber(task.valor_total);
  if (explicitTotal > 0) return explicitTotal;

  return Number(task.quantidade_artigos || 0) * getMoneyNumber(task.valor_unitario);
}

function getMonthlyEvolution(tasks) {
  const grouped = tasks.reduce((acc, task) => {
    const month = getTaskMonthReference(task);

    if (!month) return acc;

    if (!acc.has(month)) {
      acc.set(month, {
        month,
        expectedRevenue: 0,
        completedRevenue: 0,
        pendingRevenue: 0,
        tasks: 0,
        articles: 0,
      });
    }

    const current = acc.get(month);
    const value = getTaskTotal(task);
    const isCompleted = ['concluido', 'arquivada'].includes(task.status);

    current.expectedRevenue += value;
    current.completedRevenue += isCompleted ? value : 0;
    current.pendingRevenue += isCompleted ? 0 : value;
    current.tasks += 1;
    current.articles += Number(task.quantidade_artigos || 0);

    return acc;
  }, new Map());

  return Array.from(grouped.values()).sort((first, second) => first.month.localeCompare(second.month));
}

function getServiceBreakdown(tasks) {
  const grouped = tasks.reduce((acc, task) => {
    const label = getTaskServiceLabel(task);

    if (!acc.has(label)) {
      acc.set(label, {
        label,
        revenue: 0,
        tasks: 0,
        articles: 0,
      });
    }

    const current = acc.get(label);
    current.revenue += getTaskTotal(task);
    current.tasks += 1;
    current.articles += Number(task.quantidade_artigos || 0);

    return acc;
  }, new Map());

  return Array.from(grouped.values()).sort((first, second) => second.revenue - first.revenue);
}

function getTaskMonthReference(task) {
  return (
    task.mes_referencia ||
    task.mes_arquivo ||
    getMonthReferenceFromDate(task.data_vencimento) ||
    getMonthReferenceFromDate(task.criado_em)
  );
}

function getTaskServiceLabel(task) {
  const rawType = String(task.tipo || task.categoria || 'servico').trim();
  const labels = {
    artigo: 'Artigos',
    conteudo: 'Conteudo',
    post: 'Posts',
    relatorio: 'Relatorios',
    reuniao: 'Reunioes',
    aprovacao: 'Aprovacoes',
    ajuste: 'Ajustes',
    tarefa: 'Tarefas',
    mensalidade: 'Mensalidades',
    cobranca: 'Cobrancas',
    pagamento: 'Pagamentos',
  };

  return labels[rawType] || capitalizeLabel(rawType);
}

function getBestBy(items, key) {
  return items.reduce((best, item) => {
    if (!best || item[key] > best[key]) return item;
    return best;
  }, null);
}

function getWorstBy(items, key) {
  return items.reduce((worst, item) => {
    if (!worst || item[key] < worst[key]) return item;
    return worst;
  }, null);
}

function getPercent(value, maxValue) {
  if (!maxValue) return 0;

  return Math.max(4, Math.min(100, (Number(value || 0) / maxValue) * 100));
}

function getMonthReferenceFromDate(value) {
  if (!value) return '';

  return String(value).slice(0, 7);
}

function sortFinanceTasks(firstTask, secondTask) {
  const firstDate = firstTask.data_vencimento || '9999-12-31';
  const secondDate = secondTask.data_vencimento || '9999-12-31';

  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate);
  }

  return String(firstTask.titulo || '').localeCompare(String(secondTask.titulo || ''), 'pt-BR');
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
  };

  return labels[status] || labels[normalizeTaskStatus(status)] || 'Pendente';
}

function getCurrentMonthReference() {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthReferenceLabel(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return monthReference || 'Sem mes';

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

function formatShortMonthReference(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return monthReference || 'Mes';

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
  }).format(new Date(year, month - 1, 1));
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

function formatDate(value) {
  if (!value) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`));
}

function capitalizeLabel(value) {
  return String(value || 'Servico')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(value) {
  if (!value) return 'T';

  return String(value)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
