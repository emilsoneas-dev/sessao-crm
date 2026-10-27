import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  LayoutGrid,
  List,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  archiveCompletedTasksByMonth,
  cancelTask,
  completeTask,
  createTask,
  createRecurringArticleTasks,
  deleteTask,
  fetchTasks,
  reopenTask,
  updateTask,
  updateTaskStatus,
} from '../services/tasksService.js';
import '../styles/tasks.css';

const TASK_TYPES = [
  { value: 'tarefa', label: 'Tarefa' },
  { value: 'mensalidade', label: 'Mensalidade' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'post', label: 'Post' },
  { value: 'relatorio', label: 'Relatorio' },
  { value: 'reuniao', label: 'Reuniao' },
  { value: 'aprovacao', label: 'Aprovacao' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'ligacao', label: 'Ligacao' },
];

const TASK_STATUS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'feito', label: 'Feito' },
  { value: 'enviado_cliente', label: 'Enviado ao Cliente' },
  { value: 'recebido', label: 'A receber' },
  { value: 'concluido', label: 'Concluido' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'arquivada', label: 'Arquivada' },
];

const TASK_PRIORITIES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

const TASK_BOARD_COLUMNS = [
  { value: 'pendente', label: 'Pendente', helper: 'Aguardando envio' },
  { value: 'feito', label: 'Feitos', helper: 'Pronto para enviar' },
  { value: 'enviado_cliente', label: 'Enviado ao Cliente', helper: 'Com o cliente' },
  { value: 'recebido', label: 'A receber', helper: 'Cliente retornou' },
  { value: 'concluido', label: 'Concluido', helper: 'Pronto para arquivar' },
];

const CLIENT_DOCUMENT_LINK_FIELDS = [
  'documento_url',
  'conteudos_url',
  'drive_url',
  'briefing_url',
  'estrategia_url',
  'tarefas_url',
  'relatorios_url',
];

const FINANCIAL_ALLOWED_ROLES = ['dono', 'gestor'];
const TASKS_VIEW_MODE_STORAGE_KEY = 'crm_tasks_view_mode';

