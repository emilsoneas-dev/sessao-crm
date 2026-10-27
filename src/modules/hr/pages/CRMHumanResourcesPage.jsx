import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Lock,
  MailPlus,
  Search,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import {
  createCrmUser,
  deleteCrmUser,
  disableCrmUserAccess,
  fetchCrmUsers,
} from '../../settings/services/settingsService.js';
import '../styles/hr.css';

const ROLE_LABELS = {
  dono: 'Dono',
  gestor: 'Gestor',
  funcionario: 'Colaborador',
  cliente: 'Cliente',
};

const INVITE_STATUS_LABELS = {
  ativo: 'Ativo',
  enviado: 'Convite enviado',
  aceito: 'Convite aceito',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
};

export function CRMHumanResourcesPage({ crmUser, onUsersTotalChange }) {
  const [activeTab, setActiveTab] = useState('colaboradores');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    papel: 'funcionario',
  });

  const isOwner = crmUser?.papel === 'dono';

  async function loadUsers({ silent = false } = {}) {
    try {
      setLoading(true);

      if (!silent) {
        setFeedback('');
      }

      const data = await fetchCrmUsers();
      setUsers(data);
      onUsersTotalChange?.(data.length);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      setFeedback('Nao foi possivel carregar os colaboradores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const content = [
        user.nome,
        user.email,
        user.papel,
        user.cargo,
        user.convite_status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !normalizedSearch || content.includes(normalizedSearch);
    });
  }, [users, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.ativo).length,
      managers: users.filter((user) => ['dono', 'gestor'].includes(user.papel)).length,
      invited: users.filter((user) => user.convite_status === 'enviado').length,
    };
  }, [users]);

  async function handleCreateUser(event) {
    event.preventDefault();

    if (!isOwner) {
      setFeedback('Apenas o dono pode cadastrar colaboradores.');
      return;
    }

    if (!newUser.nome.trim() || !newUser.email.trim()) {
      setFeedback('Preencha nome e e-mail do colaborador.');
      return;
    }

    try {
      setSaving(true);
      setFeedback('');

      await createCrmUser(newUser);
      setNewUser({
        nome: '',
        email: '',
        papel: 'funcionario',
      });
      setActiveTab('colaboradores');
      await loadUsers({ silent: true });
      setFeedback('Convite enviado com sucesso.');
      window.setTimeout(() => setFeedback(''), 3500);
    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error);
      setFeedback(error?.message || 'Nao foi possivel enviar o convite.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisableUser(user) {
    if (!isOwner) {
      setFeedback('Apenas o dono pode inativar colaboradores.');
      return;
    }

    if (!user?.id || user.email === crmUser?.email) return;

    const shouldDisable = window.confirm(`Inativar o acesso de ${user.nome || user.email}?`);

    if (!shouldDisable) return;

    try {
      setFeedback('');
      await disableCrmUserAccess(user.id);
      await loadUsers({ silent: true });
      setFeedback('Colaborador inativado.');
      window.setTimeout(() => setFeedback(''), 3500);
    } catch (error) {
      console.error('Erro ao inativar colaborador:', error);
      setFeedback('Nao foi possivel inativar o colaborador.');
    }
  }

  async function handleDeleteUser(user) {
    if (!isOwner) {
      setFeedback('Apenas o dono pode excluir colaboradores.');
      return;
    }

    if (!user?.id || !user?.email || user.email === crmUser?.email) return;

    const shouldDelete = window.confirm(
      `Excluir ${user.nome || user.email}? Essa acao remove o usuario e permissoes vinculadas.`
    );

    if (!shouldDelete) return;

    try {
      setFeedback('');
      await deleteCrmUser(user.id, user.email);
      await loadUsers({ silent: true });
      setFeedback('Colaborador excluido.');
      window.setTimeout(() => setFeedback(''), 3500);
    } catch (error) {
      console.error('Erro ao excluir colaborador:', error);
      setFeedback('Nao foi possivel excluir o colaborador.');
    }
  }

  return (
    <section className="hr-page">
      <section className="hr-panel">
        <div className="hr-tabs" aria-label="Secoes de recursos humanos">
          <button
            type="button"
            className={activeTab === 'colaboradores' ? 'is-active' : ''}
            onClick={() => setActiveTab('colaboradores')}
          >
            <Users size={15} />
            Colaboradores
          </button>

          <button
            type="button"
            className={activeTab === 'cadastro' ? 'is-active' : ''}
            onClick={() => setActiveTab('cadastro')}
          >
            <MailPlus size={15} />
            Cadastro
          </button>
        </div>

        {feedback && <div className="hr-feedback">{feedback}</div>}

        {activeTab === 'colaboradores' ? (
          <>
            <div className="hr-stats">
              <HRStat label="Colaboradores" value={stats.total} icon={Users} tone="blue" />
              <HRStat label="Ativos" value={stats.active} icon={CheckCircle2} tone="green" />
              <HRStat label="Gestao" value={stats.managers} icon={Shield} tone="purple" />
              <HRStat label="Convites" value={stats.invited} icon={MailPlus} tone="amber" />
            </div>

            <div className="hr-list-card">
              <div className="hr-list-card__header">
                <div>
                  <strong>Colaboradores</strong>
                  <span>{filteredUsers.length} de {users.length} registro(s)</span>
                </div>

                <label className="hr-search">
                  <Search size={16} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar nome, e-mail ou cargo..."
                  />
                </label>
              </div>

              {loading ? (
                <div className="hr-empty">Carregando colaboradores...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="hr-empty">Nenhum colaborador encontrado.</div>
              ) : (
                <div className="hr-users-table">
                  <div className="hr-users-table__head">
                    <span>Colaborador</span>
                    <span>Cargo</span>
                    <span>Acesso</span>
                    <span>Status</span>
                    <span>Entrada</span>
                    <span>Acoes</span>
                  </div>

                  {filteredUsers.map((user) => (
                    <article className="hr-user-row" key={user.id || user.email}>
                      <div className="hr-user-row__identity">
                        <div className="hr-avatar">{getInitials(user.nome || user.email)}</div>
                        <div>
                          <strong>{user.nome || 'Usuario sem nome'}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>

                      <div className="hr-user-row__meta">
                        <strong>{user.cargo || ROLE_LABELS[user.papel] || 'Colaborador'}</strong>
                        <span>Funcao</span>
                      </div>

                      <div>
                        <span className={`hr-badge hr-badge--${user.papel || 'funcionario'}`}>
                          {ROLE_LABELS[user.papel] || user.papel || 'Colaborador'}
                        </span>
                      </div>

                      <div>
                        <span className={`hr-status ${user.ativo ? 'is-active' : 'is-inactive'}`}>
                          {getUserStatusLabel(user)}
                        </span>
                      </div>

                      <div className="hr-user-row__date">
                        <CalendarDays size={15} />
                        <span>{formatDate(user.criado_em)}</span>
                      </div>

                      <div className="hr-row-actions">
                        {isOwner && user.email !== crmUser?.email ? (
                          <>
                            {user.ativo && (
                              <button
                                type="button"
                                className="hr-action-button is-warning"
                                onClick={() => handleDisableUser(user)}
                              >
                                <Lock size={14} />
                                Inativar
                              </button>
                            )}

                            <button
                              type="button"
                              className="hr-action-button is-danger"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 size={14} />
                              Excluir
                            </button>
                          </>
                        ) : (
                          <span className="hr-row-actions__muted">
                            {user.email === crmUser?.email ? 'Voce' : 'Restrito'}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <form className="hr-register-card" onSubmit={handleCreateUser}>
            <div className="hr-register-card__header">
              <div>
                <strong>Cadastro de colaborador</strong>
                <span>Envie um convite para criar acesso ao CRM.</span>
              </div>
            </div>

            <div className="hr-form-grid">
              <HRField
                label="Nome completo"
                value={newUser.nome}
                onChange={(value) => setNewUser((current) => ({ ...current, nome: value }))}
                placeholder="Nome do colaborador"
                required
              />

              <HRField
                label="E-mail"
                type="email"
                value={newUser.email}
                onChange={(value) => setNewUser((current) => ({ ...current, email: value }))}
                placeholder="email@empresa.com"
                required
              />

              <label className="hr-field">
                <span>Nivel de permissao</span>
                <select
                  value={newUser.papel}
                  onChange={(event) => setNewUser((current) => ({ ...current, papel: event.target.value }))}
                  disabled={saving}
                >
                  <option value="dono">Dono</option>
                  <option value="gestor">Gestor</option>
                  <option value="funcionario">Colaborador</option>
                  <option value="cliente">Cliente</option>
                </select>
              </label>

              <HRField label="Funcao/cargo" value="" placeholder="Disponivel na proxima etapa de perfil" disabled />
              <HRField label="Data de nascimento" type="date" value="" disabled />
              <HRField label="Telefone" value="" placeholder="Disponivel na proxima etapa de perfil" disabled />
            </div>

            <div className="hr-register-note">
              O cadastro atual envia convite por e-mail. Campos como foto, telefone, documentos e cargo detalhado precisam de colunas extras no Supabase antes de salvar definitivamente.
            </div>

            <section className="hr-attachments-preview">
              <h3>Anexos futuros</h3>
              <div>
                <span>Contrato de trabalho</span>
                <span>Confidencialidade</span>
                <span>Equipamentos e sistemas</span>
              </div>
            </section>

            <footer className="hr-form-footer">
              <button type="button" className="hr-tool-button" onClick={() => setActiveTab('colaboradores')} disabled={saving}>
                Voltar
              </button>

              <button type="submit" className="hr-primary-button" disabled={saving || !isOwner}>
                <MailPlus size={16} />
                {saving ? 'Enviando...' : 'Cadastrar colaborador'}
              </button>
            </footer>

            {!isOwner && (
              <div className="hr-feedback is-warning">
                Apenas o dono pode convidar colaboradores.
              </div>
            )}
          </form>
        )}
      </section>
    </section>
  );
}

function HRStat({ label, value, icon: Icon, tone }) {
  return (
    <div className={`hr-stat hr-stat--${tone}`}>
      <span><Icon size={17} /></span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function HRField({ label, value, onChange = () => {}, type = 'text', placeholder = '', disabled = false, required = false }) {
  return (
    <label className="hr-field">
      <span>{label}{required ? ' *' : ''}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function getUserStatusLabel(user) {
  if (!user?.ativo) return 'Inativo';

  return INVITE_STATUS_LABELS[user.convite_status] || 'Ativo';
}

function getInitials(value) {
  if (!value) return 'RH';

  return String(value)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}
