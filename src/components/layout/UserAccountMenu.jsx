import { useMemo, useState } from 'react';
import { Bell, Camera, LogOut, Settings, UserRound, X } from 'lucide-react';
import './user-account-menu.css';

const ROLE_LABELS = {
  dono: 'Dono',
  gestor: 'Gestor',
  funcionario: 'Funcionario',
  cliente: 'Cliente',
};

export function UserAccountMenu({
  user,
  userEmail = '',
  theme = 'light',
  onToggleTheme,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const account = useMemo(() => {
    const name = user?.nome || getNameFromEmail(userEmail) || 'Usuario';
    const email = user?.email || userEmail || '';
    const role = ROLE_LABELS[user?.papel] || user?.papel || 'Perfil';

    return {
      name,
      email,
      role,
      initials: getInitials(name || email),
      photoUrl: user?.foto_url || '',
      birthDate: user?.data_nascimento || '',
      jobTitle: user?.cargo || '',
      phone: user?.telefone || '',
    };
  }, [user, userEmail]);

  const birthdayMessage = getBirthdayMessage(account.birthDate, account.name);

  function handleOpenProfile() {
    setOpen(false);
    setProfileOpen(true);
  }

  function handleOpenSettings() {
    setOpen(false);
    setSettingsOpen(true);
  }

  function handleLogout() {
    setOpen(false);
    onLogout?.();
  }

  return (
    <div className="account-menu">
      <button
        className="account-menu__trigger"
        type="button"
        aria-label="Abrir menu da conta"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <AccountAvatar account={account} />
        <span>{account.name}</span>
      </button>

      {open && (
        <div className="account-menu__dropdown">
          <div className="account-menu__identity">
            <AccountAvatar account={account} large />
            <div>
              <strong>{account.name}</strong>
              {account.email && <span>{account.email}</span>}
              <small>{account.role}</small>
            </div>
          </div>

          {birthdayMessage && (
            <div className="account-menu__birthday">
              {birthdayMessage}
            </div>
          )}

          <div className="account-menu__actions">
            <button type="button" onClick={handleOpenProfile}>
              <UserRound size={16} />
              Perfil
            </button>
            <button type="button" onClick={handleOpenSettings}>
              <Settings size={16} />
              Configuracoes
            </button>
            <button type="button" className="is-danger" onClick={handleLogout}>
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}

      {profileOpen && (
        <AccountProfileModal account={account} onClose={() => setProfileOpen(false)} />
      )}

      {settingsOpen && (
        <AccountSettingsModal
          theme={theme}
          onToggleTheme={onToggleTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function AccountAvatar({ account, large = false }) {
  return (
    <span className={`account-avatar ${large ? 'is-large' : ''}`}>
      {account.photoUrl ? (
        <img src={account.photoUrl} alt="" />
      ) : (
        account.initials
      )}
    </span>
  );
}

function AccountProfileModal({ account, onClose }) {
  return (
    <div className="account-modal-backdrop" role="presentation">
      <section className="account-modal" role="dialog" aria-modal="true" aria-label="Perfil do usuario">
        <header className="account-modal__header">
          <div>
            <p>Perfil</p>
            <h2>Dados da conta</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar perfil">
            <X size={18} />
          </button>
        </header>

        <div className="account-modal__body">
          <div className="account-profile-photo">
            <AccountAvatar account={account} large />
            <button type="button" disabled title="Disponivel apos liberar os campos de perfil no Supabase">
              <Camera size={16} />
              Alterar foto
            </button>
          </div>

          <div className="account-form-grid">
            <ProfileField label="Nome" value={account.name} />
            <ProfileField label="E-mail" value={account.email || 'Nao informado'} readOnly />
            <ProfileField label="Data de nascimento" value={formatDate(account.birthDate)} />
            <ProfileField label="Cargo / funcao" value={account.jobTitle || 'Nao informado'} />
            <ProfileField label="Telefone" value={account.phone || 'Nao informado'} />
            <ProfileField label="Perfil" value={account.role} readOnly />
          </div>

          <p className="account-modal__note">
            A edicao completa do perfil precisa dos campos de perfil liberados no Supabase.
          </p>
        </div>

        <footer className="account-modal__footer">
          <button type="button" className="ui-button ui-button--secondary" onClick={onClose}>
            Fechar
          </button>
        </footer>
      </section>
    </div>
  );
}

function AccountSettingsModal({ theme, onToggleTheme, onClose }) {
  return (
    <div className="account-modal-backdrop" role="presentation">
      <section className="account-modal account-modal--settings" role="dialog" aria-modal="true" aria-label="Configuracoes da conta">
        <header className="account-modal__header">
          <div>
            <p>Configuracoes</p>
            <h2>Preferencias do sistema</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar configuracoes">
            <X size={18} />
          </button>
        </header>

        <div className="account-modal__body">
          <button type="button" className="account-setting-row" onClick={onToggleTheme}>
            <div>
              <strong>Tema do sistema</strong>
              <span>Alternar entre claro e escuro.</span>
            </div>
            <small>{theme === 'dark' ? 'Escuro' : 'Claro'}</small>
          </button>

          <div className="account-setting-row is-disabled">
            <div>
              <strong>Notificacoes</strong>
              <span>Alertas de carteira, aniversarios e pendencias.</span>
            </div>
            <Bell size={17} />
          </div>

          <div className="account-setting-row is-disabled">
            <div>
              <strong>Preferencias de visualizacao</strong>
              <span>Padroes de listas, kanban e filtros.</span>
            </div>
            <small>Em breve</small>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileField({ label, value, readOnly = false }) {
  return (
    <label className="account-profile-field">
      <span>{label}</span>
      <input value={value || ''} readOnly disabled={readOnly || true} />
    </label>
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

function getNameFromEmail(email) {
  if (!email) return '';
  return String(email).split('@')[0] || '';
}

function formatDate(date) {
  if (!date) return 'Nao informado';
  const parts = getDateParts(date);

  if (parts) {
    return `${String(parts.day).padStart(2, '0')}/${String(parts.month + 1).padStart(2, '0')}/${parts.year}`;
  }

  return 'Nao informado';
}

function getBirthdayMessage(date, name) {
  if (!date) return '';

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
