import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { supabase } from '../../../services/supabase/supabaseClient.js';
import logoPanorama from '../../../assets/img/logo-panorama.webp';
import '../styles/auth.css';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      setFeedback('Preencha e-mail e senha.');
      return;
    }

    try {
      setLoading(true);
      setFeedback('');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        setFeedback('E-mail ou senha inválidos.');
        return;
      }

      onLogin?.(data.session);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setFeedback('Não foi possível acessar agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-background" aria-hidden="true">
        <span className="auth-orb auth-orb--one" />
        <span className="auth-orb auth-orb--two" />
        <span className="auth-orb auth-orb--three" />
        <span className="auth-light auth-light--one" />
        <span className="auth-light auth-light--two" />
      </div>

      <section className="auth-card">
        <div className="auth-logo">
          <img src={logoPanorama} alt="Panorama" />
        </div>

        <div className="auth-card__header">
          <h1>Acesse sua conta</h1>
          <p>Central estratégica de gestão</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>E-mail</span>

            <div className="auth-field__control">
              <Mail size={16} />

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@empresa.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Senha</span>

            <div className="auth-field__control">
              <Lock size={16} />

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {feedback && (
            <div className="auth-feedback">
              {feedback}
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <footer className="auth-card__footer">
          <span>Acesso protegido para administradores e equipe</span>
        </footer>
      </section>
    </main>
  );
}

export { LoginPage };
export default LoginPage;