export function CRMTasksPage({ clients = [], crmUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTask, setSavingTask] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [archivingMonth, setArchivingMonth] = useState(false);
  const [archiveMonth, setArchiveMonth] = useState(getCurrentMonthReference);
  const [calendarMonth, setCalendarMonth] = useState(getCurrentMonthReference);
  const [openArchiveMonth, setOpenArchiveMonth] = useState('');
  const [recurringDraft, setRecurringDraft] = useState(() => ({
    mes_referencia: getNextMonthReference(),
    data_vencimento: `${getNextMonthReference()}-10`,
    responsavel: crmUser?.nome || '',
  }));
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'list';

    return window.localStorage.getItem(TASKS_VIEW_MODE_STORAGE_KEY) || 'list';
  });
  const [filters, setFilters] = useState({
    status: 'todos',
    tipo: 'todos',
    prioridade: 'todas',
    periodo: 'todos',
    responsavel: 'todos',
  });

  const userRole = crmUser?.papel || 'funcionario';
  const canSeeFinancials = FINANCIAL_ALLOWED_ROLES.includes(userRole);

  async function loadTasks() {
    try {
      setLoading(true);
      setFeedback('');

      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setFeedback('Nao foi possivel carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(TASKS_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const archivedTasks = useMemo(() => {
    return tasks.filter((task) => task.status === 'arquivada');
  }, [tasks]);

  const archivedMonths = useMemo(() => {
    const months = archivedTasks
      .map((task) => task.mes_arquivo || task.mes_referencia || getMonthReferenceFromDate(task.data_conclusao || task.data_vencimento))
      .filter(Boolean);

    return Array.from(new Set(months)).sort((a, b) => b.localeCompare(a));
  }, [archivedTasks]);

  const openArchiveTasks = useMemo(() => {
    if (!openArchiveMonth) return [];

    return archivedTasks.filter((task) => {
      const month = task.mes_arquivo || task.mes_referencia || getMonthReferenceFromDate(task.data_conclusao || task.data_vencimento);
      return month === openArchiveMonth;
    });
  }, [archivedTasks, openArchiveMonth]);

  const stats = useMemo(() => {
    const today = getTodayDate();
    const sevenDaysFromNow = addDays(today, 7);

    const operationalTasks = tasks.filter((task) => !['cancelado', 'arquivada'].includes(task.status));

    return {
      overdue: operationalTasks.filter((task) => isTaskOverdue(task)).length,
      today: operationalTasks.filter((task) => task.data_vencimento === today).length,
      nextSevenDays: operationalTasks.filter((task) => {
        return (
          task.data_vencimento &&
          task.data_vencimento > today &&
          task.data_vencimento <= sevenDaysFromNow
        );
      }).length,
      sentClient: operationalTasks.filter((task) => getTaskWorkflowStatus(task) === 'enviado_cliente').length,
      received: operationalTasks.filter((task) => getTaskWorkflowStatus(task) === 'recebido').length,
      concluded: operationalTasks.filter((task) => getTaskWorkflowStatus(task) === 'concluido').length,
    };
  }, [tasks]);

  const operationalSummary = useMemo(() => {
    const currentMonth = getCurrentMonthReference();
    const operationalTasks = tasks.filter((task) => !['cancelado', 'arquivada'].includes(task.status));
    const recurringTaskTemplates = tasks.filter(isRecurringMonthlyTaskTemplate);
    const recurringTaskTemplatesReady = recurringTaskTemplates.filter((task) => Boolean(task.proxima_recorrencia));
    const recurringTaskTemplatesToAdjust = recurringTaskTemplates.filter((task) => !task.proxima_recorrencia);

    return {
      pendingTasks: operationalTasks.filter((task) => getTaskWorkflowStatus(task) === 'pendente').length,
      monthArticles: operationalTasks
        .filter((task) => isTaskInMonth(task, currentMonth))
        .reduce((total, task) => total + Number(task.quantidade_artigos || 0), 0),
      recurringReady: recurringTaskTemplatesReady.length,
      recurringToAdjust: recurringTaskTemplatesToAdjust.length,
    };
  }, [tasks]);

  const availableResponsibles = useMemo(() => {
    const responsibles = tasks
      .map((task) => task.responsavel)
      .filter(Boolean);

    return Array.from(new Set(responsibles)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const today = getTodayDate();
    const sevenDaysFromNow = addDays(today, 7);

    return tasks.filter((task) => {
      const content = [
        task.titulo,
        task.descricao,
        task.cliente_nome,
        task.tipo,
        task.status,
        task.prioridade,
        task.responsavel,
        task.mes_referencia,
        task.quantidade_artigos,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalizedSearch || content.includes(normalizedSearch);

      const workflowStatus = getTaskWorkflowStatus(task);
      const matchesStatus =
        filters.status === 'todos'
          ? !['cancelado', 'arquivada'].includes(task.status)
          : filters.status === workflowStatus || filters.status === task.status;

      const matchesType =
        filters.tipo === 'todos' || task.tipo === filters.tipo;

      const matchesPriority =
        filters.prioridade === 'todas' || task.prioridade === filters.prioridade;

      const matchesResponsible =
        filters.responsavel === 'todos' || task.responsavel === filters.responsavel;

      const matchesPeriod =
        filters.periodo === 'todos' ||
        (filters.periodo === 'atrasadas' &&
          task.data_vencimento &&
          task.data_vencimento < today &&
          !['concluido', 'cancelado', 'arquivada'].includes(task.status)) ||
        (filters.periodo === 'hoje' && task.data_vencimento === today) ||
        (filters.periodo === 'proximos_7_dias' &&
          task.data_vencimento &&
          task.data_vencimento >= today &&
          task.data_vencimento <= sevenDaysFromNow) ||
        (filters.periodo === 'sem_data' && !task.data_vencimento);

      const canShowFinancialTask = canSeeFinancials || task.tipo !== 'mensalidade';

      return (
        canShowFinancialTask &&
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesPriority &&
        matchesResponsible &&
        matchesPeriod
      );
    }).sort(sortTasksByAttention);
  }, [tasks, searchTerm, filters, canSeeFinancials]);

  const boardColumns = useMemo(() => {
    return TASK_BOARD_COLUMNS.map((column) => ({
      ...column,
      tasks: filteredTasks.filter((task) => getTaskBoardColumn(task) === column.value),
    }));
  }, [filteredTasks]);
  const canShowBoardView = viewMode === 'board' && !['cancelado', 'arquivada'].includes(filters.status);

  function createBlankTask() {
    return {
      id: null,
      cliente_id: '',
      cliente_nome: '',
      titulo: '',
      descricao: '',
      tipo: 'tarefa',
      categoria: 'operacional',
      status: 'pendente',
      prioridade: 'normal',
      data_vencimento: getTodayDate(),
      hora_vencimento: '',
      data_inicio: '',
      responsavel: crmUser?.nome || '',
      responsavel_email: crmUser?.email || '',
      criado_por: crmUser?.nome || '',
      criado_por_email: crmUser?.email || '',
      recorrente: false,
      recorrencia: '',
      mes_referencia: getCurrentMonthReference(),
      quantidade_artigos: '',
      valor_unitario: '',
      valor_total: '',
      faturavel: true,
      valor_previsto: '',
      valor_pago: '',
      link_referencia: '',
      observacoes: '',
      isNewTask: true,
    };
  }

  function createEditableTask(task) {
    return {
      ...task,
      cliente_id: task.cliente_id || '',
      cliente_nome: task.cliente_nome || '',
      titulo: task.titulo || '',
      descricao: task.descricao || '',
      tipo: task.tipo || 'tarefa',
      categoria: task.categoria || 'operacional',
      status: normalizeTaskStatus(task.status),
      prioridade: task.prioridade || 'normal',
      data_vencimento: task.data_vencimento || '',
      hora_vencimento: task.hora_vencimento || '',
      data_inicio: task.data_inicio || '',
      responsavel: task.responsavel || '',
      responsavel_email: task.responsavel_email || '',
      recorrente: Boolean(task.recorrente),
      recorrencia: task.recorrencia || '',
      mes_referencia: task.mes_referencia || '',
      quantidade_artigos: task.quantidade_artigos ?? '',
      valor_unitario: task.valor_unitario ?? '',
      valor_total: task.valor_total ?? '',
      faturavel: task.faturavel !== false,
      valor_previsto: task.valor_previsto ?? '',
      valor_pago: task.valor_pago ?? '',
      link_referencia: task.link_referencia || '',
      observacoes: task.observacoes || '',
      isNewTask: false,
    };
  }

  function handleOpenNewTask() {
    setFeedback('');
    setEditingTask(createBlankTask());
    setTaskModalOpen(true);
  }

  function handleOpenEditTask(task) {
    setFeedback('');
    setEditingTask(createEditableTask(task));
    setTaskModalOpen(true);
  }

  function handleCloseTaskModal() {
    if (savingTask) return;

    setTaskModalOpen(false);
    setEditingTask(null);
    setFeedback('');
  }

  function handleChangeTask(field, value) {
    setEditingTask((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleChangeClient(clientId) {
    const client = clients.find((item) => item.id === clientId);

    setEditingTask((current) => ({
      ...current,
      cliente_id: clientId,
      cliente_nome: client?.nome || client?.empresa || '',
    }));
  }

  async function handleSaveTask() {
    if (!editingTask) return;

    if (!String(editingTask.titulo || '').trim()) {
      setFeedback('Informe o titulo da tarefa.');
      return;
    }

    try {
      setSavingTask(true);
      setFeedback('');

      let savedTask;

      if (editingTask.isNewTask) {
        savedTask = await createTask(editingTask);
        setFeedback('Tarefa criada com sucesso.');
      } else {
        savedTask = await updateTask(editingTask.id, editingTask);
        setFeedback('Tarefa atualizada com sucesso.');
      }

      if (savedTask) {
        setEditingTask(createEditableTask(savedTask));
      }

      await loadTasks();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      setFeedback(error?.message || 'Nao foi possivel salvar a tarefa.');
    } finally {
      setSavingTask(false);
    }
  }

  async function handleCompleteTask(task) {
    try {
      setFeedback('');
      await completeTask(task.id);
      await loadTasks();
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      setFeedback('Nao foi possivel concluir a tarefa.');
    }
  }

  async function handleReopenTask(task) {
    try {
      setFeedback('');
      await reopenTask(task.id);
      await loadTasks();
    } catch (error) {
      console.error('Erro ao reabrir tarefa:', error);
      setFeedback('Nao foi possivel reabrir a tarefa.');
    }
  }

  async function handleCancelTask(task) {
    if (!task?.id || task.status === 'cancelado') return;

    const shouldCancel = window.confirm(
      `Cancelar a tarefa "${task.titulo || 'sem titulo'}"? Ela nao entrara no financeiro.`
    );

    if (!shouldCancel) return;

    try {
      setFeedback('');
      await cancelTask(task.id);
      await loadTasks();
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Erro ao cancelar tarefa:', error);
      setFeedback('Nao foi possivel cancelar a tarefa.');
    }
  }

  async function handleMoveTaskStatus(task, status) {
    if (!task?.id || !status || task.status === status) return;

    try {
      setFeedback('');

      if (status === 'concluido') {
        await completeTask(task.id);
      } else {
        await updateTaskStatus(task.id, status);
      }

      await loadTasks();
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      setFeedback('Nao foi possivel atualizar o status da tarefa.');
    }
  }

  function handleDragStartTask(event, task) {
    setDraggingTaskId(task.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(task.id));
  }

  function handleDragEndTask() {
    setDraggingTaskId(null);
    setDragOverColumn('');
  }

  function handleDragOverColumn(event, status) {
    if (!canDropInTaskColumn(status)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }

  function handleDragLeaveColumn() {
    setDragOverColumn('');
  }

  async function handleDropTask(event, status) {
    event.preventDefault();
    setDragOverColumn('');

    if (!canDropInTaskColumn(status)) return;

    const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId;
    const task = tasks.find((item) => String(item.id) === String(taskId));

    await handleMoveTaskStatus(task, status);
    setDraggingTaskId(null);
  }

  async function handleArchiveCompletedMonth() {
    if (!archiveMonth) {
      setFeedback('Selecione o mes para arquivar.');
      return;
    }

    const shouldArchive = window.confirm(
      `Arquivar tarefas concluidas de ${formatMonthReferenceLabel(archiveMonth)}? Elas sairao do Kanban, mas continuarao no historico.`
    );

    if (!shouldArchive) return;

    try {
      setArchivingMonth(true);
      setFeedback('');
      const archived = await archiveCompletedTasksByMonth(archiveMonth);
      setOpenArchiveMonth(archiveMonth);
      await loadTasks();
      setFeedback(`${archived.length} tarefa(s) arquivada(s).`);
    } catch (error) {
      console.error('Erro ao arquivar tarefas:', error);
      setFeedback('Nao foi possivel arquivar as tarefas concluidas.');
    } finally {
      setArchivingMonth(false);
    }
  }

  async function handleGenerateRecurringTasks() {
    if (!recurringDraft.mes_referencia) {
      setFeedback('Informe o mes de referencia.');
      return;
    }

    try {
      setSavingRecurring(true);
      setFeedback('');
      const result = await createRecurringArticleTasks({
        monthReference: recurringDraft.mes_referencia,
        responsible: recurringDraft.responsavel,
      });

      await loadTasks();
      setRecurringModalOpen(false);
      setFeedback(
        `${result.found} recorrente(s) encontrada(s). ${result.eligible} do mes selecionado. ` +
        `${result.created.length} gerada(s). ${result.skipped.length} ignorada(s) por duplicidade.`
      );
    } catch (error) {
      console.error('Erro ao gerar tarefas recorrentes:', error);
      setFeedback(error?.message || 'Nao foi possivel gerar tarefas recorrentes.');
    } finally {
      setSavingRecurring(false);
    }
  }

  async function handleDeleteTask(task) {
    const shouldDelete = window.confirm(
      'Tem certeza que deseja excluir esta tarefa? Essa acao nao pode ser desfeita.'
    );

    if (!shouldDelete) return;

    try {
      setFeedback('');
      await deleteTask(task.id);
      await loadTasks();
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      setFeedback('Nao foi possivel excluir a tarefa.');
    }
  }

  function handleClearFilters() {
    setFilters({
      status: 'todos',
      tipo: 'todos',
      prioridade: 'todas',
      periodo: 'todos',
      responsavel: 'todos',
    });
  }

  function handleFilterPeriod(periodo) {
    setFilters((current) => ({
      ...current,
      periodo: current.periodo === periodo ? 'todos' : periodo,
    }));
  }

  function handleFilterStatus(status) {
    setFilters((current) => ({
      ...current,
      status: current.status === status ? 'todos' : status,
    }));
  }

  return (
    <section className="tasks-page">
      <div className="tasks-stats">
        <TaskStatCard
          label="Atrasadas"
          value={stats.overdue}
          icon={AlertCircle}
          type="red"
          active={filters.periodo === 'atrasadas'}
          onClick={() => handleFilterPeriod('atrasadas')}
        />

        <TaskStatCard
          label="Hoje"
          value={stats.today}
          icon={Clock3}
          type="blue"
          active={filters.periodo === 'hoje'}
          onClick={() => handleFilterPeriod('hoje')}
        />

        <TaskStatCard
          label="Esta semana"
          value={stats.nextSevenDays}
          icon={CalendarClock}
          type="green"
          active={filters.periodo === 'proximos_7_dias'}
          onClick={() => handleFilterPeriod('proximos_7_dias')}
        />

        <TaskStatCard
          label="Enviadas"
          value={stats.sentClient}
          icon={MessageCircle}
          type="purple"
          active={filters.status === 'enviado_cliente'}
          onClick={() => handleFilterStatus('enviado_cliente')}
        />
      </div>

      <section className="tasks-card">
        <div className="tasks-card__header">
          <div className="tasks-card-summary">
            <strong>{filteredTasks.length}</strong>
            <span>de {tasks.length} tarefas exibidas</span>
          </div>

          <div className="tasks-toolbar">
            <div className="tasks-view-toggle" aria-label="Alternar visualizacao de tarefas">
              <button
                type="button"
                className={viewMode === 'list' ? 'is-active' : ''}
                onClick={() => setViewMode('list')}
              >
                <List size={15} />
                Lista
              </button>

              <button
                type="button"
                className={viewMode === 'board' ? 'is-active' : ''}
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid size={15} />
                Quadro
              </button>

              <button
                type="button"
                className={viewMode === 'calendar' ? 'is-active' : ''}
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays size={15} />
                Calendario
              </button>
            </div>

            <label className="tasks-search">
              <Search size={16} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar tarefa, cliente, responsavel..."
              />
            </label>

            <button
              className="tasks-tool-button"
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <Filter size={16} />
              Filtros
            </button>

            <button
              className="tasks-tool-button"
              type="button"
              onClick={loadTasks}
            >
              <RefreshCw size={16} />
              Atualizar
            </button>

            <button
              className="tasks-tool-button"
              type="button"
              onClick={() => setRecurringModalOpen(true)}
            >
              <CalendarClock size={16} />
              Gerar recorrentes
            </button>

            <button
              className="tasks-primary-button"
              type="button"
              onClick={handleOpenNewTask}
            >
              <Plus size={16} />
              Nova tarefa
            </button>
          </div>
        </div>

        <div className="tasks-operational-strip">
          <button type="button" className="tasks-operational-metric" onClick={() => handleFilterStatus('pendente')}>
            <strong>{operationalSummary.pendingTasks}</strong>
            <span>Pendentes</span>
          </button>

          <div className="tasks-operational-metric">
            <strong>{operationalSummary.monthArticles}</strong>
            <span>Artigos/mes</span>
          </div>

          <button type="button" className="tasks-operational-metric" onClick={() => setRecurringModalOpen(true)}>
            <strong>{operationalSummary.recurringReady}</strong>
            <span>Recorrentes prontos</span>
          </button>

          <button type="button" className="tasks-operational-metric is-warning" onClick={() => setRecurringModalOpen(true)}>
            <strong>{operationalSummary.recurringToAdjust}</strong>
            <span>Sem proxima data</span>
          </button>
        </div>

        {filtersOpen && (
          <div className="tasks-filters-panel">
            <label>
              <span>Status</span>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="todos">Todos</option>
                {TASK_STATUS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Tipo</span>
              <select
                value={filters.tipo}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    tipo: event.target.value,
                  }))
                }
              >
                <option value="todos">Todos</option>
                {TASK_TYPES
                  .filter((type) => canSeeFinancials || type.value !== 'mensalidade')
                  .map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              <span>Prioridade</span>
              <select
                value={filters.prioridade}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    prioridade: event.target.value,
                  }))
                }
              >
                <option value="todas">Todas</option>
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Responsavel</span>
              <select
                value={filters.responsavel}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    responsavel: event.target.value,
                  }))
                }
              >
                <option value="todos">Todos</option>
                {availableResponsibles.map((responsible) => (
                  <option key={responsible} value={responsible}>
                    {responsible}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Periodo</span>
              <select
                value={filters.periodo}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    periodo: event.target.value,
                  }))
                }
              >
                <option value="todos">Todos</option>
                <option value="atrasadas">Atrasadas</option>
                <option value="hoje">Hoje</option>
                <option value="proximos_7_dias">Esta semana</option>
                <option value="sem_data">Sem data</option>
              </select>
            </label>

            <button
              type="button"
              className="tasks-tool-button"
              onClick={handleClearFilters}
            >
              Limpar filtros
            </button>
          </div>
        )}

        {feedback && (
          <div className="tasks-feedback">
            {feedback}
          </div>
        )}

        {loading ? (
          <div className="tasks-empty">
            <strong>Carregando tarefas...</strong>
          </div>
        ) : filteredTasks.length === 0 && viewMode !== 'calendar' ? (
          <div className="tasks-empty">
            <strong>Nenhuma tarefa encontrada.</strong>
            <p>Crie uma nova tarefa, entrega, cobranca ou reuniao para comecar.</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <TaskCalendar
            tasks={filteredTasks}
            monthReference={calendarMonth}
            canSeeFinancials={canSeeFinancials}
            onChangeMonth={setCalendarMonth}
            onEdit={handleOpenEditTask}
          />
        ) : canShowBoardView ? (
          <TaskBoard
            columns={boardColumns}
            clients={clients}
            canSeeFinancials={canSeeFinancials}
            draggingTaskId={draggingTaskId}
            dragOverColumn={dragOverColumn}
            onEdit={handleOpenEditTask}
            onComplete={handleCompleteTask}
            onReopen={handleReopenTask}
            onMoveStatus={handleMoveTaskStatus}
            onDragStart={handleDragStartTask}
            onDragEnd={handleDragEndTask}
            onDragOverColumn={handleDragOverColumn}
            onDragLeaveColumn={handleDragLeaveColumn}
            onDropTask={handleDropTask}
          />
        ) : (
          <TaskTable
            tasks={filteredTasks}
            canSeeFinancials={canSeeFinancials}
            onEdit={handleOpenEditTask}
            onComplete={handleCompleteTask}
            onReopen={handleReopenTask}
            onDelete={handleDeleteTask}
          />
        )}
      </section>

      {taskModalOpen && editingTask && (
        <TaskModal
          task={editingTask}
          clients={clients}
          saving={savingTask}
          feedback={feedback}
          canSeeFinancials={canSeeFinancials}
          onChange={handleChangeTask}
          onChangeClient={handleChangeClient}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          onCancelTask={handleCancelTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      <TaskArchivePanel
        archiveMonth={archiveMonth}
        archivedMonths={archivedMonths}
        openArchiveMonth={openArchiveMonth}
        openArchiveTasks={openArchiveTasks}
        archiving={archivingMonth}
        onChangeArchiveMonth={setArchiveMonth}
        onArchiveCompletedMonth={handleArchiveCompletedMonth}
        onOpenArchiveMonth={setOpenArchiveMonth}
        onEdit={handleOpenEditTask}
      />

      {recurringModalOpen && (
        <RecurringTasksModal
          draft={recurringDraft}
          tasks={tasks}
          saving={savingRecurring}
          onChange={(field, value) => setRecurringDraft((current) => ({
            ...current,
            [field]: value,
            ...(field === 'mes_referencia' && value ? { data_vencimento: `${value}-10` } : {}),
          }))}
          onClose={() => setRecurringModalOpen(false)}
          onGenerate={handleGenerateRecurringTasks}
        />
      )}
    </section>
  );
}

function TaskCalendar({
  tasks,
  monthReference,
  canSeeFinancials,
  onChangeMonth,
  onEdit,
}) {
  const days = useMemo(() => getCalendarDays(monthReference, tasks), [monthReference, tasks]);
  const monthTasks = tasks.filter((task) => getMonthReferenceFromDate(task.data_vencimento) === monthReference);
  const withoutDate = tasks.filter((task) => !task.data_vencimento);
  const overdue = monthTasks.filter(isTaskOverdue);

  return (
    <div className="tasks-calendar">
      <header className="tasks-calendar__header">
        <div>
          <h4>{formatMonthReferenceLabel(monthReference)}</h4>
          <p>
            {monthTasks.length} tarefa(s) no mes
            {overdue.length > 0 ? ` - ${overdue.length} vencida(s)` : ''}
          </p>
        </div>

        <div className="tasks-calendar__controls">
          <button
            type="button"
            onClick={() => onChangeMonth(addMonthsToMonthReference(monthReference, -1))}
            title="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => onChangeMonth(getCurrentMonthReference())}
          >
            Mes atual
          </button>

          <button
            type="button"
            onClick={() => onChangeMonth(addMonthsToMonthReference(monthReference, 1))}
            title="Proximo mes"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="tasks-calendar__scroller">
        <div className="tasks-calendar__weekdays">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="tasks-calendar__grid">
          {days.map((day) => (
            <article
              key={day.dateKey}
              className={`tasks-calendar-day ${day.isCurrentMonth ? '' : 'is-muted'} ${day.isToday ? 'is-today' : ''} ${day.hasOverdue ? 'has-overdue' : ''}`}
            >
              <header>
                <span>{day.date.getDate()}</span>
                {day.tasks.length > 0 && <small>{day.tasks.length}</small>}
              </header>

              <div className="tasks-calendar-day__body">
                {day.tasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`tasks-calendar-task task-calendar-status-${isTaskOverdue(task) ? 'atrasado' : getTaskWorkflowStatus(task)}`}
                    onClick={() => onEdit(task)}
                    title={task.titulo || 'Tarefa sem titulo'}
                  >
                    <strong>{task.titulo || 'Tarefa sem titulo'}</strong>
                    <span>{task.cliente_nome || task.responsavel || getTaskStatusLabel(getTaskWorkflowStatus(task))}</span>
                    {canSeeFinancials && getTaskBillingValue(task) > 0 && (
                      <em>{formatCurrency(getTaskBillingValue(task))}</em>
                    )}
                  </button>
                ))}

                {day.tasks.length > 3 && (
                  <button
                    type="button"
                    className="tasks-calendar-more"
                    onClick={() => onEdit(day.tasks[3])}
                  >
                    +{day.tasks.length - 3} tarefa(s)
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {withoutDate.length > 0 && (
        <div className="tasks-calendar-undated">
          <strong>Sem data</strong>
          <span>{withoutDate.length} tarefa(s) filtrada(s) sem vencimento definido.</span>
        </div>
      )}
    </div>
  );
}

function TaskStatCard({ label, value, icon: Icon, type, active = false, onClick }) {
  function handleKeyDown(event) {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <article
      className={`task-stat-card task-stat-card--${type} ${active ? 'is-active' : ''} ${onClick ? 'is-clickable' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? active : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="task-stat-card__icon">
        <Icon size={20} />
      </div>
    </article>
  );
}

function TaskTable({
  tasks,
  canSeeFinancials,
  onEdit,
  onComplete,
  onReopen,
  onDelete,
}) {
  return (
    <div className="tasks-table-scroll">
      <div className={`tasks-table-inner ${canSeeFinancials ? '' : 'is-financial-hidden'}`}>
        <div className="tasks-table-head">
          <span>Tarefa</span>
          <span>Cliente</span>
          <span>Tipo</span>
          <span>Status</span>
          <span>Prioridade</span>
          <span>Vencimento</span>
          <span>Responsavel</span>
          {canSeeFinancials && <span>Valor</span>}
          <span>Acoes</span>
        </div>

        <div className="tasks-list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              canSeeFinancials={canSeeFinancials}
              onEdit={onEdit}
              onComplete={onComplete}
              onReopen={onReopen}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskBoard({
  columns,
  clients,
  canSeeFinancials,
  draggingTaskId,
  dragOverColumn,
  onEdit,
  onComplete,
  onReopen,
  onMoveStatus,
  onDragStart,
  onDragEnd,
  onDragOverColumn,
  onDragLeaveColumn,
  onDropTask,
}) {
  return (
    <div className="tasks-board-scroll">
      <div className="tasks-board">
        {columns.map((column) => {
          const canDrop = canDropInTaskColumn(column.value);
          const isDropTarget = dragOverColumn === column.value;

          return (
            <section
              key={column.value}
              className={`tasks-board-column ${isDropTarget ? 'is-drop-target' : ''} ${!canDrop ? 'is-readonly' : ''}`}
              onDragOver={(event) => onDragOverColumn(event, column.value)}
              onDragLeave={onDragLeaveColumn}
              onDrop={(event) => onDropTask(event, column.value)}
            >
              <header className="tasks-board-column__header">
                <div>
                  <strong>{column.label}</strong>
                  <span>{column.helper}</span>
                </div>
                <small>{column.tasks.length}</small>
              </header>

              <div className="tasks-board-column__body">
                {column.tasks.length === 0 ? (
                  <div className="tasks-board-empty">Nenhuma tarefa nesta etapa.</div>
                ) : (
                  column.tasks.map((task) => (
                    <TaskBoardCard
                      key={task.id}
                      task={task}
                      client={getTaskClient(task, clients)}
                      canSeeFinancials={canSeeFinancials}
                      isDragging={String(draggingTaskId) === String(task.id)}
                      onEdit={onEdit}
                      onComplete={onComplete}
                      onReopen={onReopen}
                      onMoveStatus={onMoveStatus}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskBoardCard({
  task,
  client,
  isDragging,
  onEdit,
  onComplete,
  onReopen,
  onMoveStatus,
  onDragStart,
  onDragEnd,
}) {
  const isDone = task.status === 'concluido';
  const isCanceled = task.status === 'cancelado';
  const workflowStatus = getTaskWorkflowStatus(task);
  const taskLink = normalizeUrl(task.link_referencia);
  const clientDocumentLink = workflowStatus === 'feito' ? getClientDocumentLink(client) : '';
  const safeLink = taskLink || clientDocumentLink;
  const isOverdue =
    task.data_vencimento &&
    task.data_vencimento < getTodayDate() &&
    !isDone &&
    !isCanceled;
  const nextStatus = getNextTaskStatus(task.status);
  const previousStatus = getPreviousTaskStatus(task.status);
  const moveStatus = workflowStatus === 'feito' ? nextStatus : previousStatus;
  const MoveIcon = workflowStatus === 'feito' ? ChevronRight : ChevronLeft;
  const articles = Number(task.quantidade_artigos || 0);
  const deliveryLabel = articles > 0
    ? `${articles} artigo${articles === 1 ? '' : 's'}`
    : getTaskTypeLabel(task.tipo);
  const dueSummary = getTaskDueSummary(task);
  const title = task.titulo || 'Tarefa sem titulo';
  const clientName = task.cliente_nome || 'Sem cliente';
  const shouldShowClient =
    clientName !== 'Sem cliente' &&
    !normalizeCardText(title).includes(normalizeCardText(clientName));

  return (
    <article
      className={`task-board-card ${isOverdue ? 'is-overdue' : ''} ${isDragging ? 'is-dragging' : ''}`}
      draggable
      onDragStart={(event) => onDragStart(event, task)}
      onDragEnd={onDragEnd}
    >
      <div className="task-board-card__top">
        <div className="task-board-card__top-info">
          <span className={`task-board-card__status task-board-card__status--${workflowStatus}`}>
            {getTaskStatusLabel(workflowStatus)}
          </span>
          <span className={`task-pill task-pill--priority-${task.prioridade || 'normal'}`}>
            {getTaskPriorityLabel(task.prioridade)}
          </span>
          {isOverdue && <span className="task-board-card__alert">Vencida</span>}
        </div>
      </div>

      <button
        type="button"
        className="task-board-card__main"
        onClick={() => onEdit(task)}
      >
        <strong>{title}</strong>
      </button>

      <div className="task-board-card__details">
        {shouldShowClient && (
          <span className="task-board-card__client">
            <Users size={13} />
            {clientName}
          </span>
        )}
        <span className={isOverdue ? 'is-danger' : 'is-success'}>
          <CalendarDays size={13} />
          {formatDate(task.data_vencimento)}
          {dueSummary ? ` - ${dueSummary}` : ''}
        </span>
        <span>
          <FileText size={13} />
          {deliveryLabel}
        </span>
      </div>

      <div className="task-board-card__owner">
        <span>{getInitials(task.responsavel || task.cliente_nome || 'T')}</span>
        <strong>{task.responsavel || 'Sem responsavel'}</strong>
      </div>

      <div className="task-board-card__actions-shell">
        <span className="task-board-card__action-cue" aria-hidden="true">
          <span />
          <ChevronRight size={13} />
        </span>

        <div className="task-board-card__quick-actions">
          {safeLink && (
            <a
              className="task-board-card__quick-action task-board-card__quick-action--link"
              href={safeLink}
              target="_blank"
              rel="noreferrer"
              title="Abrir link"
              data-tooltip="Abrir link"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            className="task-board-card__quick-action"
            type="button"
            onClick={() => onEdit(task)}
            title="Editar tarefa"
            data-tooltip="Editar"
          >
            <Edit3 size={14} />
          </button>
          {isDone ? (
            <button
              className="task-board-card__quick-action"
              type="button"
              onClick={() => onReopen(task)}
              title="Reabrir tarefa"
              data-tooltip="Reabrir"
            >
              <RotateCcw size={14} />
            </button>
          ) : (
            <button
              className="task-board-card__quick-action"
              type="button"
              onClick={() => onComplete(task)}
              title="Concluir tarefa"
              data-tooltip="Concluir"
            >
              <CheckCircle2 size={14} />
            </button>
          )}
          {moveStatus && (
            <button
              className="task-board-card__quick-action"
              type="button"
              onClick={() => onMoveStatus(task, moveStatus.value)}
              title={`Mover para ${moveStatus.label}`}
              data-tooltip={`Mover para ${moveStatus.label}`}
            >
              <MoveIcon size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function TaskArchivePanel({
  archiveMonth,
  archivedMonths,
  openArchiveMonth,
  openArchiveTasks,
  archiving,
  onChangeArchiveMonth,
  onArchiveCompletedMonth,
  onOpenArchiveMonth,
  onEdit,
}) {
  return (
    <section className="tasks-card tasks-archive-card">
      <div className="tasks-card__header">
        <div>
          <h3>Arquivadas</h3>
          <p>Pastas mensais das tarefas concluidas retiradas do Kanban</p>
        </div>

        <div className="tasks-toolbar">
          <label className="tasks-month-field">
            <span>Mes</span>
            <input
              type="month"
              value={archiveMonth}
              onChange={(event) => onChangeArchiveMonth(event.target.value)}
            />
          </label>

          <button
            className="tasks-tool-button"
            type="button"
            disabled={archiving}
            onClick={onArchiveCompletedMonth}
          >
            <Archive size={16} />
            {archiving ? 'Arquivando...' : 'Arquivar concluidas'}
          </button>
        </div>
      </div>

      <div className="tasks-archive-body">
        <div className="tasks-archive-folders">
          {archivedMonths.length === 0 ? (
            <div className="tasks-board-empty">Nenhuma pasta mensal arquivada.</div>
          ) : (
            archivedMonths.map((month) => (
              <button
                key={month}
                type="button"
                className={`tasks-archive-folder ${openArchiveMonth === month ? 'is-active' : ''}`}
                onClick={() => onOpenArchiveMonth(openArchiveMonth === month ? '' : month)}
              >
                <FolderOpen size={17} />
                <span>{formatMonthReferenceLabel(month)}</span>
              </button>
            ))
          )}
        </div>

        {openArchiveMonth && (
          <div className="tasks-archive-list">
            <h4>{formatMonthReferenceLabel(openArchiveMonth)}</h4>
            {openArchiveTasks.length === 0 ? (
              <div className="tasks-board-empty">Nenhuma tarefa nesse mes.</div>
            ) : (
              openArchiveTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="tasks-archive-item"
                  onClick={() => onEdit(task)}
                >
                  <strong>{task.titulo || 'Tarefa sem titulo'}</strong>
                  <span>{task.cliente_nome || 'Sem cliente'} - {formatDate(task.data_vencimento)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function RecurringTasksModal({
  draft,
  tasks,
  saving,
  onChange,
  onClose,
  onGenerate,
}) {
  const recurringTemplates = tasks.filter(isRecurringMonthlyTaskTemplate);
  const readyTemplates = recurringTemplates.filter((task) => Boolean(task.proxima_recorrencia));
  const templatesForSelectedMonth = readyTemplates.filter((task) => {
    return getMonthReferenceFromDate(task.proxima_recorrencia) === draft.mes_referencia;
  });
  const templatesToAdjust = recurringTemplates.filter((task) => !task.proxima_recorrencia);

  return (
    <div className="task-modal-backdrop" onClick={onClose}>
      <aside className="task-modal task-modal--small" onClick={(event) => event.stopPropagation()}>
        <header className="task-modal__header">
          <div>
            <p>Tarefas recorrentes</p>
            <h2>Gerar recorrentes do mes</h2>
          </div>

          <button type="button" className="task-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="task-modal__body">
          <section className="task-modal-section">
            <div className="task-modal-section__title">
              <h3>Referencia</h3>
              <span>Busca tarefas-modelo em crm_tarefas, sem filtrar por cliente ou responsavel.</span>
            </div>

            <div className="tasks-recurring-summary">
              <div className="tasks-recurring-metric">
                <strong>{readyTemplates.length}</strong>
                <span>Modelos ativos</span>
              </div>

              <div className="tasks-recurring-metric">
                <strong>{templatesForSelectedMonth.length}</strong>
                <span>No mes selecionado</span>
              </div>

              <div className="tasks-recurring-metric is-warning">
                <strong>{templatesToAdjust.length}</strong>
                <span>Sem proxima data</span>
              </div>
            </div>

            <div className="task-form-grid">
              <TaskField
                label="Mes de referencia"
                type="month"
                value={draft.mes_referencia}
                onChange={(value) => onChange('mes_referencia', value)}
              />

              <TaskField
                label="Vencimento automatico"
                type="date"
                value={draft.data_vencimento}
                onChange={(value) => onChange('data_vencimento', value)}
                disabled
              />

              <TaskField
                label="Responsavel"
                value={draft.responsavel}
                onChange={(value) => onChange('responsavel', value)}
              />
            </div>
          </section>
        </div>

        <footer className="task-modal__footer">
          <div />
          <div className="task-modal__footer-actions">
            <button type="button" className="tasks-tool-button" onClick={onClose}>Fechar</button>
            <button type="button" className="tasks-primary-button" onClick={onGenerate} disabled={saving}>
              <Plus size={16} />
              {saving ? 'Gerando...' : 'Gerar tarefas'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function TaskRow({
  task,
  canSeeFinancials,
  onEdit,
  onComplete,
  onReopen,
  onDelete,
}) {
  const safeLink = normalizeUrl(task.link_referencia);
  const isDone = task.status === 'concluido';
  const isCanceled = task.status === 'cancelado';
  const isOverdue =
    task.data_vencimento &&
    task.data_vencimento < getTodayDate() &&
    !isDone &&
    !isCanceled;
  const displayStatus = isOverdue ? 'atrasado' : getTaskWorkflowStatus(task);

  return (
    <article className={`task-row ${isOverdue ? 'is-overdue' : ''}`}>
      <button
        type="button"
        className="task-row__main"
        onClick={() => onEdit(task)}
      >
        <strong>{task.titulo || 'Tarefa sem titulo'}</strong>
        <span>{task.descricao || 'Sem descricao'}</span>
      </button>

      <div className="task-row__meta">
        <span>{task.cliente_nome || 'Sem cliente'}</span>
        <small>Cliente</small>
      </div>

      <div>
        <span className="task-pill task-pill--type">
          {getTaskTypeLabel(task.tipo)}
        </span>
      </div>

      <div>
        <span className={`task-pill task-pill--status-${displayStatus}`}>
          {getTaskStatusLabel(displayStatus)}
        </span>
      </div>

      <div>
        <span className={`task-pill task-pill--priority-${task.prioridade || 'normal'}`}>
          {getTaskPriorityLabel(task.prioridade)}
        </span>
      </div>

      <div className="task-row__meta">
        <span>{formatDate(task.data_vencimento)}</span>
        <small>{task.hora_vencimento || 'Sem horario'}</small>
      </div>

      <div className="task-row__meta">
        <span>{task.responsavel || 'Sem responsavel'}</span>
        <small>Responsavel</small>
      </div>

      {canSeeFinancials && (
        <div className="task-row__meta">
          <span>{formatCurrency(task.valor_previsto)}</span>
          <small>Previsto</small>
        </div>
      )}

      <div className="task-row__actions">
        {safeLink && (
          <a
            href={safeLink}
            target="_blank"
            rel="noreferrer"
            title="Abrir link"
          >
            <ExternalLink size={15} />
          </a>
        )}

        {isDone ? (
          <button
            type="button"
            onClick={() => onReopen(task)}
            title="Reabrir tarefa"
          >
            <RotateCcw size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onComplete(task)}
            title="Concluir tarefa"
          >
            <CheckCircle2 size={15} />
          </button>
        )}

        <button
          type="button"
          onClick={() => onEdit(task)}
          title="Editar tarefa"
        >
          <Edit3 size={15} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task)}
          title="Excluir tarefa"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

function TaskModal({
  task,
  clients,
  saving,
  feedback,
  canSeeFinancials,
  onChange,
  onChangeClient,
  onClose,
  onSave,
  onCancelTask,
  onDeleteTask,
}) {
  const showFinancialFields = canSeeFinancials && task.tipo === 'mensalidade';
  const showArticleFields = canSeeFinancials || task.tipo === 'artigo';

  return (
    <div className="task-modal-backdrop" onClick={onClose}>
      <aside className="task-modal" onClick={(event) => event.stopPropagation()}>
        <header className="task-modal__header">
          <div>
            <p>{task.isNewTask ? 'Nova tarefa' : 'Editar tarefa'}</p>
            <h2>{task.titulo || 'Tarefa sem titulo'}</h2>
          </div>

          <button type="button" className="task-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="task-modal__body">
          <section className="task-modal-section">
            <div className="task-modal-section__title">
              <h3>Dados principais</h3>
              <span>Titulo, cliente, tipo e prazo</span>
            </div>

            <div className="task-form-grid">
              <TaskField
                label="Titulo"
                value={task.titulo}
                onChange={(value) => onChange('titulo', value)}
                placeholder="Ex: Artigo 1 - Dor lombar"
              />

              <div className="task-field">
                <label>Cliente</label>
                <select
                  value={task.cliente_id || ''}
                  onChange={(event) => onChangeClient(event.target.value)}
                >
                  <option value="">Sem cliente vinculado</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nome || client.empresa || 'Cliente sem nome'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="task-field">
                <label>Tipo</label>
                <select
                  value={task.tipo}
                  onChange={(event) => onChange('tipo', event.target.value)}
                >
                  {TASK_TYPES
                    .filter((type) => canSeeFinancials || type.value !== 'mensalidade')
                    .map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="task-field">
                <label>Status</label>
                <select
                  value={normalizeTaskStatus(task.status)}
                  onChange={(event) => onChange('status', event.target.value)}
                >
                  {TASK_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="task-field">
                <label>Prioridade</label>
                <select
                  value={task.prioridade}
                  onChange={(event) => onChange('prioridade', event.target.value)}
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <TaskField
                label="Data de vencimento"
                type="date"
                value={task.data_vencimento}
                onChange={(value) => onChange('data_vencimento', value)}
              />

              <TaskField
                label="Hora"
                type="time"
                value={task.hora_vencimento}
                onChange={(value) => onChange('hora_vencimento', value)}
              />

              <TaskField
                label="Responsavel"
                value={task.responsavel}
                onChange={(value) => onChange('responsavel', value)}
              />
            </div>
          </section>

          {showFinancialFields && (
            <section className="task-modal-section is-sensitive-financial">
              <div className="task-modal-section__title">
                <h3>Financeiro</h3>
                <span>Dados da mensalidade ou cobranca</span>
              </div>

              <div className="task-form-grid">
                <TaskField
                  label="Valor previsto"
                  value={task.valor_previsto}
                  onChange={(value) => onChange('valor_previsto', value)}
                  placeholder="Ex: 2500,00"
                />

                <TaskField
                  label="Valor pago"
                  value={task.valor_pago}
                  onChange={(value) => onChange('valor_pago', value)}
                  placeholder="Ex: 2500,00"
                />
              </div>
            </section>
          )}

          {showArticleFields && (
            <section className="task-modal-section is-sensitive-financial">
              <div className="task-modal-section__title">
                <h3>Artigos e faturamento</h3>
                <span>Referencia mensal, quantidade e valor da entrega</span>
              </div>

              <div className="task-form-grid">
                <TaskField
                  label="Mes de referencia"
                  type="month"
                  value={task.mes_referencia}
                  onChange={(value) => onChange('mes_referencia', value)}
                />

                <TaskField
                  label="Quantidade de artigos"
                  type="number"
                  value={task.quantidade_artigos}
                  onChange={(value) => onChange('quantidade_artigos', value)}
                />

                <TaskField
                  label="Valor por artigo"
                  value={task.valor_unitario}
                  onChange={(value) => onChange('valor_unitario', value)}
                  placeholder="Ex: 250,00"
                />

                <TaskField
                  label="Valor total"
                  value={task.valor_total}
                  onChange={(value) => onChange('valor_total', value)}
                  placeholder="Calculado ou informado"
                />

                <div className="task-field">
                  <label>Faturavel</label>
                  <button
                    type="button"
                    className={`task-toggle-button ${task.faturavel !== false ? 'is-active' : ''}`}
                    onClick={() => onChange('faturavel', task.faturavel === false)}
                  >
                    {task.faturavel !== false ? 'Entra no financeiro' : 'Nao entra no financeiro'}
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="task-modal-section">
            <div className="task-modal-section__title">
              <h3>Detalhes</h3>
              <span>Descricao, link e observacoes</span>
            </div>

            <div className="task-form-grid">
              <div className="task-field task-field--full">
                <label>Descricao</label>
                <textarea
                  value={task.descricao || ''}
                  onChange={(event) => onChange('descricao', event.target.value)}
                  rows={4}
                  placeholder="Descreva o que precisa ser feito."
                />
              </div>

              <TaskLinkField
                label="Link de referencia"
                value={task.link_referencia}
                onChange={(value) => onChange('link_referencia', value)}
                monthValue={task.mes_referencia}
                onMonthChange={(value) => onChange('mes_referencia', value)}
                savedAt={task.atualizado_em || task.criado_em}
                placeholder="Google Docs, Drive, relatorio, briefing..."
              />

              <div className="task-field task-field--full">
                <label>Observacoes</label>
                <textarea
                  value={task.observacoes || ''}
                  onChange={(event) => onChange('observacoes', event.target.value)}
                  rows={4}
                  placeholder="Notas internas, historico, combinados..."
                />
              </div>
            </div>
          </section>
        </div>

        {feedback && (
          <div className="task-modal-feedback">
            {feedback}
          </div>
        )}

        <footer className="task-modal__footer">
          <div className="task-modal__danger-actions">
            {!task.isNewTask && (
              <>
                <button type="button" className="tasks-tool-button is-warning" onClick={() => onCancelTask(task)} disabled={saving}>
                  <X size={16} />
                  Cancelar tarefa
                </button>

                <button type="button" className="tasks-tool-button is-danger" onClick={() => onDeleteTask(task)} disabled={saving}>
                  <Trash2 size={16} />
                  Excluir tarefa
                </button>
              </>
            )}
          </div>

          <div className="task-modal__footer-actions">
            <button type="button" className="tasks-tool-button" onClick={onClose}>
              Fechar
            </button>

            <button
              type="button"
              className="tasks-primary-button"
              onClick={onSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Salvando...' : task.isNewTask ? 'Criar tarefa' : 'Salvar tarefa'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function TaskField({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) {
  return (
    <div className="task-field">
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

function TaskLinkField({
  label,
  value,
  onChange,
  monthValue,
  onMonthChange,
  savedAt,
  placeholder = '',
}) {
  const safeLink = normalizeUrl(value);
  const savedDate = safeLink && savedAt ? formatDateTime(savedAt) : '';
  const monthLabel = monthValue ? formatMonthReferenceLabel(monthValue) : '';

  return (
    <div className="task-field task-link-field">
      <div className="task-link-field__header">
        <label>{label}</label>
        {safeLink && <span>Link criado{monthLabel ? ` para ${monthLabel}` : ''}</span>}
      </div>

      <div className="task-link-field__grid">
        <div className="task-link-field__control">
          <input
            value={value || ''}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />

          {safeLink ? (
            <a
              href={safeLink}
              target="_blank"
              rel="noreferrer"
              className="task-link-field__open"
              title="Abrir link em nova aba"
            >
              <ExternalLink size={15} />
              Abrir
            </a>
          ) : (
            <span className="task-link-field__open is-disabled">
              <ExternalLink size={15} />
              Abrir
            </span>
          )}
        </div>

        <div className="task-link-field__month">
          <label>Mes do documento</label>
          <input
            type="month"
            value={monthValue || ''}
            onChange={(event) => onMonthChange(event.target.value)}
          />
        </div>
      </div>

      {safeLink && (
        <div className="task-link-field__summary">
          <a href={safeLink} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Link do documento
          </a>
          <span>{monthLabel || 'Sem mes definido'}</span>
          {savedDate && <span>Cadastrado em {savedDate}</span>}
        </div>
      )}
    </div>
  );
}

function getTaskTypeLabel(value) {
  return TASK_TYPES.find((item) => item.value === value)?.label || 'Tarefa';
}

function getTaskStatusLabel(value) {
  if (value === 'atrasado') return 'Vencida';

  const normalizedStatus = normalizeTaskStatus(value);
  return TASK_STATUS.find((item) => item.value === normalizedStatus)?.label || 'Pendente';
}

function getTaskPriorityLabel(value) {
  return TASK_PRIORITIES.find((item) => item.value === value)?.label || 'Media';
}

function getInitials(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'T';
}

function normalizeCardText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getTaskBoardColumn(task) {
  return getTaskWorkflowStatus(task);
}

function canDropInTaskColumn(status) {
  return ['pendente', 'feito', 'enviado_cliente', 'recebido', 'concluido'].includes(status);
}

function getNextTaskStatus(status) {
  const normalizedStatus = normalizeTaskStatus(status);

  if (normalizedStatus === 'pendente') {
    return { value: 'feito', label: 'Feito' };
  }

  if (normalizedStatus === 'feito') {
    return { value: 'enviado_cliente', label: 'Enviar' };
  }

  if (normalizedStatus === 'enviado_cliente') {
    return { value: 'recebido', label: 'A receber' };
  }

  if (normalizedStatus === 'recebido') {
    return { value: 'concluido', label: 'Concluir' };
  }

  if (normalizedStatus === 'cancelado') {
    return { value: 'pendente', label: 'Reabrir' };
  }

  return null;
}

function getPreviousTaskStatus(status) {
  const normalizedStatus = normalizeTaskStatus(status);

  if (normalizedStatus === 'feito') {
    return { value: 'pendente', label: 'Pendente' };
  }

  if (normalizedStatus === 'enviado_cliente') {
    return { value: 'feito', label: 'Feito' };
  }

  if (normalizedStatus === 'recebido') {
    return { value: 'enviado_cliente', label: 'Enviado' };
  }

  if (normalizedStatus === 'concluido') {
    return { value: 'recebido', label: 'A receber' };
  }

  return null;
}

function getTaskClient(task, clients = []) {
  if (!task || !Array.isArray(clients)) return null;

  if (task.cliente_id) {
    const clientById = clients.find((client) => String(client.id) === String(task.cliente_id));
    if (clientById) return clientById;
  }

  const taskClientName = normalizeCardText(task.cliente_nome);
  if (!taskClientName) return null;

  return clients.find((client) => {
    return [
      client.nome,
      client.nome_fantasia,
      client.empresa,
      client.razao_social,
    ].some((value) => normalizeCardText(value) === taskClientName);
  }) || null;
}

function getClientDocumentLink(client) {
  if (!client) return '';

  const link = CLIENT_DOCUMENT_LINK_FIELDS
    .map((field) => normalizeUrl(client[field]))
    .find(Boolean);

  return link || '';
}

function getTaskWorkflowStatus(task) {
  return normalizeTaskStatus(task?.status);
}

function normalizeTaskStatus(status) {
  const normalizedStatus = String(status || 'pendente');

  if (normalizedStatus === 'aguardando_cliente') return 'enviado_cliente';
  if (normalizedStatus === 'em_andamento' || normalizedStatus === 'atrasado') return 'pendente';

  return normalizedStatus;
}

function isTaskOverdue(task) {
  return (
    task?.data_vencimento &&
    task.data_vencimento < getTodayDate() &&
    !['concluido', 'cancelado', 'arquivada'].includes(task.status)
  );
}

function isTaskInMonth(task, monthReference) {
  if (!task || !monthReference) return false;

  return (
    task.mes_referencia === monthReference ||
    getMonthReferenceFromDate(task.data_vencimento) === monthReference
  );
}

function getTaskBillingValue(task) {
  const total = toMoneyNumber(task?.valor_total);

  if (total > 0) return total;

  const articles = Number(task?.quantidade_artigos || 0);
  const unitValue = toMoneyNumber(task?.valor_unitario);
  const calculatedTotal = articles * unitValue;

  if (calculatedTotal > 0) return calculatedTotal;

  return toMoneyNumber(task?.valor_previsto);
}

function getTaskDueSummary(task) {
  if (!task?.data_vencimento) return '';

  const today = new Date(`${getTodayDate()}T00:00:00`);
  const dueDate = new Date(`${String(task.data_vencimento).slice(0, 10)}T00:00:00`);
  const diffDays = Math.round((dueDate - today) / 86400000);

  if (Number.isNaN(diffDays)) return '';
  if (diffDays < 0) return `${Math.abs(diffDays)} d atrasada`;
  if (diffDays === 0) return 'vence hoje';
  if (diffDays === 1) return 'amanha';

  return `restam ${diffDays} d`;
}

function isRecurringMonthlyTaskTemplate(task) {
  return (
    task?.recorrente === true &&
    String(task.recorrencia || '').toLowerCase() === 'mensal'
  );
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonthReference() {
  return new Date().toISOString().slice(0, 7);
}

function getNextMonthReference() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);

  return date.toISOString().slice(0, 7);
}

function getMonthReferenceFromDate(value) {
  if (!value) return '';

  return String(value).slice(0, 7);
}

function formatMonthReferenceLabel(monthReference) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return monthReference || 'Sem mes';

  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getCalendarDays(monthReference, tasks) {
  const [year, month] = String(monthReference || getCurrentMonthReference()).split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const startDate = new Date(year, month - 1, 1 - firstDay.getDay());
  const today = getTodayDate();
  const tasksByDate = tasks.reduce((accumulator, task) => {
    if (!task.data_vencimento) return accumulator;

    const dateKey = String(task.data_vencimento).slice(0, 10);
    accumulator[dateKey] = [...(accumulator[dateKey] || []), task];

    return accumulator;
  }, {});

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    const dateKey = getDateKey(date);
    const dayTasks = (tasksByDate[dateKey] || []).sort(sortTasksByAttention);

    return {
      date,
      dateKey,
      tasks: dayTasks,
      isToday: dateKey === today,
      isCurrentMonth: getMonthReferenceFromDate(dateKey) === monthReference,
      hasOverdue: dayTasks.some(isTaskOverdue),
    };
  });
}

function addMonthsToMonthReference(monthReference, monthsToAdd) {
  const [year, month] = String(monthReference || getCurrentMonthReference()).split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + monthsToAdd);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function sortTasksByAttention(firstTask, secondTask) {
  const firstRank = getTaskAttentionRank(firstTask);
  const secondRank = getTaskAttentionRank(secondTask);

  if (firstRank !== secondRank) {
    return firstRank - secondRank;
  }

  const firstDueDate = firstTask.data_vencimento || '9999-12-31';
  const secondDueDate = secondTask.data_vencimento || '9999-12-31';

  if (firstDueDate !== secondDueDate) {
    return firstDueDate.localeCompare(secondDueDate);
  }

  return String(firstTask.titulo || '').localeCompare(String(secondTask.titulo || ''), 'pt-BR');
}

function getTaskAttentionRank(task) {
  const today = getTodayDate();
  const isClosed = ['concluido', 'cancelado'].includes(task.status);

  if (!isClosed && task.data_vencimento && task.data_vencimento < today) return 0;
  if (!isClosed && task.data_vencimento === today) return 1;
  if (!isClosed && task.prioridade === 'urgente') return 2;
  if (!isClosed && task.prioridade === 'alta') return 3;
  if (!isClosed && getTaskWorkflowStatus(task) === 'recebido') return 4;
  if (!isClosed && getTaskWorkflowStatus(task) === 'enviado_cliente') return 5;
  if (!isClosed) return 6;
  if (task.status === 'concluido') return 7;

  return 8;
}

function formatDate(value) {
  if (!value) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatCurrency(value) {
  const number = toMoneyNumber(value);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
}

function toMoneyNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === '') return 0;

  const normalizedValue = String(value).trim();
  const decimalValue = normalizedValue.includes(',')
    ? normalizedValue.replace(/\./g, '').replace(',', '.')
    : normalizedValue;
  const number = Number(decimalValue);

  return Number.isFinite(number) ? number : 0;
}

function normalizeUrl(url) {
  if (!url) return '';

  const trimmedUrl = String(url).trim();

  if (!trimmedUrl) return '';

  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}
