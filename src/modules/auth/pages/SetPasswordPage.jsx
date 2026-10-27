import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../services/supabase/supabaseClient.js';
import '../styles/auth.css';

export default function SetPasswordPage({ onPasswordCreated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInviteSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        const currentEmail = data?.session?.user?.email || '';

        if (isMounted) {
          setEmail(currentEmail);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão do convite:', error);

        if (isMounted) {
          setErrorMessage(
            'Não foi possível validar seu convite. Tente abrir o link novamente.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingSession(false);
        }
      }
    }

    loadInviteSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreatePassword(event) {
    event.preventDefault();

    setErrorMessage('');

    if (!email) {
      setErrorMessage('Convite inválido ou expirado. Solicite um novo convite.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage('Preencha a senha e a confirmação.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não conferem.');
      return;
    }

    try {
      setSaving(true);

      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password,
      });

      if (updatePasswordError) {
        throw updatePasswordError;
      }

      const now = new Date().toISOString();

      const { error: updateCrmUserError } = await supabase
        .from('crm_usuarios')
        .update({
          convite_status: 'aceito',
          convite_aceito_em: now,
          ativo: true,
          atualizado_em: now,
        })
        .eq('email', email);

      if (updateCrmUserError) {
        console.error('Senha criada, mas erro ao atualizar CRM:', updateCrmUserError);
      }

      setSuccess(true);

      window.setTimeout(() => {
        if (typeof onPasswordCreated === 'function') {
          onPasswordCreated();
          return;
        }

        window.history.replaceState({}, '', '/leads');
        window.location.reload();
      }, 1200);
    } catch (error) {
      console.error('Erro ao criar senha:', error);
      setErrorMessage(
        error?.message || 'Não foi possível criar sua senha. Tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingSession) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-loading">Validando convite...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand__mark">
            <ShieldCheck size={28} />
          </div>

          <div>
            <p>Novo acesso</p>
            <h1>Criar senha</h1>
          </div>
        </div>

        {success ? (
          <div className="auth-success">
            <div className="auth-success__icon">
              <CheckCircle2 size={30} />
            </div>

            <h2>Senha criada com sucesso</h2>
            <p>Seu acesso foi configurado. Você será redirecionado para o CRM.</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleCreatePassword}>
            <label>
              <span>E-mail do convite</span>
              <input
                type="email"
                value={email}
                disabled
                readOnly
              />
            </label>

            <label>
              <span>Senha</span>
              <div className="auth-password-field">
                <Lock size={16} />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label>
              <span>Confirmar senha</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </label>

            {errorMessage && (
              <div className="auth-error">
                {errorMessage}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Criando acesso...' : 'Criar meu acesso'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}