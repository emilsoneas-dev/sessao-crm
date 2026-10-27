import { useEffect, useRef, useState } from 'react';
import { CRMLeadsPage } from '../modules/leads/pages/CRMLeadsPage.jsx';
import LoginPage from '../modules/auth/pages/LoginPage.jsx';
import SetPasswordPage from '../modules/auth/pages/SetPasswordPage.jsx';
import { InstagramMagicPreviewPage } from '../modules/instagram/pages/InstagramMagicPreviewPage.jsx';
import { InstagramAuthCompletePage } from '../modules/instagram/pages/InstagramAuthCompletePage.jsx';
import { ContentMagicReviewPage } from '../modules/content/pages/ContentMagicReviewPage.jsx';
import { supabase } from '../services/supabase/supabaseClient.js';
import { fetchCurrentCrmUser } from '../modules/auth/services/authService.js';
import { fetchUserExtraPermissions } from '../modules/auth/services/permissionsService.js';

function AccessBlocked({ message, onLogout }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__header">
          <h1>Acesso não liberado</h1>
          <p>{message}</p>
        </div>

        <button className="auth-submit" type="button" onClick={onLogout}>
          Sair e tentar novamente
        </button>
      </section>
    </main>
  );
}

function AppLoading() {
  return (
    <div className="app-loading-screen" role="status" aria-label="Carregando">
      <span className="app-loading-spinner" />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [crmUser, setCrmUser] = useState(null);
  const [extraPermissions, setExtraPermissions] = useState([]);
  const [checkingSession, setCheckingSession] = useState(true);
  const [accessError, setAccessError] = useState('');
  const initialSessionCheckedRef = useRef(false);

  const isSetPasswordPage = window.location.pathname === '/set-password';
  const isInstagramMagicPreviewPage = window.location.pathname.startsWith('/instagram-preview/');
  const isInstagramAuthCompletePage = window.location.pathname === '/instagram-auth-complete';
  const isContentMagicReviewPage = window.location.pathname.startsWith('/conteudo-revisao/');

  async function getCrmUserSafely(currentSession) {
    try {
      const timeoutPromise = new Promise((resolve) => {
        window.setTimeout(() => resolve(null), 4000);
      });

      const userPromise = fetchCurrentCrmUser(currentSession);
      const user = await Promise.race([userPromise, timeoutPromise]);

      return user || null;
    } catch (error) {
      console.error('Erro ao carregar usuário do CRM:', error);
      return null;
    }
  }

  async function getExtraPermissionsSafely(email) {
    if (!email) return [];

    try {
      const timeoutPromise = new Promise((resolve) => {
        window.setTimeout(() => resolve([]), 4000);
      });

      const permissionsPromise = fetchUserExtraPermissions(email);
      const permissions = await Promise.race([permissionsPromise, timeoutPromise]);

      return permissions || [];
    } catch (error) {
      console.error('Erro ao carregar permissões extras:', error);
      return [];
    }
  }

  async function loadUserAccess(currentSession) {
    setAccessError('');

    if (!currentSession) {
      setCrmUser(null);
      setExtraPermissions([]);
      return;
    }

    const user = await getCrmUserSafely(currentSession);

    if (!user) {
      setCrmUser(null);
      setExtraPermissions([]);
      setAccessError(
        'Seu login existe no Supabase, mas ainda não há um usuário ativo liberado no CRM.'
      );
      return;
    }

    const permissions = await getExtraPermissionsSafely(currentSession?.user?.email);

    setCrmUser(user);
    setExtraPermissions(permissions);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao verificar sessão:', error);
        }

        if (!isMounted) return;

        const currentSession = data?.session || null;

        setSession(currentSession);

        if (currentSession) {
          const user = await getCrmUserSafely(currentSession);

          if (!isMounted) return;

          if (!user) {
            setCrmUser(null);
            setExtraPermissions([]);
            setAccessError(
              'Seu login existe no Supabase, mas ainda não há um usuário ativo liberado no CRM.'
            );
            return;
          }

          const permissions = await getExtraPermissionsSafely(currentSession?.user?.email);

          if (isMounted) {
            setCrmUser(user);
            setExtraPermissions(permissions);
            setAccessError('');
          }
        } else {
          setCrmUser(null);
          setExtraPermissions([]);
          setAccessError('');
        }
      } catch (error) {
        console.error('Erro geral ao iniciar o CRM:', error);

        if (isMounted) {
          setSession(null);
          setCrmUser(null);
          setExtraPermissions([]);
          setAccessError('Não foi possível validar seu acesso agora.');
        }
      } finally {
        if (isMounted) {
          initialSessionCheckedRef.current = true;
          setCheckingSession(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }

      setSession(currentSession);

      if (!currentSession) {
        setCrmUser(null);
        setExtraPermissions([]);
        setAccessError('');
        setCheckingSession(false);
        return;
      }

      window.setTimeout(async () => {
        if (!isMounted) return;

        const shouldShowInitialLoading = !initialSessionCheckedRef.current;

        if (shouldShowInitialLoading) {
          setCheckingSession(true);
        }

        await loadUserAccess(currentSession);

        if (isMounted) {
          initialSessionCheckedRef.current = true;

          if (shouldShowInitialLoading) {
            setCheckingSession(false);
          }
        }
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro ao sair:', error);
      return;
    }

    setSession(null);
    setCrmUser(null);
    setExtraPermissions([]);
    setAccessError('');

    window.history.pushState({}, '', '/leads');
  }

  function handlePasswordCreated() {
    window.history.replaceState({}, '', '/leads');
    window.location.reload();
  }

  async function handleLogin(currentSession) {
    setSession(currentSession);
    setCheckingSession(true);
    await loadUserAccess(currentSession);
    setCheckingSession(false);
  }

  if (isInstagramMagicPreviewPage) {
    return <InstagramMagicPreviewPage />;
  }

  if (isInstagramAuthCompletePage) {
    return <InstagramAuthCompletePage />;
  }

  if (isContentMagicReviewPage) {
    return <ContentMagicReviewPage />;
  }

  if (checkingSession) {
    return <AppLoading />;
  }

  if (isSetPasswordPage) {
    return (
      <SetPasswordPage
        onPasswordCreated={handlePasswordCreated}
      />
    );
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (accessError || !crmUser) {
    return <AccessBlocked message={accessError || 'Seu usuário não está ativo no CRM.'} onLogout={handleLogout} />;
  }

  return (
    <CRMLeadsPage
      onLogout={handleLogout}
      session={session}
      crmUser={crmUser}
      extraPermissions={extraPermissions}
    />
  );
}
