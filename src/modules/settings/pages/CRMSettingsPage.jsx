import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  MailCheck,
  MailPlus,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import {
  cancelUserInvite,
  createCrmUser,
  createUserPagePermission,
  deleteCrmUser,
  disableCrmUserAccess,
  disableUserPermission,
  fetchAllExtraPermissions,
  fetchCrmUsers,
} from '../services/settingsService.js';
import '../styles/settings.css';

const PAGE_OPTIONS = [
  { id: 'visao-geral', label: 'Visao Geral' },
  { id: 'leads', label: 'Leads' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'tarefas', label: 'Operacional' },
  { id: 'financeiro', label: 'Direcao' },
  { id: 'recursos-humanos', label: 'Recursos Humanos' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'configuracoes', label: 'Configuracoes' },
];

const ROLE_LABELS = {
  dono: 'Dono',
  gestor: 'Gestor',
  funcionario: 'Funcionario',
  cliente: 'Cliente',
};

const INVITE_STATUS_LABELS = {
  ativo: 'Ativo',
  enviado: 'Convite enviado',
  aceito: 'Convite aceito',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
};

export function CRMSettingsPage({ crmUser }) {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedPage, setSelectedPage] = useState('clientes');
  const [savingPermission, setSavingPermission] = useState(false);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [invitedUser, setInvitedUser] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [modalError, setModalError] = useState('');

  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    papel: 'funcionario',
    ativo: true,
  });

  const isOwner = crmUser?.papel === 'dono';

  const invitedUsers = useMemo(() => {
    return users.filter((user) => user.convite_status === 'enviado');
  }, [users]);

  const permissionsByEmail = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.usuario_email]) {
        acc[permission.usuario_email] = [];
      }

      acc[permission.usuario_email].push(permission);

      return acc;
    }, {});
  }, [permissions]);

  async function loadSettingsData({ silent = false } = {}) {
    try {
      setLoading(true);

      if (!silent) {
        setFeedback('');
      }

      const [usersData, permissionsData] = await Promise.all([
        fetchCrmUsers(),
        fetchAllExtraPermissions(),
      ]);

      setUsers(usersData);
      setPermissions(permissionsData);

      if (!selectedEmail && usersData.length > 0) {
        const firstNonOwner = usersData.find((user) => user.papel !== 'dono') || usersData[0];
        setSelectedEmail(firstNonOwner.email);
      }
    } catch (error) {
      console.error('Erro ao carregar configuracoes:', error);
      setFeedback('Nao foi possivel carregar usuarios e permissoes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettingsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpenInviteModal() {
    setInviteSent(false);
    setInvitedUser(null);
    setModalError('');
    setNewUser({
      nome: '',
      email: '',
      papel: 'funcionario',
      ativo: true,
    });
    setUserModalOpen(true);
  }

  function handleCloseInviteModal() {
    if (savingUser) return;

    setUserModalOpen(false);
    setInviteSent(false);
    setInvitedUser(null);
    setModalError('');
  }

  async function handleCreateCrmUser(event) {
    event.preventDefault();

    if (!isOwner) {
      setModalError('Apenas o dono pode convidar colaboradores.');
      return;
    }

    if (!newUser.nome || !newUser.email) {
      setModalError('Preencha nome e e-mail do colaborador.');
      return;
    }

    try {
      setSavingUser(true);
      setModalError('');
      setFeedback('');

      const createdUser = await createCrmUser(newUser);

      setInvitedUser({
        nome: createdUser?.nome || newUser.nome,
        email: createdUser?.email || newUser.email,
        papel: createdUser?.papel || newUser.papel,
      });

      setNewUser({
        nome: '',
        email: '',
        papel: 'funcionario',
        ativo: true,
      });

      setInviteSent(true);

      await loadSettingsData({ silent: true });
    } catch (error) {
      console.error('Erro ao enviar convite:', error);

      setModalError(
        error?.message ||
          'Nao foi possivel enviar o convite. Confira o e-mail e tente novamente.'
      );
    } finally {
      setSavingUser(false);
    }
  }

  async function handleCreatePermission(event) {
    event.preventDefault();

    if (!isOwner) {
      setFeedback('Apenas o dono pode alterar permissoes.');
      return;
    }

    if (!selectedEmail || !selectedPage) {
      setFeedback('Selecione um usuario e uma pagina.');
      return;
    }

    try {
      setSavingPermission(true);
      setFeedback('');

      await createUserPagePermission({
        usuario_email: selectedEmail,
        recurso_id: selectedPage,
        permissao: 'visualizar',
      });

      await loadSettingsData({ silent: true });

      setFeedback('Permissao adicionada com sucesso.');
      window.setTimeout(() => setFeedback(''), 3500);
    } catch (error) {
      console.error('Erro ao adicionar permissao:', error);
      setFeedback('Nao foi possivel adicionar a permissao.');
    } finally {
      setSavingPermission(false);
    }
  }

  async function handleDisablePermission(permissionId) {
    if (!isOwner) {
      setFeedback('Apenas o dono pode remover permissoes.');
      return;
    }

    const shouldRemove = window.confirm('Remover esta permissao?');

    if (!shouldRemove) return;

    try {
      setFeedback('');

      await disableUserPermission(permissionId);
      await loadSettingsData({ silent: true });

      setFeedback('Permissao removida.');
      window.setTimeout(() => setFeedback(''), 3500);
    } catch (error) {
      console.error('Erro ao remover permissao:', error);
      setFeedback('Nao foi possivel remover a permissao.');
    }
  }

  async function handleCancelInvite(user) {
    if (!isOwner) {
      setFeedback('Apenas o dono pode excluir convites.');
      return;
    }

    if (!user?.id) {
      setFeedback('Convite invalido.');
      return;
    }

    const shouldCancel = window.confirm(`Excluir o convite enviado para ${user.email}?`);

    if (!shouldCancel) return;

    try {
      setFeedback('');

      await cancelUserInvite(user.id);
      await loadSettingsData({ silent: true });

      setFeedback('Convite excluido com sucesso.');
      window.setTimeout(() => setFeedback(''), 3500);
    } catch (error) {
      console.error('Erro ao excluir convite:', error);
      setFeedback('Nao foi possivel excluir o convite.');
    }
  }

  async function handleDisableUserAccess(user) {
    if (!isOwner) {
      setFeedback('Apenas o dono pode excluir acessos.');
      return;
    }

    if (!user?.id) {
      setFeedback('Usuario invalido.');
      return;
    }

    if (user.email === crmUser?.email) {
      setFeedback('Voce nao pode excluir o proprio acesso.');
      return;
    }

    const shouldDisable = window.confirm(
      `Excluir o acesso de ${user.email}? Ele nao conseguira mais entrar no CRM.`
    );

    if (!shouldDisable) return;

    try {
      setFeedback('');

      await disableCrmUserAccess(user.id);
      await loadSettingsData({ silent: true });

      setFeedback('Acesso excluido com sucesso.');
      window.setTimeout(() => setFeedback(''), 3500);
    } catch (error) {
      console.error('Erro ao excluir acesso:', error);
      setFeedback('Nao foi possivel excluir o acesso.');
    }
  }

  async function handleDeleteUser(user) {
    if (!isOwner) {
      setFeedback('Apenas o dono pode excluir usuarios.');
      return;
    }

    if (!user?.id || !user?.email) {
      setFeedback('Usuario invalido.');
      return;
    }

    if (user.email === crmUser?.email) {
      setFeedback('Voce nao pode excluir o proprio usuario.');
      return;
    }

    const shouldDelete = window.confirm(
      `Excluir definitivamente ${user.email} da lista de usuarios do CRM? As permissoes extras desse usuario tambem serao removidas.`
    );

    if (!shouldDelete) return;

    try {
      setFeedback('');

      await deleteCrmUser(user.id, user.email);
      await loadSettingsData({ silent: true });

      setFeedback('Usuario excluido com sucesso.');
      window.setTimeout(() => setFeedback(''), 3500);
    } catch (error) {
      console.error('Erro ao excluir usuario:', error);
      setFeedback('Nao foi possivel excluir o usuario.');
    }
  }

  if (!isOwner) {
    return (
      <section className="settings-page">
        <div className="settings-restricted">
          <div className="settings-restricted__icon">
            <Lock size={26} />
          </div>

          <div>
            <p>Acesso restrito</p>
            <h2>Configuracoes disponiveis apenas para o dono</h2>
            <span>
              Esta area controla usuarios, permissoes e acessos internos do CRM.
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-page">
      <section className="settings-card settings-access-card">
        <div className="settings-card__header">
          <div>
            <h3>Acessos internos</h3>
            <p>Convites, usuarios e permissoes da equipe.</p>
          </div>

          <div className="settings-hero__actions">
            <button
              className="settings-secondary-button"
              type="button"
              onClick={() => loadSettingsData()}
            >
              <RefreshCw size={16} />
              Atualizar
            </button>

            <button
              className="settings-refresh"
              type="button"
              onClick={handleOpenInviteModal}
            >
              <MailPlus size={16} />
              Convidar colaborador
            </button>
          </div>
        </div>
      </section>

      <div className="settings-stats">
        <SettingsStat
          label="Usuarios"
          value={users.length}
          icon={Users}
          type="blue"
        />

        <SettingsStat
          label="Convites enviados"
          value={invitedUsers.length}
          icon={MailCheck}
          type="purple"
        />

        <SettingsStat
          label="Permissoes extras"
          value={permissions.length}
          icon={KeyRound}
          type="green"
        />
      </div>

      <section className="settings-card">
        <div className="settings-card__header">
          <div>
            <h3>Convites enviados</h3>
            <p>Acompanhe quem recebeu convite e ainda precisa criar o acesso.</p>
          </div>
        </div>

        {loading ? (
          <div className="settings-loading">Carregando convites...</div>
        ) : invitedUsers.length === 0 ? (
          <div className="settings-empty">Nenhum convite pendente no momento.</div>
        ) : (
          <div className="settings-invites-list">
            {invitedUsers.map((user) => (
              <article className="settings-invite-row" key={user.id || user.email}>
                <div className="settings-user-row__avatar">
                  {getInitials(user.nome || user.email)}
                </div>

                <div className="settings-user-row__main">
                  <strong>{user.nome || 'Usuario sem nome'}</strong>
                  <span>{user.email}</span>
                </div>

                <div className={`settings-role settings-role--${user.papel || 'funcionario'}`}>
                  {ROLE_LABELS[user.papel] || user.papel || 'Funcionario'}
                </div>

                <div className="settings-invite-status settings-invite-status--sent">
                  <MailCheck size={14} />
                  Convite enviado
                </div>

                <div className="settings-invite-date">
                  {formatDateTime(user.ultimo_convite_em || user.convite_enviado_em)}
                </div>

                <div className="settings-row-actions">
                  <button
                    type="button"
                    className="settings-danger-button"
                    onClick={() => handleCancelInvite(user)}
                    title="Excluir convite"
                  >
                    <Trash2 size={14} />
                    Excluir convite
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card__header">
            <div>
              <h3>Usuarios cadastrados</h3>
              <p>Colaboradores liberados para acessar o CRM.</p>
            </div>
          </div>

          {loading ? (
            <div className="settings-loading">Carregando usuarios...</div>
          ) : (
            <div className="settings-users-list">
              {users.map((user) => (
                <article className="settings-user-row" key={user.id || user.email}>
                  <div className="settings-user-row__avatar">
                    {getInitials(user.nome || user.email)}
                  </div>

                  <div className="settings-user-row__main">
                    <strong>{user.nome || 'Usuario sem nome'}</strong>
                    <span>{user.email}</span>
                  </div>

                  <div className={`settings-role settings-role--${user.papel || 'funcionario'}`}>
                    {ROLE_LABELS[user.papel] || user.papel || 'Funcionario'}
                  </div>

                  <div className={`settings-status ${user.ativo ? 'is-active' : 'is-inactive'}`}>
                    <CheckCircle2 size={14} />
                    {getUserStatusLabel(user)}
                  </div>

                  <div className="settings-row-actions">
                    {user.ativo && user.email !== crmUser?.email && (
                      <button
                        type="button"
                        className="settings-warning-button"
                        onClick={() => handleDisableUserAccess(user)}
                        title="Excluir acesso"
                      >
                        <Lock size={14} />
                        Excluir acesso
                      </button>
                    )}

                    {user.email !== crmUser?.email && (
                      <button
                        type="button"
                        className="settings-danger-button"
                        onClick={() => handleDeleteUser(user)}
                        title="Excluir usuario"
                      >
                        <Trash2 size={14} />
                        Excluir usuario
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="settings-card settings-permission-card">
          <div className="settings-card__header">
            <div>
              <h3>Adicionar permissao</h3>
              <p>Libere uma pagina especifica para um usuario.</p>
            </div>
          </div>

          <form className="settings-permission-form" onSubmit={handleCreatePermission}>
            <label>
              <span>Usuario</span>
              <select
                value={selectedEmail}
                onChange={(event) => setSelectedEmail(event.target.value)}
              >
                {users.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.nome} - {user.email}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Pagina</span>
              <select
                value={selectedPage}
                onChange={(event) => setSelectedPage(event.target.value)}
              >
                {PAGE_OPTIONS.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="settings-primary-button" type="submit" disabled={savingPermission}>
              <Plus size={16} />
              {savingPermission ? 'Salvando...' : 'Adicionar permissao'}
            </button>
          </form>

          {feedback && <div className="settings-feedback">{feedback}</div>}
        </aside>
      </div>

      <section className="settings-card">
        <div className="settings-card__header">
          <div>
            <h3>Permissoes extras ativas</h3>
            <p>Permissoes individuais que complementam o cargo de cada usuario.</p>
          </div>
        </div>

        {permissions.length === 0 ? (
          <div className="settings-empty">Nenhuma permissao extra cadastrada ainda.</div>
        ) : (
          <div className="settings-permissions-list">
            {users.map((user) => {
              const userPermissions = permissionsByEmail[user.email] || [];

              if (userPermissions.length === 0) return null;

              return (
                <article className="settings-permission-group" key={user.email}>
                  <div className="settings-permission-group__user">
                    <div className="settings-user-row__avatar">
                      {getInitials(user.nome || user.email)}
                    </div>

                    <div>
                      <strong>{user.nome}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>

                  <div className="settings-permission-tags">
                    {userPermissions.map((permission) => (
                      <div className="settings-permission-tag" key={permission.id}>
                        <UserCog size={14} />
                        <span>{getResourceLabel(permission.recurso_id)}</span>

                        <button
                          type="button"
                          onClick={() => handleDisablePermission(permission.id)}
                          title="Remover permissao"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {userModalOpen && (
        <div className="settings-modal-backdrop" onClick={handleCloseInviteModal}>
          <aside className="settings-modal" onClick={(event) => event.stopPropagation()}>
            <header className="settings-modal__header">
              <div>
                <p>{inviteSent ? 'Convite enviado' : 'Novo convite'}</p>
                <h3>{inviteSent ? 'Tudo certo' : 'Convidar colaborador'}</h3>
              </div>

              <button
                type="button"
                className="settings-modal__close"
                onClick={handleCloseInviteModal}
                disabled={savingUser}
              >
                <X size={18} />
              </button>
            </header>

            {inviteSent ? (
              <div className="settings-invite-success">
                <div className="settings-invite-success__icon">
                  <MailCheck size={28} />
                </div>

                <h4>Convite enviado com sucesso</h4>

                <p>
                  Enviamos um convite para <strong>{invitedUser?.email}</strong>.
                  A pessoa recebera um link para criar o acesso e definir a propria senha.
                </p>

                <div className="settings-modal__notice">
                  Oriente o colaborador a verificar a caixa de entrada e tambem a pasta de spam ou lixo eletronico.
                </div>

                <footer className="settings-modal__footer">
                  <button
                    type="button"
                    className="settings-secondary-button"
                    onClick={handleCloseInviteModal}
                  >
                    Concluir
                  </button>

                  <button
                    type="button"
                    className="settings-primary-button"
                    onClick={handleOpenInviteModal}
                  >
                    <MailPlus size={16} />
                    Enviar outro convite
                  </button>
                </footer>
              </div>
            ) : (
              <form className="settings-modal__form" onSubmit={handleCreateCrmUser}>
                <label>
                  <span>Nome</span>
                  <input
                    value={newUser.nome}
                    onChange={(event) => {
                      setModalError('');
                      setNewUser((current) => ({
                        ...current,
                        nome: event.target.value,
                      }));
                    }}
                    placeholder="Nome do colaborador"
                    disabled={savingUser}
                  />
                </label>

                <label>
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(event) => {
                      setModalError('');
                      setNewUser((current) => ({
                        ...current,
                        email: event.target.value,
                      }));
                    }}
                    placeholder="email@empresa.com"
                    disabled={savingUser}
                  />
                </label>

                <label>
                  <span>Papel</span>
                  <select
                    value={newUser.papel}
                    onChange={(event) => {
                      setModalError('');
                      setNewUser((current) => ({
                        ...current,
                        papel: event.target.value,
                      }));
                    }}
                    disabled={savingUser}
                  >
                    <option value="dono">Dono</option>
                    <option value="gestor">Gestor</option>
                    <option value="funcionario">Funcionario</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </label>

                <div className="settings-modal__notice">
                  O colaborador recebera um convite por e-mail para criar o acesso e definir a propria senha.
                </div>

                {modalError && (
                  <div className="settings-modal__error">
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <footer className="settings-modal__footer">
                  <button
                    type="button"
                    className="settings-secondary-button"
                    onClick={handleCloseInviteModal}
                    disabled={savingUser}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="settings-primary-button"
                    disabled={savingUser}
                  >
                    <MailPlus size={16} />
                    {savingUser ? 'Enviando convite...' : 'Enviar convite'}
                  </button>
                </footer>
              </form>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

function SettingsStat({ label, value, icon: Icon, type }) {
  return (
    <article className={`settings-stat settings-stat--${type}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="settings-stat__icon">
        <Icon size={20} />
      </div>
    </article>
  );
}

function getInitials(value) {
  if (!value) return 'U';

  return String(value)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getResourceLabel(resourceId) {
  const found = PAGE_OPTIONS.find((page) => page.id === resourceId);

  return found?.label || resourceId;
}

function getUserStatusLabel(user) {
  if (!user.ativo) return 'Inativo';

  if (user.convite_status === 'enviado') return 'Convite enviado';

  if (user.convite_status === 'aceito') return 'Ativo';

  return INVITE_STATUS_LABELS[user.convite_status] || 'Ativo';
}

function formatDateTime(value) {
  if (!value) return 'Data nao registrada';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
