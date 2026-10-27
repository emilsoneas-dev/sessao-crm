import { useMemo, useState } from 'react';
import { AlertTriangle, Bell, Moon, Sun } from 'lucide-react';
import { UserAccountMenu } from './UserAccountMenu.jsx';
import './topbar-notifications.css';

const PAGE_TITLES = {
  'visao-geral': 'Visao Geral',
  leads: 'Leads',
  clientes: 'Clientes',
  financeiro: 'Direcao',
  'recursos-humanos': 'Recursos Humanos',
  tarefas: 'Operacional',
  documentos: 'Documentos',
  instagram: 'Instagram',
  conteudo: 'Conteudo',
  configuracoes: 'Configuracoes',
};

export function Topbar({
  totalLeads = 0,
  theme = 'light',
  onToggleTheme,
  pageTitle,
  clients = [],
  crmUser,
  userEmail = '',
  onLogout,
  onOpenFinancialAlerts,
  dailyPhrase = 'Clareza para decidir, consistencia para executar.',
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const resolvedTitle = pageTitle || getCurrentPageTitle();
  const financialAlerts = useMemo(() => getFinancialAlerts(clients), [clients]);
  const birthdayMessage = getBirthdayMessage(crmUser?.data_nascimento, crmUser?.nome);
  const criticalAlerts = financialAlerts.filter((alert) => alert.tone === 'critical').length;
  const alertToneClass = criticalAlerts ? 'has-critical-alerts' : financialAlerts.length ? 'has-warning-alerts' : '';

  function handleOpenAlert(alert) {
    setNotificationsOpen(false);
    onOpenFinancialAlerts?.(alert);
  }

  return (
    <header className="topbar">
      <div>
        <h1>{resolvedTitle}</h1>

        <span className="topbar__subtitle">
          {dailyPhrase}
        </span>

        {birthdayMessage && (
          <span className="topbar__birthday-alert">{birthdayMessage}</span>
        )}
      </div>

      <div className="topbar__actions">
        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="topbar-notifications">
          <button
            className={`icon-button topbar-notification-button ${alertToneClass}`}
            type="button"
            aria-label="Alertas da carteira"
            title="Alertas da carteira"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((current) => !current)}
          >
            <Bell size={18} />
            {financialAlerts.length > 0 && (
              <span className="topbar-notification-badge">{financialAlerts.length}</span>
            )}
          </button>

          {notificationsOpen && (
            <div className="topbar-notification-panel">
              <div className="topbar-notification-panel__header">
                <div>
                  <strong>Alertas da carteira</strong>
                  <span>{financialAlerts.length || 'Nenhum'} vencimento em atencao</span>
                </div>
                <AlertTriangle size={17} />
              </div>

              {financialAlerts.length === 0 ? (
                <div className="topbar-notification-empty">
                  Nenhum vencimento urgente agora.
                </div>
              ) : (
                <div className="topbar-notification-list">
                  {financialAlerts.map((alert) => (
                    <button
                      key={`${alert.clientId}-${alert.type}`}
                      type="button"
                      className={`topbar-notification-item is-${alert.tone}`}
                      onClick={() => handleOpenAlert(alert)}
                    >
                      <span className="topbar-notification-item__dot" />
                      <div>
                        <strong>{alert.title}</strong>
                        <small>{alert.description}</small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="topbar__user" title="Total desta area">
          <span>{totalLeads}</span>
          <small>registros</small>
        </div>

        <UserAccountMenu
          user={crmUser}
          userEmail={userEmail}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

function getCurrentPageTitle() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1] || 'leads';

  return PAGE_TITLES[lastSegment] || 'Leads';
}

function getFinancialAlerts(clients) {
  const today = startOfDay(new Date());

  return clients
    .map((client) => getFinancialAlert(client, today))
    .filter(Boolean)
    .sort((a, b) => a.sortValue - b.sortValue)
    .slice(0, 8);
}

function getFinancialAlert(client, today) {
  const statusCliente = client.status_cliente || 'ativo';
  const statusFinanceiro = client.status_financeiro || 'nao_informado';

  if (statusCliente === 'encerrado' || statusFinanceiro === 'pago') return null;

  const dueDay = Number(client.dia_vencimento || 0);
  const clientName = client.nome || client.empresa || 'Cliente sem nome';

  if (!dueDay) {
    if (statusFinanceiro !== 'atrasado') return null;

    return {
      clientId: client.id || clientName,
      type: 'sem-dia-atrasado',
      tone: 'critical',
      sortValue: -99,
      title: `${clientName} esta atrasado`,
      description: 'Sem dia de vencimento cadastrado.',
    };
  }

  const dueDate = getDueDateForCurrentMonth(today, dueDay);
  const daysUntilDue = getDiffInDays(today, dueDate);

  if (statusFinanceiro === 'atrasado' || daysUntilDue < 0) {
    const daysLate = Math.abs(daysUntilDue);

    return {
      clientId: client.id || clientName,
      type: 'atrasado',
      tone: 'critical',
      sortValue: daysUntilDue,
      title: `${clientName} esta atrasado`,
      description: daysLate ? `Vencimento passou ha ${daysLate} dia(s).` : 'Marcado como atrasado.',
    };
  }

  if (daysUntilDue === 0) {
    return {
      clientId: client.id || clientName,
      type: 'vence-hoje',
      tone: 'critical',
      sortValue: 0,
      title: `${clientName} vence hoje`,
      description: 'Verifique pagamento ou atualize o status financeiro.',
    };
  }

  if (daysUntilDue <= 3) {
    return {
      clientId: client.id || clientName,
      type: 'vence-em-breve',
      tone: 'warning',
      sortValue: daysUntilDue,
      title: `${clientName} vence em ${daysUntilDue} dia(s)`,
      description: `Vencimento no dia ${dueDate.getDate()}.`,
    };
  }

  return null;
}

function getDueDateForCurrentMonth(today, dueDay) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(dueDay, 1), lastDayOfMonth);

  return startOfDay(new Date(year, month, safeDay));
}

function getDiffInDays(startDate, endDate) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / oneDay);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getBirthdayMessage(date, name) {
  if (!date || !name) return '';

  const today = new Date();
  const birthday = getDateParts(date);

  if (!birthday) return '';

  if (
    today.getDate() === birthday.day &&
    today.getMonth() === birthday.month
  ) {
    return `Aniversariante do dia: ${name}.`;
  }

  return '';
}

function getDateParts(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}
