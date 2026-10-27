import { useEffect, useMemo, useState } from 'react';
import {
  AtSign,
  BarChart3,
  Camera,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  ExternalLink,
  ImageIcon,
  LayoutGrid,
  Mail,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  INSTAGRAM_CONTENT_STATUS,
  INSTAGRAM_CONTENT_TYPES,
  INSTAGRAM_PLANNING_STATUS,
} from '../constants.js';
import {
  createInstagramClientAuthLink,
  createInstagramMagicLink,
  deleteInstagramPost,
  duplicateInstagramPost,
  fetchActiveInstagramProfiles,
  fetchLatestInstagramMagicLink,
  fetchInstagramMonthlyPlanning,
  fetchInstagramPostsByProfile,
  saveInstagramMonthlyPlanning,
  saveInstagramPost,
  startInstagramOAuth,
  syncInstagramProfileFromMeta,
  updateInstagramProfile,
} from '../services/instagramService.js';
import '../styles/instagram.css';

const BASIC_TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'reels', label: 'Reels' },
  { id: 'resultados', label: 'Resultados' },
];

const POST_EDITOR_STATUS = [
  'rascunho',
  'em_revisao',
  'aprovado',
  'agendado',
  'reprovado',
  'ajuste_solicitado',
  'publicado',
];

export function InstagramDashboardPage({ onTotalChange, onNavigate }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthReference);
  const [planningRecord, setPlanningRecord] = useState(null);
  const [planningDraft, setPlanningDraft] = useState(createPlanningDraft());
  const [loadingPlanning, setLoadingPlanning] = useState(false);
  const [savingPlanning, setSavingPlanning] = useState(false);
  const [planningFeedback, setPlanningFeedback] = useState('');
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsFeedback, setPostsFeedback] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [savingPost, setSavingPost] = useState(false);
  const [magicLink, setMagicLink] = useState(null);
  const [latestMagicLink, setLatestMagicLink] = useState(null);
  const [magicLinkFeedback, setMagicLinkFeedback] = useState('');
  const [generatingMagicLink, setGeneratingMagicLink] = useState(false);
  const [workspaceProfileId, setWorkspaceProfileId] = useState('');
  const [workspaceSection, setWorkspaceSection] = useState('status');
  const [postsByProfile, setPostsByProfile] = useState({});
  const [editingProfile, setEditingProfile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [connectingProfileId, setConnectingProfileId] = useState('');
  const [generatingClientAuthLink, setGeneratingClientAuthLink] = useState(false);
  const [clientAuthLink, setClientAuthLink] = useState(null);
  const [syncingProfileId, setSyncingProfileId] = useState('');
  const [connectionFeedback, setConnectionFeedback] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadProfiles() {
      try {
        setLoading(true);
        setFeedback('');
        const data = await fetchActiveInstagramProfiles();

        if (!ignore) {
          setProfiles(data);
          onTotalChange?.(data.length);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard Instagram:', error);

        if (!ignore) {
          setProfiles([]);
          onTotalChange?.(0);
          setFeedback('Nao foi possivel carregar os perfis Instagram.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProfiles();

    return () => {
      ignore = true;
    };
  }, [onTotalChange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const status = params.get('instagram_connection');
    const reason = params.get('reason');

    if (!status) return;

    setFeedback(
      status === 'success'
        ? 'Instagram conectado. Agora sincronize o perfil para atualizar foto, usuario, bio e metricas.'
        : getInstagramConnectionReason(reason)
    );

    params.delete('instagram_connection');
    params.delete('reason');

    const cleanSearch = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', cleanUrl);
  }, []);

  useEffect(() => {
    if (profiles.length === 0) {
      setSelectedProfileId('');
      setWorkspaceProfileId('');
      return;
    }

    const selectedProfileExists = profiles.some((profile) => profile.id === selectedProfileId);
    const workspaceProfileExists = profiles.some((profile) => profile.id === workspaceProfileId);

    if (!selectedProfileId || !selectedProfileExists) {
      setSelectedProfileId(profiles[0].id);
    }

    if (workspaceProfileId && !workspaceProfileExists) {
      setWorkspaceProfileId('');
    }
  }, [profiles, selectedProfileId, workspaceProfileId]);

  useEffect(() => {
    let ignore = false;

    async function loadProfilesPosts() {
      if (profiles.length === 0) {
        setPostsByProfile({});
        return;
      }

      try {
        const entries = await Promise.all(
          profiles.map(async (profile) => {
            const profilePosts = await fetchInstagramPostsByProfile(profile.id);

            return [profile.id, profilePosts];
          })
        );

        if (!ignore) {
          setPostsByProfile(Object.fromEntries(entries));
        }
      } catch (error) {
        console.error('Erro ao carregar resumo de posts Instagram:', error);

        if (!ignore) {
          setPostsByProfile({});
        }
      }
    }

    loadProfilesPosts();

    return () => {
      ignore = true;
    };
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return profiles;

    return profiles.filter((profile) => {
      const client = profile.cliente || {};
      const content = [
        client.nome,
        client.empresa,
        client.email,
        profile.nome,
        profile.usuario,
        profile.site,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return content.includes(normalizedSearch);
    });
  }, [profiles, searchTerm]);

  const summary = useMemo(() => {
    const profilesWithUser = profiles.filter((profile) => profile.usuario).length;
    const profilesWithPhoto = profiles.filter((profile) => profile.foto_url).length;
    const connectedProfiles = profiles.filter((profile) => getInstagramConnectionStatus(profile).connected).length;
    const updatedProfiles = profiles.filter((profile) => {
      if (!profile.atualizado_em) return false;

      const updatedAt = new Date(profile.atualizado_em);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return updatedAt >= thirtyDaysAgo;
    }).length;

    const allPosts = Object.values(postsByProfile).flat();
    const pendingPosts = allPosts.filter((post) => ['em_revisao', 'aguardando_aprovacao', 'rascunho'].includes(getPostApprovalStatus(post)) || post.status === 'rascunho').length;
    const publishedPosts = allPosts.filter((post) => post.status === 'publicado').length;
    const adjustmentsPosts = allPosts.filter((post) => ['ajuste_solicitado', 'reprovado'].includes(getPostApprovalStatus(post))).length;
    const readyProfiles = profiles.filter((profile) => {
      const profilePosts = postsByProfile[profile.id] || [];
      return profilePosts.length > 0 && profilePosts.every((post) => getPostApprovalStatus(post) === 'aprovado');
    }).length;
    const activeStrategies = profiles.filter((profile) => postsByProfile[profile.id]?.length > 0).length;
    const nextPosts = allPosts.filter((post) => isUpcomingPost(post)).length;

    return {
      total: profiles.length,
      profilesWithUser,
      profilesWithPhoto,
      connectedProfiles,
      updatedProfiles,
      plannedPosts: allPosts.length,
      publishedPosts,
      pendingPosts,
      adjustmentsPosts,
      readyProfiles,
      activeStrategies,
      nextPosts,
    };
  }, [postsByProfile, profiles]);

  const portfolioInsights = useMemo(() => {
    return getInstagramPortfolioInsights(profiles, postsByProfile);
  }, [postsByProfile, profiles]);

  const selectedProfile = useMemo(() => {
    return profiles.find((profile) => profile.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  useEffect(() => {
    let ignore = false;

    async function loadPlanning() {
      if (!selectedProfile?.id || !selectedMonth) {
        setPlanningRecord(null);
        setPlanningDraft(createPlanningDraft());
        setPlanningFeedback('');
        return;
      }

      try {
        setLoadingPlanning(true);
        setPlanningFeedback('');
        const data = await fetchInstagramMonthlyPlanning(selectedProfile.id, selectedMonth);

        if (!ignore) {
          setPlanningRecord(data);
          setPlanningDraft(createPlanningDraft(data));
        }
      } catch (error) {
        console.error('Erro ao carregar planejamento Instagram:', error);

        if (!ignore) {
          setPlanningRecord(null);
          setPlanningDraft(createPlanningDraft());
          setPlanningFeedback('Nao foi possivel carregar o planejamento mensal.');
        }
      } finally {
        if (!ignore) {
          setLoadingPlanning(false);
        }
      }
    }

    loadPlanning();

    return () => {
      ignore = true;
    };
  }, [selectedProfile, selectedMonth]);

  useEffect(() => {
    let ignore = false;

    async function loadPosts() {
      if (!selectedProfile?.id) {
        setPosts([]);
        setPostsFeedback('');
        setSelectedPost(null);
        return;
      }

      try {
        setLoadingPosts(true);
        setPostsFeedback('');
        const data = await fetchInstagramPostsByProfile(selectedProfile.id);

        if (!ignore) {
          setPosts(data);
        }
      } catch (error) {
        console.error('Erro ao carregar posts Instagram:', error);

        if (!ignore) {
          setPosts([]);
          setPostsFeedback('Nao foi possivel carregar os posts planejados.');
        }
      } finally {
        if (!ignore) {
          setLoadingPosts(false);
        }
      }
    }

    loadPosts();

    return () => {
      ignore = true;
    };
  }, [selectedProfile]);

  useEffect(() => {
    let ignore = false;

    async function loadLatestMagicLink() {
      setMagicLink(null);
      setMagicLinkFeedback('');

      if (!selectedProfile?.id) {
        setLatestMagicLink(null);
        return;
      }

      try {
        const data = await fetchLatestInstagramMagicLink(selectedProfile.id);

        if (!ignore) {
          setLatestMagicLink(data);
        }
      } catch (error) {
        console.error('Erro ao carregar ultimo link magico Instagram:', error);

        if (!ignore) {
          setLatestMagicLink(null);
          setMagicLinkFeedback('Nao foi possivel carregar o ultimo link gerado.');
        }
      }
    }

    loadLatestMagicLink();

    return () => {
      ignore = true;
    };
  }, [selectedProfile]);

  const monthlyPosts = useMemo(() => {
    if (!selectedMonth) return posts;

    return posts.filter((post) => {
      const postMonth = post.mes_referencia || String(post.data_prevista || '').slice(0, 7);

      return postMonth === selectedMonth;
    });
  }, [posts, selectedMonth]);

  const visiblePreviewPosts = useMemo(() => {
    if (activeTab === 'feed') {
      return monthlyPosts.filter((post) => ['feed', 'carrossel'].includes(post.tipo || 'feed'));
    }

    if (activeTab === 'reels') {
      return monthlyPosts.filter((post) => post.tipo === 'reels');
    }

    return monthlyPosts;
  }, [activeTab, monthlyPosts]);

  const usingPreviewPlaceholders = !loadingPosts && monthlyPosts.length === 0 && Boolean(selectedProfile);
  const previewDisplayPosts = useMemo(() => {
    if (usingPreviewPlaceholders) {
      return createPreviewPlaceholderPosts(activeTab, selectedMonth);
    }

    return visiblePreviewPosts;
  }, [activeTab, selectedMonth, usingPreviewPlaceholders, visiblePreviewPosts]);

  const previewStats = useMemo(() => {
    return {
      posts: monthlyPosts.length,
      followers: formatCompactNumber(selectedProfile?.seguidores || selectedProfile?.seguidores_total || 0),
      following: formatCompactNumber(selectedProfile?.seguindo || selectedProfile?.seguindo_total || 0),
    };
  }, [monthlyPosts.length, selectedProfile]);

  const feedbackSummary = useMemo(() => {
    return getInstagramFeedbackSummary(monthlyPosts);
  }, [monthlyPosts]);

  const monthStatus = useMemo(() => {
    return getInstagramMonthStatus({
      planningRecord,
      planningDraft,
      posts: monthlyPosts,
      feedbackSummary,
      hasMagicLink: hasUsableMagicLink(magicLink, latestMagicLink),
    });
  }, [feedbackSummary, latestMagicLink, magicLink, monthlyPosts, planningDraft, planningRecord]);

  const monthPackage = useMemo(() => {
    return getInstagramMonthPackage({
      profile: selectedProfile,
      monthReference: selectedMonth,
      posts: monthlyPosts,
      feedbackSummary,
      monthStatus,
      magicLink,
      latestMagicLink,
    });
  }, [feedbackSummary, latestMagicLink, magicLink, monthStatus, monthlyPosts, selectedMonth, selectedProfile]);

  const monthTimeline = useMemo(() => {
    return getInstagramMonthTimeline({
      planningRecord,
      posts: monthlyPosts,
      latestMagicLink,
    });
  }, [latestMagicLink, monthlyPosts, planningRecord]);

  const calendarWeeks = useMemo(() => {
    return buildCalendarWeeks(selectedMonth, monthlyPosts);
  }, [selectedMonth, monthlyPosts]);

  const workspaceTabs = useMemo(() => {
    return getInstagramWorkspaceTabs({
      planningRecord,
      monthlyPosts,
      feedbackSummary,
      hasMagicLink: hasUsableMagicLink(magicLink, latestMagicLink),
    });
  }, [feedbackSummary, latestMagicLink, magicLink, monthlyPosts, planningRecord]);

  const dashboardHealth = useMemo(() => {
    return getInstagramDashboardHealth(summary);
  }, [summary]);

  function handleChangePlanningDraft(field, value) {
    setPlanningFeedback('');
    setPlanningDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSavePlanning(event) {
    event.preventDefault();

    if (!selectedProfile?.id) {
      setPlanningFeedback('Selecione um perfil Instagram para planejar o mes.');
      return;
    }

    try {
      setSavingPlanning(true);
      setPlanningFeedback('');
      const data = await saveInstagramMonthlyPlanning(selectedProfile, selectedMonth, planningDraft);
      setPlanningRecord(data);
      setPlanningDraft(createPlanningDraft(data));
      setPlanningFeedback('Planejamento mensal salvo.');
    } catch (error) {
      console.error('Erro ao salvar planejamento Instagram:', error);
      setPlanningFeedback(getInstagramActionError(error, 'Nao foi possivel salvar o planejamento mensal.'));
    } finally {
      setSavingPlanning(false);
    }
  }

  function handleOpenNewPostEditor() {
    if (!selectedProfile?.id) {
      setPostsFeedback('Selecione um perfil Instagram antes de criar o post.');
      return;
    }

    setPostsFeedback('');
    setEditingPost(createPostDraft({
      tipo: activeTab === 'reels' ? 'reels' : 'feed',
      mes_referencia: selectedMonth,
      data_prevista: getDefaultPostDate(selectedMonth),
    }));
  }

  function handleOpenWorkspace(profile, section = 'status') {
    setSelectedProfileId(profile.id);
    setWorkspaceProfileId(profile.id);
    setWorkspaceSection(section);
    setSelectedPost(null);
    setEditingPost(null);
    setPostsFeedback('');
    setPlanningFeedback('');
    setConnectionFeedback('');
    setClientAuthLink(null);
  }

  function handleCloseWorkspace() {
    setWorkspaceProfileId('');
    setWorkspaceSection('status');
    setSelectedPost(null);
    setEditingPost(null);
  }

  async function handleSaveProfile(profileDraft) {
    if (!profileDraft?.id) return;

    try {
      setSavingProfile(true);
      setFeedback('');
      const updatedProfile = await updateInstagramProfile(profileDraft.id, profileDraft);

      setProfiles((currentProfiles) => currentProfiles.map((profile) => (
        profile.id === updatedProfile.id
          ? { ...profile, ...updatedProfile, cliente: profile.cliente }
          : profile
      )));
      setEditingProfile(null);
    } catch (error) {
      console.error('Erro ao atualizar perfil Instagram:', error);
      setFeedback(getInstagramActionError(error, 'Nao foi possivel atualizar o perfil Instagram.'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleConnectInstagram(profile = selectedProfile) {
    if (!profile?.id) {
      setFeedback('Selecione um perfil Instagram antes de conectar a API.');
      return;
    }

    let redirecting = false;

    try {
      setConnectingProfileId(profile.id);
      setFeedback('');
      setConnectionFeedback('Abrindo autorizacao do Instagram...');
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/instagram` : '';
      const data = await startInstagramOAuth(profile.id, redirectTo);
      redirecting = true;
      window.location.assign(data.authUrl);
    } catch (error) {
      console.error('Erro ao iniciar conexao Instagram:', error);
      const message = getInstagramActionError(error, 'Nao foi possivel iniciar a conexao com Instagram.');
      setFeedback(message);
      setConnectionFeedback(message);
    } finally {
      if (!redirecting) {
        setConnectingProfileId('');
      }
    }
  }

  async function handleGenerateClientAuthLink(profile = selectedProfile) {
    if (!profile?.id) {
      setFeedback('Selecione um perfil Instagram antes de gerar o link para o cliente.');
      return;
    }

    try {
      setGeneratingClientAuthLink(true);
      setFeedback('');
      setConnectionFeedback('Gerando link seguro para o cliente autorizar o Instagram...');
      const link = await createInstagramClientAuthLink(profile.id);
      setClientAuthLink(link);
      await copyTextToClipboard(link.url);
      setConnectionFeedback('Link de autorizacao copiado. Envie para o cliente abrir logado no Instagram correto.');
    } catch (error) {
      console.error('Erro ao gerar link de autorizacao Instagram:', error);
      const message = getInstagramActionError(error, 'Nao foi possivel gerar o link de autorizacao do cliente.');
      setFeedback(message);
      setConnectionFeedback(message);
    } finally {
      setGeneratingClientAuthLink(false);
    }
  }

  async function handleCopyClientAuthLink() {
    if (!clientAuthLink?.url) return;

    try {
      await copyTextToClipboard(clientAuthLink.url);
      setConnectionFeedback('Link de autorizacao copiado.');
    } catch (error) {
      console.error('Erro ao copiar link de autorizacao:', error);
      setConnectionFeedback('Nao foi possivel copiar o link. Copie manualmente pelo campo abaixo.');
    }
  }

  async function handleCopyClientAuthMessage(profile = selectedProfile) {
    if (!clientAuthLink?.url) return;

    try {
      await copyTextToClipboard(buildInstagramAuthorizationMessage(profile, clientAuthLink.url));
      setConnectionFeedback('Mensagem de autorizacao copiada para enviar ao cliente.');
    } catch (error) {
      console.error('Erro ao copiar mensagem de autorizacao:', error);
      setConnectionFeedback('Nao foi possivel copiar a mensagem. Copie manualmente pelo campo abaixo.');
    }
  }

  async function handleSyncInstagram(profile = selectedProfile) {
    if (!profile?.id) {
      setFeedback('Selecione um perfil Instagram antes de sincronizar.');
      return;
    }

    try {
      setSyncingProfileId(profile.id);
      setFeedback('');
      setConnectionFeedback('Sincronizando dados do perfil Instagram...');
      const updatedProfile = await syncInstagramProfileFromMeta(profile.id);

      setProfiles((currentProfiles) => currentProfiles.map((currentProfile) => (
        currentProfile.id === updatedProfile.id
          ? { ...currentProfile, ...updatedProfile, cliente: currentProfile.cliente }
          : currentProfile
      )));
      setFeedback('Perfil sincronizado com a API do Instagram.');
      setConnectionFeedback('Perfil sincronizado com a API do Instagram.');
    } catch (error) {
      console.error('Erro ao sincronizar Instagram:', error);
      const message = getInstagramActionError(error, 'Nao foi possivel sincronizar o perfil Instagram.');
      setFeedback(message);
      setConnectionFeedback(message);
    } finally {
      setSyncingProfileId('');
    }
  }

  function handleOpenPostEditorForDate(dateString) {
    if (!selectedProfile?.id) {
      setPostsFeedback('Selecione um perfil Instagram antes de criar o post.');
      return;
    }

    const monthReference = String(dateString || '').slice(0, 7) || selectedMonth;

    setPostsFeedback('');
    setSelectedMonth(monthReference);
    setEditingPost(createPostDraft({
      tipo: 'feed',
      mes_referencia: monthReference,
      data_prevista: dateString,
      hora_prevista: '09:00',
    }, monthReference));
  }

  function handleOpenPostEditor(post) {
    if (!selectedProfile?.id) {
      setPostsFeedback('Selecione um perfil Instagram antes de editar o post.');
      return;
    }

    setPostsFeedback('');
    setSelectedPost(null);
    setEditingPost(createPostDraft(getEditablePostSource(post), selectedMonth));
  }

  async function handleSavePost(postDraft) {
    if (!selectedProfile?.id) {
      setPostsFeedback('Selecione um perfil Instagram antes de salvar o post.');
      return;
    }

    try {
      setSavingPost(true);
      setPostsFeedback('');
      const savedPost = await saveInstagramPost(selectedProfile, postDraft);

      setPosts((currentPosts) => {
        const exists = currentPosts.some((post) => post.id === savedPost.id);

        return exists
          ? currentPosts.map((post) => (post.id === savedPost.id ? savedPost : post))
          : [savedPost, ...currentPosts];
      });
      setEditingPost(null);
      setSelectedPost(savedPost);
      setPostsFeedback('Post salvo e integrado ao preview.');
    } catch (error) {
      console.error('Erro ao salvar post Instagram:', error);
      setPostsFeedback(getInstagramActionError(error, 'Nao foi possivel salvar o post.'));
    } finally {
      setSavingPost(false);
    }
  }

  async function handleDuplicatePost(postDraft) {
    if (!selectedProfile?.id) {
      setPostsFeedback('Selecione um perfil Instagram antes de duplicar o post.');
      return;
    }

    if (!postDraft?.id || isPreviewPlaceholderPost(postDraft)) {
      setEditingPost(createPostDraft({
        ...postDraft,
        id: '',
        titulo_interno: postDraft?.titulo_interno ? `${postDraft.titulo_interno} - copia` : '',
        status: 'rascunho',
      }, selectedMonth));
      setPostsFeedback('Copia preparada. Salve para criar o novo post.');
      return;
    }

    try {
      setSavingPost(true);
      setPostsFeedback('');
      const duplicatedPost = await duplicateInstagramPost(selectedProfile, postDraft);
      setPosts((currentPosts) => [duplicatedPost, ...currentPosts]);
      setEditingPost(createPostDraft(duplicatedPost, selectedMonth));
      setPostsFeedback('Post duplicado.');
    } catch (error) {
      console.error('Erro ao duplicar post Instagram:', error);
      setPostsFeedback(getInstagramActionError(error, 'Nao foi possivel duplicar o post.'));
    } finally {
      setSavingPost(false);
    }
  }

  async function handleDeletePost(postDraft) {
    if (!postDraft?.id || isPreviewPlaceholderPost(postDraft)) {
      setEditingPost(null);
      setSelectedPost(null);
      setPostsFeedback('Post modelo removido da edicao.');
      return;
    }

    const confirmed = window.confirm('Tem certeza que deseja excluir este post? Essa acao nao pode ser desfeita.');

    if (!confirmed) return;

    try {
      setSavingPost(true);
      setPostsFeedback('');
      await deleteInstagramPost(postDraft.id);
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postDraft.id));
      setEditingPost(null);
      setSelectedPost(null);
      setPostsFeedback('Post excluido.');
    } catch (error) {
      console.error('Erro ao excluir post Instagram:', error);
      setPostsFeedback(getInstagramActionError(error, 'Nao foi possivel excluir o post.'));
    } finally {
      setSavingPost(false);
    }
  }

  async function handleGenerateMagicLink() {
    if (!selectedProfile?.id) {
      setMagicLinkFeedback('Selecione um perfil Instagram antes de gerar o link.');
      return;
    }

    try {
      setGeneratingMagicLink(true);
      setMagicLinkFeedback('');
      const link = await createInstagramMagicLink(selectedProfile, selectedMonth);
      setMagicLink(link);
      setLatestMagicLink({
        ativo: true,
        expira_em: link.expiresAt,
        criado_em: new Date().toISOString(),
        ultimo_acesso_em: null,
      });
      setMagicLinkFeedback('Link de aprovacao gerado.');
    } catch (error) {
      console.error('Erro ao gerar link magico Instagram:', error);
      setMagicLink(null);
      setMagicLinkFeedback(getInstagramActionError(error, 'Nao foi possivel gerar o link.'));
    } finally {
      setGeneratingMagicLink(false);
    }
  }

  async function handleCopyMagicLink() {
    if (!magicLink?.url) return;

    try {
      await navigator.clipboard.writeText(magicLink.url);
      setMagicLinkFeedback('Link copiado.');
    } catch (error) {
      console.error('Erro ao copiar link magico:', error);
      setMagicLinkFeedback('Nao foi possivel copiar automaticamente. Copie o link manualmente.');
    }
  }

  function handleGoToClients() {
    if (typeof onNavigate === 'function') {
      onNavigate('clientes');
      return;
    }

    window.history.pushState({}, '', '/clientes');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  if (!workspaceProfileId) {
    return (
      <section className="instagram-page instagram-page--overview">
        <section className="instagram-command-bar">
          <div className="instagram-command-bar__main">
            <span>Operacao Instagram</span>
            <strong>{dashboardHealth.title}</strong>
            <p>{dashboardHealth.description}</p>
          </div>

          <div className="instagram-command-bar__status">
            <div className={`instagram-command-bar__pulse instagram-command-bar__pulse--${dashboardHealth.tone}`} />
            <div>
              <span>{formatMonthLabel(selectedMonth)}</span>
              <strong>{summary.plannedPosts} posts planejados</strong>
            </div>
          </div>

          <div className="instagram-command-bar__actions">
            <button
              type="button"
              className="instagram-primary-button"
              onClick={() => profiles[0] && handleOpenWorkspace(profiles[0], 'status')}
              disabled={profiles.length === 0}
            >
              <CheckCircle2 size={16} />
              Abrir operacao
            </button>
            <button type="button" className="instagram-ghost-button" onClick={handleGoToClients}>
              <Users size={16} />
              Ativar cliente
            </button>
          </div>
        </section>

        <div className="instagram-stats">
          <InstagramStat label="Perfis ativos" value={summary.total} helper="Clientes com Instagram ativado" icon={Camera} tone="pink" />
          <InstagramStat label="Conectados" value={summary.connectedProfiles} helper="Contas com API ativa" icon={AtSign} tone="green" />
          <InstagramStat label="Posts planejados" value={summary.plannedPosts} helper="Conteudos cadastrados" icon={LayoutGrid} tone="blue" />
          <InstagramStat label="Pendentes" value={summary.pendingPosts} helper="Aguardando revisao/aprovacao" icon={Clock3} tone="amber" />
          <InstagramStat label="Ajustes" value={summary.adjustmentsPosts} helper="Solicitados ou reprovados" icon={RotateCcw} tone="red" />
          <InstagramStat label="Prontos" value={summary.readyProfiles} helper="Clientes prontos para publicar" icon={CheckCircle2} tone="green" />
        </div>

        <div className="instagram-portfolio-grid">
          <section className="instagram-card instagram-portfolio-card">
            <div className="instagram-card__header">
              <div>
                <p>Atencao necessaria</p>
                <h3>Clientes que pedem acao</h3>
                <span>Ajustes, reprovacoes, falta de posts ou aprovacoes pendentes.</span>
              </div>
            </div>

            {portfolioInsights.attention.length === 0 ? (
              <div className="instagram-empty instagram-empty--compact">
                Nenhum cliente exigindo acao agora.
              </div>
            ) : (
              <div className="instagram-portfolio-list">
                {portfolioInsights.attention.map((item) => (
                  <InstagramPortfolioItem
                    key={item.profile.id}
                    item={item}
                    onOpen={(section) => handleOpenWorkspace(item.profile, section)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="instagram-card instagram-portfolio-card">
            <div className="instagram-card__header">
              <div>
                <p>Prontos para publicar</p>
                <h3>Pacotes aprovados</h3>
                <span>Clientes com posts aprovados e sem ajustes pendentes.</span>
              </div>
            </div>

            {portfolioInsights.ready.length === 0 ? (
              <div className="instagram-empty instagram-empty--compact">
                Nenhum pacote pronto para publicar ainda.
              </div>
            ) : (
              <div className="instagram-portfolio-list">
                {portfolioInsights.ready.map((item) => (
                  <InstagramPortfolioItem
                    key={item.profile.id}
                    item={item}
                    onOpen={(section) => handleOpenWorkspace(item.profile, section)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="instagram-card">
          <div className="instagram-card__header">
            <div>
              <p>Central Instagram</p>
              <h3>Clientes com Instagram ativo</h3>
              <span>Abra um cliente para gerenciar estrategia, posts, calendario e link magico.</span>
            </div>

            <label className="instagram-search">
              <Search size={16} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar cliente ou @usuario..."
              />
            </label>
          </div>

          {feedback && <div className="instagram-feedback">{feedback}</div>}

          {loading ? (
            <div className="instagram-empty">Carregando perfis Instagram...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="instagram-empty instagram-empty--action">
              <strong>Nenhum cliente com Instagram ativado.</strong>
              <span>Abra a ficha de um cliente, entre na aba Instagram e clique em Ativar Instagram.</span>
              <button type="button" className="instagram-primary-button" onClick={handleGoToClients}>
                <Users size={16} />
                Ir para clientes
              </button>
            </div>
          ) : (
            <div className="instagram-profile-grid">
              {filteredProfiles.map((profile) => (
                <InstagramProfileCard
                  key={profile.id}
                  profile={profile}
                  posts={postsByProfile[profile.id] || []}
                  onOpen={() => handleOpenWorkspace(profile, 'profile')}
                  onEdit={() => setEditingProfile(profile)}
                />
              ))}
            </div>
          )}
        </section>

        {editingProfile && (
          <InstagramProfileEditorModal
            profile={editingProfile}
            saving={savingProfile}
            onClose={() => setEditingProfile(null)}
            onSave={handleSaveProfile}
          />
        )}
      </section>
    );
  }

  return (
    <section className="instagram-page">
      <section className="instagram-workspace-hero">
        <button type="button" className="instagram-ghost-button" onClick={handleCloseWorkspace}>
          Voltar para perfis
        </button>

        <div className="instagram-workspace-hero__profile">
          <div className="instagram-profile-preview__avatar">
            {selectedProfile?.foto_url ? (
              <img src={normalizeUrl(selectedProfile.foto_url)} alt="" />
            ) : (
              <Camera size={30} />
            )}
          </div>
          <div>
            <p>Cliente Instagram</p>
            <h3>{selectedProfile ? getClientName(selectedProfile) : 'Perfil Instagram'}</h3>
            <span>{selectedProfile?.usuario ? `@${normalizeInstagramUser(selectedProfile.usuario)}` : selectedProfile?.nome || 'Perfil sem usuario'}</span>
          </div>
        </div>

        <div className="instagram-workspace-hero__summary">
          <span>Status do pacote</span>
          <strong>{monthStatus.label}</strong>
          <small>{formatMonthLabel(selectedMonth)} - {monthlyPosts.length} post{monthlyPosts.length === 1 ? '' : 's'}</small>
        </div>
      </section>

      <InstagramConnectionPanel
        profile={selectedProfile}
        connecting={connectingProfileId === selectedProfile?.id}
        generatingClientAuthLink={generatingClientAuthLink}
        clientAuthLink={clientAuthLink}
        syncing={syncingProfileId === selectedProfile?.id}
        onConnect={() => handleConnectInstagram(selectedProfile)}
        onGenerateClientLink={() => handleGenerateClientAuthLink(selectedProfile)}
        onCopyClientLink={handleCopyClientAuthLink}
        onCopyClientMessage={() => handleCopyClientAuthMessage(selectedProfile)}
        onSync={() => handleSyncInstagram(selectedProfile)}
      />
      {connectionFeedback && (
        <div className="instagram-feedback instagram-feedback--connection">
          {connectionFeedback}
        </div>
      )}

      <nav className="instagram-workspace-tabs" aria-label="Areas do cliente">
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={workspaceSection === tab.id ? 'is-active' : ''}
              onClick={() => setWorkspaceSection(tab.id)}
            >
              <Icon size={17} />
              <span>
                <strong>{tab.label}</strong>
                <small>{tab.helper}</small>
              </span>
              {tab.badge ? <em>{tab.badge}</em> : null}
            </button>
          );
        })}
      </nav>

      {workspaceSection === 'status' && (
        <section className="instagram-card instagram-month-status-card">
          <div className="instagram-card__header">
            <div>
              <p>Status do mes</p>
              <h3>{formatMonthLabel(selectedMonth)}</h3>
              <span>Resumo do que ja esta pronto e do proximo passo para este cliente.</span>
            </div>

            <div className={`instagram-month-status__badge instagram-month-status__badge--${monthStatus.tone}`}>
              {monthStatus.label}
            </div>
          </div>

          <div className="instagram-month-status">
            <article className="instagram-month-status__next">
              <span>Proximo passo</span>
              <strong>{monthStatus.nextStep.title}</strong>
              <p>{monthStatus.nextStep.description}</p>
              <button type="button" className="instagram-primary-button" onClick={() => setWorkspaceSection(monthStatus.nextStep.section)}>
                {monthStatus.nextStep.action}
              </button>
            </article>

            <div className="instagram-month-status__main">
              <article className="instagram-month-package">
                <div className="instagram-month-package__header">
                  <div>
                    <span>Pacote do mes</span>
                    <strong>{monthPackage.title}</strong>
                  </div>
                  <div className={`instagram-month-package__status instagram-month-package__status--${monthPackage.tone}`}>
                    {monthPackage.status}
                  </div>
                </div>

                <div className="instagram-month-package__progress" aria-label={`Progresso do pacote ${monthPackage.progress}%`}>
                  <div style={{ width: `${monthPackage.progress}%` }} />
                </div>

                <div className="instagram-month-package__metrics">
                  {monthPackage.metrics.map((metric) => (
                    <div key={metric.label}>
                      <strong>{metric.value}</strong>
                      <span>{metric.label}</span>
                    </div>
                  ))}
                </div>

                <div className="instagram-month-package__meta">
                  <span>Responsavel: {monthPackage.responsible}</span>
                  <span>{monthPackage.linkStatus}</span>
                </div>

                <div className="instagram-month-package__actions">
                  <button type="button" className="instagram-primary-button" onClick={handleOpenNewPostEditor}>
                    <Plus size={15} />
                    Criar post
                  </button>
                  <button type="button" className="instagram-ghost-button" onClick={() => setWorkspaceSection('link')}>
                    <ExternalLink size={15} />
                    Gerar link
                  </button>
                  <button type="button" className="instagram-ghost-button" onClick={() => setWorkspaceSection('feedback')}>
                    <MessageCircle size={15} />
                    Ver retornos
                  </button>
                  <button type="button" className="instagram-ghost-button" onClick={() => setWorkspaceSection('calendar')}>
                    <CalendarDays size={15} />
                    Calendario
                  </button>
                </div>
              </article>

              <article className="instagram-month-timeline">
                <div className="instagram-month-timeline__header">
                  <div>
                    <span>Linha do tempo</span>
                    <strong>Historico do pacote</strong>
                  </div>
                  <small>{monthTimeline.length} evento{monthTimeline.length === 1 ? '' : 's'}</small>
                </div>

                {monthTimeline.length === 0 ? (
                  <div className="instagram-month-timeline__empty">
                    Nenhum evento registrado para este mes.
                  </div>
                ) : (
                  <div className="instagram-month-timeline__list">
                    {monthTimeline.map((event) => (
                      <div key={event.id} className={`instagram-month-timeline__item instagram-month-timeline__item--${event.tone}`}>
                        <span className="instagram-month-timeline__dot" />
                        <div>
                          <strong>{event.title}</strong>
                          <p>{event.description}</p>
                        </div>
                        <time>{formatDateTime(event.date)}</time>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <div className="instagram-month-status__grid">
                {monthStatus.items.map((item) => (
                  <article key={item.id} className={`instagram-month-status-item instagram-month-status-item--${item.tone}`}>
                    <div className="instagram-month-status-item__top">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <p>{item.helper}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {workspaceSection === 'profile' && (
        <section className="instagram-card instagram-profile-workspace-card">
          <div className="instagram-card__header">
            <div>
              <p>Perfil do cliente</p>
              <h3>{selectedProfile ? getClientName(selectedProfile) : 'Perfil Instagram'}</h3>
              <span>Dados principais do perfil antes de planejar posts e enviar aprovacao.</span>
            </div>

            <button type="button" className="instagram-ghost-button" onClick={() => setEditingProfile(selectedProfile)} disabled={!selectedProfile}>
              <Edit3 size={16} />
              Editar perfil
            </button>
          </div>

          <div className="instagram-profile-workspace">
            <div className="instagram-profile-preview">
              <div className="instagram-profile-preview__avatar">
                {selectedProfile?.foto_url ? (
                  <img src={normalizeUrl(selectedProfile.foto_url)} alt="" />
                ) : (
                  <Camera size={34} />
                )}
              </div>

              <div className="instagram-profile-preview__content">
                <div className="instagram-profile-preview__topline">
                  <div>
                    <h4>{selectedProfile?.nome || getClientName(selectedProfile) || 'Perfil Instagram'}</h4>
                    <span>{selectedProfile?.usuario ? `@${normalizeInstagramUser(selectedProfile.usuario)}` : '@usuario nao informado'}</span>
                  </div>

                  <div className="instagram-profile-preview__stats" aria-label="Estatisticas do perfil">
                    <div>
                      <strong>{monthlyPosts.length}</strong>
                      <span>Posts</span>
                    </div>
                    <div>
                      <strong>{previewStats.followers}</strong>
                      <span>Seguidores</span>
                    </div>
                    <div>
                      <strong>{previewStats.following}</strong>
                      <span>Seguindo</span>
                    </div>
                  </div>
                </div>

                <p>{selectedProfile?.bio || 'Bio ainda nao preenchida para este perfil.'}</p>

                {selectedProfile?.site ? (
                  <a href={normalizeUrl(selectedProfile.site)} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} />
                    {selectedProfile.site}
                  </a>
                ) : (
                  <span className="instagram-profile-preview__empty-link">Link do perfil nao informado</span>
                )}
              </div>
            </div>

            <div className="instagram-profile-workspace__actions">
              <button type="button" className="instagram-primary-button" onClick={() => setWorkspaceSection('planning')}>
                Abrir planejamento
              </button>
              <button type="button" className="instagram-ghost-button" onClick={() => setWorkspaceSection('posts')}>
                Ver posts
              </button>
              <button type="button" className="instagram-ghost-button" onClick={() => setWorkspaceSection('link')}>
                Gerar link
              </button>
            </div>
          </div>
        </section>
      )}

      {workspaceSection === 'planning' && (
      <section className="instagram-card instagram-planning-card">
        <div className="instagram-card__header">
          <div>
            <p>Planejamento mensal</p>
            <h3>Estrategia do mes</h3>
            <span>Defina direcao, objetivo, tom e pilares antes de criar posts.</span>
          </div>

          <div className="instagram-planning-controls">
            <label>
              <span>Perfil</span>
              <select
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
                disabled={loading || profiles.length === 0}
              >
                {profiles.length === 0 ? (
                  <option value="">Nenhum perfil ativo</option>
                ) : (
                  profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {getProfileOptionLabel(profile)}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              <span>Mes/Ano</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>
          </div>
        </div>

        <form className="instagram-planning-form" onSubmit={handleSavePlanning}>
          <div className="instagram-planning-summary">
            <div>
              <span>Cliente</span>
              <strong>{selectedProfile ? getClientName(selectedProfile) : 'Selecione um perfil'}</strong>
            </div>
            <div>
              <span>Perfil</span>
              <strong>{selectedProfile?.usuario ? `@${normalizeInstagramUser(selectedProfile.usuario)}` : selectedProfile?.nome || 'Nao informado'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{getPlanningStatusLabel(planningDraft.status)}</strong>
            </div>
            <div>
              <span>Registro</span>
              <strong>{planningRecord ? 'Editando planejamento' : 'Novo planejamento'}</strong>
            </div>
          </div>

          {loadingPlanning ? (
            <div className="instagram-empty instagram-empty--compact">
              Carregando planejamento mensal...
            </div>
          ) : (
            <>
              <div className="instagram-planning-grid">
                <PlanningField
                  label="Objetivo do mes"
                  value={planningDraft.objetivo_mes}
                  onChange={(value) => handleChangePlanningDraft('objetivo_mes', value)}
                  placeholder="Ex: gerar demanda para consultas, reforcar autoridade, lancar campanha..."
                />

                <PlanningField
                  label="Tom de comunicacao"
                  value={planningDraft.tom_comunicacao}
                  onChange={(value) => handleChangePlanningDraft('tom_comunicacao', value)}
                  placeholder="Ex: tecnico, acolhedor, educativo, direto..."
                />

                <label className="instagram-planning-field">
                  <span>Status do planejamento</span>
                  <select
                    value={planningDraft.status}
                    onChange={(event) => handleChangePlanningDraft('status', event.target.value)}
                  >
                    {INSTAGRAM_PLANNING_STATUS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>

                <PlanningField
                  label="Estrategia mensal"
                  value={planningDraft.estrategia_mensal}
                  onChange={(value) => handleChangePlanningDraft('estrategia_mensal', value)}
                  placeholder="Descreva a linha estrategica do mes, campanhas e foco editorial..."
                  multiline
                />

                <PlanningField
                  label="Pilares de conteudo"
                  value={planningDraft.pilares_conteudo}
                  onChange={(value) => handleChangePlanningDraft('pilares_conteudo', value)}
                  placeholder="Ex: autoridade, bastidores, provas sociais, ofertas, educacao..."
                  multiline
                />

                <PlanningField
                  label="Observacoes"
                  value={planningDraft.observacoes}
                  onChange={(value) => handleChangePlanningDraft('observacoes', value)}
                  placeholder="Anote restricoes, campanhas externas, datas importantes ou combinados..."
                  multiline
                />
              </div>

              <div className="instagram-planning-actions">
                {planningFeedback && (
                  <span className={`instagram-planning-feedback ${planningFeedback.includes('salvo') ? 'is-success' : ''}`}>
                    {planningFeedback}
                  </span>
                )}

                <button
                  type="submit"
                  className="instagram-primary-button"
                  disabled={!selectedProfile || savingPlanning}
                >
                  <Save size={16} />
                  {savingPlanning ? 'Salvando...' : 'Salvar planejamento'}
                </button>
              </div>
            </>
          )}
        </form>
      </section>
      )}

      {workspaceSection === 'calendar' && (
      <section className="instagram-card instagram-calendar-card">
        <div className="instagram-card__header">
          <div>
            <p>Calendario de postagens</p>
            <h3>{formatMonthLabel(selectedMonth)}</h3>
            <span>Posts cadastrados no editor organizados por data prevista.</span>
          </div>

          <div className="instagram-calendar-filters">
            <label>
              <span>Perfil</span>
              <select
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
                disabled={loading || profiles.length === 0}
              >
                {profiles.length === 0 ? (
                  <option value="">Nenhum perfil ativo</option>
                ) : (
                  profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {getProfileOptionLabel(profile)}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              <span>Mes/Ano</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>
          </div>
        </div>

        <InstagramPostsCalendar
          weeks={calendarWeeks}
          loading={loadingPosts}
          monthReference={selectedMonth}
          onCreatePost={handleOpenPostEditorForDate}
          onEditPost={handleOpenPostEditor}
        />
      </section>
      )}

      {workspaceSection === 'posts' && (
      <section className="instagram-card instagram-preview-card">
        <div className="instagram-card__header">
          <div>
            <p>Preview interno</p>
            <h3>Espelho do Instagram</h3>
            <span>Visualizacao interna do perfil e dos posts planejados.</span>
          </div>

          <div className="instagram-preview-actions">
            <div className="instagram-preview-context">
              <span>{formatMonthLabel(selectedMonth)}</span>
              <strong>{selectedProfile ? getClientName(selectedProfile) : 'Nenhum perfil selecionado'}</strong>
            </div>

            <button
              type="button"
              className="instagram-primary-button"
              onClick={handleOpenNewPostEditor}
              disabled={!selectedProfile}
              title={!selectedProfile ? 'Ative um Instagram na ficha do cliente antes de criar posts' : 'Criar novo post'}
            >
              <Plus size={16} />
              Novo post
            </button>

            <button
              type="button"
              className="instagram-ghost-button"
              onClick={() => setWorkspaceSection('link')}
              disabled={!selectedProfile}
              title={!selectedProfile ? 'Ative um Instagram na ficha do cliente antes de gerar link' : 'Abrir link publico'}
            >
              <ExternalLink size={16} />
              Link magico
            </button>
          </div>
        </div>

        <div className="instagram-profile-preview">
          <div className="instagram-profile-preview__avatar">
            {selectedProfile?.foto_url ? (
              <img src={normalizeUrl(selectedProfile.foto_url)} alt="" />
            ) : (
              <Camera size={34} />
            )}
          </div>

          <div className="instagram-profile-preview__content">
            <div className="instagram-profile-preview__topline">
              <div>
                <h4>{selectedProfile?.nome || getClientName(selectedProfile) || 'Perfil Instagram'}</h4>
                <span>
                  {selectedProfile?.usuario
                    ? `@${normalizeInstagramUser(selectedProfile.usuario)}`
                    : '@usuario'}
                </span>
              </div>

              <div className="instagram-profile-preview__stats" aria-label="Estatisticas simuladas">
                <div>
                  <strong>{previewStats.posts}</strong>
                  <span>Posts</span>
                </div>
                <div>
                  <strong>{previewStats.followers}</strong>
                  <span>Seguidores</span>
                </div>
                <div>
                  <strong>{previewStats.following}</strong>
                  <span>Seguindo</span>
                </div>
              </div>
            </div>

            <p>{selectedProfile?.bio || 'Bio ainda nao preenchida para este perfil.'}</p>

            {selectedProfile?.site ? (
              <a href={normalizeUrl(selectedProfile.site)} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                {selectedProfile.site}
              </a>
            ) : (
              <span className="instagram-profile-preview__empty-link">Link do perfil nao informado</span>
            )}
          </div>
        </div>

        <div className="instagram-tabs instagram-preview-tabs" aria-label="Preview Instagram">
          {BASIC_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {postsFeedback && <div className="instagram-feedback">{postsFeedback}</div>}

        {usingPreviewPlaceholders && (
          <div className="instagram-preview-hint">
            <ImageIcon size={16} />
            <span>Exibindo cards modelo ate que os posts planejados sejam cadastrados.</span>
          </div>
        )}

        {activeTab === 'resultados' && (
          <div className="instagram-results-strip">
            <div>
              <BarChart3 size={16} />
              <span>Resultados simulados</span>
            </div>
            <strong>{sumPostMetric(monthlyPosts, 'alcance')}</strong>
            <small>alcance total previsto</small>
          </div>
        )}

        <div className="instagram-preview-grid">
          {loadingPosts ? (
            <div className="instagram-empty instagram-empty--compact">
              Carregando posts planejados...
            </div>
          ) : previewDisplayPosts.length === 0 ? (
            <div className="instagram-empty instagram-empty--compact">
              Nenhum post planejado para esta aba.
            </div>
          ) : (
            previewDisplayPosts.map((post) => (
              <InstagramPostCard
                key={post.id}
                post={post}
                onOpen={() => setSelectedPost(post)}
              />
            ))
          )}
        </div>
      </section>
      )}

      {workspaceSection === 'feedback' && (
        <section className="instagram-card instagram-feedback-card">
          <div className="instagram-card__header">
            <div>
              <p>Retornos do cliente</p>
              <h3>Aprovacoes, ajustes e comentarios</h3>
              <span>Veja rapidamente o que o cliente respondeu pelo link magico neste mes.</span>
            </div>

            <div className="instagram-preview-context">
              <span>{formatMonthLabel(selectedMonth)}</span>
              <strong>{selectedProfile ? getClientName(selectedProfile) : 'Nenhum perfil selecionado'}</strong>
            </div>
          </div>

          <div className="instagram-feedback-stats">
            <InstagramFeedbackStat icon={Clock3} label="Aguardando" value={feedbackSummary.pending} helper="Sem resposta final" tone="amber" />
            <InstagramFeedbackStat icon={CheckCircle2} label="Aprovados" value={feedbackSummary.approved} helper="Liberados pelo cliente" tone="green" />
            <InstagramFeedbackStat icon={RotateCcw} label="Ajustes" value={feedbackSummary.adjustments} helper="Precisam revisao" tone="amber" />
            <InstagramFeedbackStat icon={XCircle} label="Reprovados" value={feedbackSummary.rejected} helper="Exigem nova proposta" tone="red" />
            <InstagramFeedbackStat icon={MessageCircle} label="Comentarios" value={feedbackSummary.commentsTotal} helper="Recebidos no periodo" tone="blue" />
          </div>

          {loadingPosts ? (
            <div className="instagram-empty instagram-empty--compact">
              Carregando retornos do cliente...
            </div>
          ) : feedbackSummary.comments.length === 0 ? (
            <div className="instagram-empty instagram-empty--action">
              <MessageCircle size={26} />
              <strong>Nenhum retorno recebido ainda.</strong>
              <span>Quando o cliente comentar, aprovar, reprovar ou solicitar ajustes pelo link magico, os retornos aparecem aqui.</span>
              <button type="button" className="instagram-primary-button" onClick={() => setWorkspaceSection('link')}>
                <ExternalLink size={16} />
                Gerar link magico
              </button>
            </div>
          ) : (
            <div className="instagram-feedback-list">
              {feedbackSummary.comments.map((comment) => (
                <button
                  type="button"
                  key={comment.key}
                  className={`instagram-feedback-item instagram-feedback-item--${comment.approvalStatus}`}
                  onClick={() => setSelectedPost(comment.post)}
                >
                  <div className="instagram-feedback-item__icon">
                    {getFeedbackIcon(comment.approvalStatus)}
                  </div>
                  <div>
                    <span>{getPostApprovalStatusLabel(comment.approvalStatus)}</span>
                    <strong>{getPostTitle(comment.post)}</strong>
                    <p>{comment.mensagem}</p>
                  </div>
                  <time>{formatDateTime(comment.criado_em)}</time>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {workspaceSection === 'link' && (
        <section className="instagram-card instagram-magic-link-card">
          <div className="instagram-card__header">
            <div>
              <p>Aprovacao do cliente</p>
              <h3>Link magico</h3>
              <span>Gere um acesso publico para o cliente visualizar e aprovar os posts do mes.</span>
            </div>

            <div className="instagram-preview-context">
              <span>{formatMonthLabel(selectedMonth)}</span>
              <strong>{selectedProfile ? getClientName(selectedProfile) : 'Nenhum perfil selecionado'}</strong>
            </div>
          </div>

          <div className="instagram-magic-link-panel">
            <div>
              <span className="instagram-section-kicker">Link publico</span>
              <h4>{selectedProfile?.usuario ? `@${normalizeInstagramUser(selectedProfile.usuario)}` : selectedProfile?.nome || 'Perfil Instagram'}</h4>
              <p>O link abre o preview publico sem menu do CRM. O cliente pode aprovar, reprovar, solicitar ajuste e comentar nos posts.</p>
              {latestMagicLink && (
                <div className={`instagram-magic-link-status ${isMagicLinkExpired(latestMagicLink) ? 'is-expired' : 'is-active'}`}>
                  <strong>{isMagicLinkExpired(latestMagicLink) ? 'Ultimo link expirado' : 'Ultimo link ativo'}</strong>
                  <span>
                    Criado em {formatDateTime(latestMagicLink.criado_em)}
                    {latestMagicLink.expira_em ? ` · expira em ${formatDateTime(latestMagicLink.expira_em)}` : ''}
                  </span>
                </div>
              )}
            </div>

            <label className="instagram-planning-field">
              <span>Mes/Ano</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>

            <div className="instagram-magic-link-panel__actions">
              <button
                type="button"
                className="instagram-primary-button"
                onClick={handleGenerateMagicLink}
                disabled={!selectedProfile || generatingMagicLink}
              >
                <ExternalLink size={16} />
                {generatingMagicLink ? 'Gerando...' : 'Gerar link de aprovacao'}
              </button>

              {magicLink?.url && (
                <button type="button" className="instagram-ghost-button" onClick={handleCopyMagicLink}>
                  <Copy size={15} />
                  Copiar link
                </button>
              )}
            </div>
          </div>

          {(magicLink || magicLinkFeedback) && (
            <div className="instagram-magic-link-box">
              <div>
                <span>{magicLink?.url ? 'Link publico do cliente' : 'Status do link'}</span>
                <strong>{magicLink?.url || magicLinkFeedback}</strong>
                {magicLink?.expiresAt && <small>Expira em {formatDateTime(magicLink.expiresAt)}</small>}
              </div>

              {magicLink?.url && (
                <a className="instagram-ghost-button" href={magicLink.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} />
                  Abrir preview
                </a>
              )}
            </div>
          )}
        </section>
      )}

      {selectedPost && (
        <InstagramPostPreviewModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onEdit={() => handleOpenPostEditor(selectedPost)}
        />
      )}

      {editingPost && (
        <InstagramPostEditorModal
          post={editingPost}
          profile={selectedProfile}
          saving={savingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSavePost}
          onDuplicate={handleDuplicatePost}
          onDelete={handleDeletePost}
        />
      )}

      {editingProfile && (
        <InstagramProfileEditorModal
          profile={editingProfile}
          saving={savingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={handleSaveProfile}
        />
      )}
    </section>
  );
}

function PlanningField({ label, value, onChange, placeholder = '', multiline = false }) {
  return (
    <label className={`instagram-planning-field ${multiline ? 'is-full' : ''}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function InstagramStat({ label, value, helper, icon: Icon, tone }) {
  return (
    <article className={`instagram-stat instagram-stat--${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>

      <div className="instagram-stat__icon">
        <Icon size={20} />
      </div>
    </article>
  );
}

function InstagramConnectionPanel({
  profile,
  connecting,
  generatingClientAuthLink,
  clientAuthLink,
  syncing,
  onConnect,
  onGenerateClientLink,
  onCopyClientLink,
  onCopyClientMessage,
  onSync,
}) {
  const status = getInstagramConnectionStatus(profile);
  const connectedUser = profile?.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : '';
  const client = profile?.cliente || {};
  const authorizationMessage = clientAuthLink?.url ? buildInstagramAuthorizationMessage(profile, clientAuthLink.url) : '';
  const mailToUrl = clientAuthLink?.url ? buildInstagramAuthorizationEmailUrl(profile, clientAuthLink.url) : '';
  const whatsappUrl = clientAuthLink?.url ? buildInstagramAuthorizationWhatsAppUrl(profile, clientAuthLink.url) : '';

  return (
    <section className={`instagram-connection-panel instagram-connection-panel--${status.tone}`}>
      <div className="instagram-connection-panel__main">
        <span>Conexao Meta API</span>
        <strong>{status.title}</strong>
        <p>{status.description}</p>
      </div>

      <div className="instagram-connection-panel__details">
        {connectedUser ? <span>Perfil no CRM: {connectedUser}</span> : null}
        <span>{profile?.meta_last_sync_at ? `Ultima sincronizacao: ${formatDateTime(profile.meta_last_sync_at)}` : 'Ainda nao sincronizado pela API'}</span>
        {profile?.meta_token_expires_at ? (
          <span>Token ate {formatDate(profile.meta_token_expires_at)}</span>
        ) : (
          <span>Token ainda nao registrado</span>
        )}
      </div>

      <div className="instagram-connection-panel__actions">
        <button
          type="button"
          className="instagram-ghost-button"
          onClick={onConnect}
          disabled={!profile?.id || connecting || syncing}
        >
          <ExternalLink size={16} />
          {connecting ? 'Abrindo...' : status.connected ? 'Reconectar agora' : 'Conectar agora'}
        </button>

        <button
          type="button"
          className="instagram-ghost-button"
          onClick={onGenerateClientLink}
          disabled={!profile?.id || connecting || generatingClientAuthLink || syncing}
        >
          <Copy size={16} />
          {generatingClientAuthLink ? 'Gerando...' : 'Link para cliente'}
        </button>

        <button
          type="button"
          className="instagram-primary-button"
          onClick={onSync}
          disabled={!profile?.id || !status.connected || connecting || syncing}
        >
          <RotateCcw size={16} />
          {syncing ? 'Sincronizando...' : 'Sincronizar perfil'}
        </button>
      </div>

      {clientAuthLink?.url ? (
        <div className="instagram-client-auth-link">
          <div>
            <strong>Link seguro para o cliente autorizar</strong>
            <span>
              Envie para {client.email || client.whatsapp || client.telefone || 'o contato do cliente'}.
              O cliente deve abrir logado no Instagram correto. Valido ate {formatDateTime(clientAuthLink.expiresAt)}.
            </span>
          </div>
          <div className="instagram-client-auth-link__actions">
            <button type="button" className="instagram-ghost-button" onClick={onCopyClientMessage}>
              <Copy size={15} />
              Copiar mensagem
            </button>
            {client.email ? (
              <a className="instagram-ghost-button" href={mailToUrl}>
                <Mail size={15} />
                Enviar e-mail
              </a>
            ) : (
              <button type="button" className="instagram-ghost-button" disabled title="Cadastre o e-mail do cliente para usar este atalho">
                <Mail size={15} />
                Sem e-mail
              </button>
            )}
            <a className="instagram-ghost-button" href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={15} />
              WhatsApp
            </a>
            <button type="button" className="instagram-ghost-button" onClick={onCopyClientLink}>
              <ExternalLink size={15} />
              Copiar link
            </button>
          </div>
          <textarea value={authorizationMessage} readOnly aria-label="Mensagem de autorizacao do Instagram para o cliente" />
          <input value={clientAuthLink.url} readOnly aria-label="Link de autorizacao do Instagram para o cliente" />
        </div>
      ) : null}
    </section>
  );
}

function InstagramFeedbackStat({ label, value, helper, icon: Icon, tone }) {
  return (
    <article className={`instagram-feedback-stat instagram-feedback-stat--${tone}`}>
      <div className="instagram-feedback-stat__icon">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function InstagramPortfolioItem({ item, onOpen }) {
  const { profile, status, helper, tone, postsCount, approvedCount, attentionCount } = item;
  const clientName = getClientName(profile);
  const user = profile.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : profile.nome || 'Perfil sem usuario';

  return (
    <article className={`instagram-portfolio-item instagram-portfolio-item--${tone}`}>
      <div className="instagram-portfolio-item__main">
        <div className="instagram-row__avatar">
          {profile.foto_url ? (
            <img src={normalizeUrl(profile.foto_url)} alt="" />
          ) : (
            getInitials(clientName)
          )}
        </div>
        <div>
          <strong>{clientName}</strong>
          <span>{user}</span>
          <p>{helper}</p>
        </div>
      </div>

      <div className="instagram-portfolio-item__metrics">
        <span>{postsCount} posts</span>
        <span>{approvedCount} aprovados</span>
        {attentionCount > 0 && <span>{attentionCount} atencao</span>}
      </div>

      <div className="instagram-portfolio-item__actions">
        <span className={`instagram-portfolio-item__status instagram-portfolio-item__status--${tone}`}>
          {status}
        </span>
        <button type="button" onClick={() => onOpen('status')}>Status</button>
        <button type="button" onClick={() => onOpen(attentionCount > 0 ? 'feedback' : 'calendar')}>
          {attentionCount > 0 ? 'Retornos' : 'Calendario'}
        </button>
        <button type="button" onClick={() => onOpen('link')}>Link</button>
      </div>
    </article>
  );
}

function InstagramProfileCard({ profile, posts = [], onOpen, onEdit }) {
  const clientName = getClientName(profile);
  const user = profile.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : '@usuario nao informado';
  const publishedPosts = posts.filter((post) => post.status === 'publicado').length;
  const pendingPosts = posts.filter((post) => ['rascunho', 'em_revisao', 'aguardando_aprovacao'].includes(getPostApprovalStatus(post)) || post.status === 'rascunho').length;

  return (
    <article className="instagram-profile-card">
      <div className="instagram-profile-card__top">
        <div className="instagram-profile-card__avatar">
          {profile.foto_url ? (
            <img src={normalizeUrl(profile.foto_url)} alt="" />
          ) : (
            <Camera size={24} />
          )}
        </div>

        <div>
          <span>{clientName}</span>
          <strong>{profile.nome || clientName}</strong>
          <small>{user}</small>
        </div>
      </div>

      <p>{profile.bio || 'Bio ainda nao cadastrada. Abra a ficha do cliente para completar os dados do perfil.'}</p>

      <div className="instagram-profile-card__metrics">
        <div>
          <strong>{posts.length}</strong>
          <span>posts</span>
        </div>
        <div>
          <strong>{publishedPosts}</strong>
          <span>publicados</span>
        </div>
        <div>
          <strong>{pendingPosts}</strong>
          <span>pendentes</span>
        </div>
      </div>

      <div className="instagram-profile-card__meta">
        <span>{formatCompactNumber(profile.seguidores || profile.seguidores_total || 0)} seguidores</span>
        <span>{formatCompactNumber(profile.seguindo || profile.seguindo_total || 0)} seguindo</span>
      </div>

      <footer>
        <button type="button" className="instagram-ghost-button" onClick={onEdit}>
          <Edit3 size={15} />
          Editar dados
        </button>
        <button type="button" className="instagram-primary-button" onClick={onOpen}>
          Abrir cliente
        </button>
      </footer>
    </article>
  );
}

function InstagramProfileEditorModal({ profile, saving, onClose, onSave }) {
  const [draft, setDraft] = useState({
    id: profile.id,
    nome: profile.nome || '',
    usuario: profile.usuario || '',
    bio: profile.bio || '',
    site: profile.site || '',
    foto_url: profile.foto_url || '',
  });

  useEffect(() => {
    setDraft({
      id: profile.id,
      nome: profile.nome || '',
      usuario: profile.usuario || '',
      bio: profile.bio || '',
      site: profile.site || '',
      foto_url: profile.foto_url || '',
    });
  }, [profile]);

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <div className="instagram-profile-editor" role="dialog" aria-modal="true">
      <div className="instagram-preview-modal__backdrop" onClick={onClose} />

      <form className="instagram-profile-editor__panel" onSubmit={handleSubmit}>
        <header>
          <div>
            <p>Perfil Instagram</p>
            <h3>Editar dados do perfil</h3>
          </div>

          <button type="button" onClick={onClose} aria-label="Fechar editor">
            <X size={18} />
          </button>
        </header>

        <div className="instagram-profile-editor__body">
          <label className="instagram-editor-field">
            <span>Nome do perfil</span>
            <input value={draft.nome} onChange={(event) => updateField('nome', event.target.value)} />
          </label>

          <label className="instagram-editor-field">
            <span>@usuario</span>
            <input value={draft.usuario} onChange={(event) => updateField('usuario', event.target.value)} placeholder="@cliente" />
          </label>

          <label className="instagram-editor-field is-full">
            <span>Bio</span>
            <textarea value={draft.bio} onChange={(event) => updateField('bio', event.target.value)} rows={4} />
          </label>

          <label className="instagram-editor-field">
            <span>Link do perfil</span>
            <input value={draft.site} onChange={(event) => updateField('site', event.target.value)} placeholder="https://..." />
          </label>

          <label className="instagram-editor-field">
            <span>Foto do perfil</span>
            <input value={draft.foto_url} onChange={(event) => updateField('foto_url', event.target.value)} placeholder="URL da foto" />
          </label>
        </div>

        <footer>
          <button type="button" className="instagram-ghost-button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="instagram-primary-button" disabled={saving}>
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function InstagramPostsCalendar({ weeks, loading, monthReference, onCreatePost, onEditPost }) {
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <div className="instagram-calendar">
      <div className="instagram-calendar__weekdays">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      {loading ? (
        <div className="instagram-empty instagram-empty--compact">
          Carregando calendario de postagens...
        </div>
      ) : weeks.length === 0 ? (
        <div className="instagram-empty instagram-empty--compact">
          Selecione um mes para visualizar o calendario.
        </div>
      ) : (
        <div className="instagram-calendar__grid">
          {weeks.flatMap((week, weekIndex) => (
            week.map((day, dayIndex) => {
              const cellKey = day.date || `${monthReference}-${weekIndex}-${dayIndex}`;

              return (
                <div
                  key={cellKey}
                  role={day.date ? 'button' : 'presentation'}
                  tabIndex={day.date ? 0 : -1}
                  className={`instagram-calendar-day ${day.isToday ? 'is-today' : ''} ${!day.date ? 'is-empty' : ''}`}
                  onClick={() => day.date && onCreatePost(day.date)}
                  onKeyDown={(event) => {
                    if (!day.date) return;

                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onCreatePost(day.date);
                    }
                  }}
                  aria-label={day.date ? `Criar post em ${formatDate(day.date)}` : 'Dia fora do mes'}
                >
                  {day.date ? (
                    <>
                      <div className="instagram-calendar-day__top">
                        <strong>{day.day}</strong>
                        <span>{day.posts.length}</span>
                      </div>

                      <div className="instagram-calendar-day__posts">
                        {day.posts.length === 0 ? (
                          <small>Novo post</small>
                        ) : (
                          day.posts.slice(0, 3).map((post) => (
                            <span
                              key={post.id}
                              className={`instagram-calendar-post instagram-post-status--${getPostApprovalStatus(post)}`}
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                onEditPost(post);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  onEditPost(post);
                                }
                              }}
                            >
                              <b>{String(post.hora_prevista || '').slice(0, 5) || '--:--'}</b>
                              <em>{getPostTypeLabel(post.tipo)}</em>
                              <strong>{getPostTitle(post)}</strong>
                              <small>{getPostApprovalStatusLabel(getPostApprovalStatus(post))}</small>
                            </span>
                          ))
                        )}

                        {day.posts.length > 3 && (
                          <small>+{day.posts.length - 3} post(s)</small>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })
          ))}
        </div>
      )}
    </div>
  );
}

function InstagramPostCard({ post, onOpen }) {
  const mediaItems = getPostMediaItems(post);
  const mediaUrl = mediaItems[0] || '';
  const isInteractive = typeof onOpen === 'function';
  const Component = isInteractive ? 'button' : 'article';
  const approvalStatus = getPostApprovalStatus(post);
  const commentsCount = Array.isArray(post.comentarios) ? post.comentarios.length : Number(post.comentarios_total || 0);

  return (
    <Component
      type={isInteractive ? 'button' : undefined}
      className={`instagram-post-card ${isInteractive ? '' : 'is-static'}`}
      onClick={onOpen}
    >
      <div className="instagram-post-card__media">
        {mediaUrl ? (
          <InstagramMediaElement src={mediaUrl} />
        ) : (
          <div className="instagram-post-card__placeholder">
            <ImageIcon size={26} />
          </div>
        )}
        {mediaItems.length > 1 && (
          <span className="instagram-post-card__media-count">
            {mediaItems.length} midias
          </span>
        )}
      </div>

      <div className="instagram-post-card__body">
        <strong>{getPostTitle(post)}</strong>
        <div className="instagram-post-card__meta">
          <span>{getPostTypeLabel(post.tipo)}</span>
          <span>{formatDate(post.data_prevista)}</span>
        </div>
        <span className={`instagram-post-status instagram-post-status--${approvalStatus}`}>
          {getPostApprovalStatusLabel(approvalStatus)}
        </span>
        {(commentsCount > 0 || ['reprovado', 'ajuste_solicitado'].includes(approvalStatus)) && (
          <div className="instagram-post-card__alerts">
            {commentsCount > 0 && (
              <span>
                <MessageCircle size={13} />
                {commentsCount} comentario{commentsCount > 1 ? 's' : ''}
              </span>
            )}
            {approvalStatus === 'ajuste_solicitado' && (
              <span className="is-adjust">
                <RotateCcw size={13} />
                Ajuste solicitado
              </span>
            )}
            {approvalStatus === 'reprovado' && (
              <span className="is-rejected">
                <XCircle size={13} />
                Reprovado
              </span>
            )}
          </div>
        )}
      </div>
    </Component>
  );
}

function InstagramPostPreviewModal({ post, onClose, onEdit }) {
  const mediaItems = getPostMediaItems(post);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const mediaUrl = mediaItems[activeMediaIndex] || '';
  const hasCarousel = mediaItems.length > 1;
  const approvalStatus = getPostApprovalStatus(post);
  const comments = Array.isArray(post.comentarios) ? post.comentarios : [];

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [post?.id]);

  function showPreviousMedia() {
    setActiveMediaIndex((current) => (current === 0 ? mediaItems.length - 1 : current - 1));
  }

  function showNextMedia() {
    setActiveMediaIndex((current) => (current + 1) % mediaItems.length);
  }

  return (
    <div className="instagram-preview-modal" role="dialog" aria-modal="true">
      <div className="instagram-preview-modal__backdrop" onClick={onClose} />

      <article className="instagram-preview-modal__panel">
        <header>
          <div>
            <p>Post planejado</p>
            <h3>{getPostTitle(post)}</h3>
          </div>

          <button type="button" onClick={onClose} aria-label="Fechar preview">
            <X size={18} />
          </button>
        </header>

        <div className="instagram-preview-modal__content">
          <div className="instagram-preview-modal__media">
            {mediaUrl ? (
              <InstagramMediaElement src={mediaUrl} showLink />
            ) : (
              <div className="instagram-post-card__placeholder">
                <ImageIcon size={34} />
              </div>
            )}
            {hasCarousel && (
              <>
                <button type="button" className="instagram-carousel-control is-prev" onClick={showPreviousMedia} aria-label="Midia anterior">
                  <ChevronLeft size={20} />
                </button>
                <button type="button" className="instagram-carousel-control is-next" onClick={showNextMedia} aria-label="Proxima midia">
                  <ChevronRight size={20} />
                </button>
                <div className="instagram-carousel-counter">
                  {activeMediaIndex + 1} / {mediaItems.length}
                </div>
              </>
            )}
          </div>

          <div className="instagram-preview-modal__details">
            <section className={`instagram-approval-summary instagram-approval-summary--${approvalStatus}`}>
              <span>Status de aprovacao</span>
              <strong>{getPostApprovalStatusLabel(approvalStatus)}</strong>
              <p>{getPostApprovalStatusDescription(approvalStatus)}</p>
            </section>

            <section>
              <span>Legenda</span>
              <p>{post.legenda || 'Legenda ainda nao cadastrada.'}</p>
            </section>

            <div className="instagram-preview-modal__info">
              <div>
                <span>Tipo</span>
                <strong>{getPostTypeLabel(post.tipo)}</strong>
              </div>
              <div>
                <span>Data prevista</span>
                <strong>{formatDate(post.data_prevista)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{getPostStatusLabel(post.status)}</strong>
              </div>
              <div>
                <span>Horario</span>
                <strong>{String(post.hora_prevista || '').slice(0, 5) || 'Sem horario'}</strong>
              </div>
              <div>
                <span>Mes</span>
                <strong>{formatMonthLabel(post.mes_referencia || String(post.data_prevista || '').slice(0, 7))}</strong>
              </div>
              <div>
                <span>Responsavel</span>
                <strong>{post.responsavel || 'Nao informado'}</strong>
              </div>
            </div>

            {post.cta && (
              <section>
                <span>CTA</span>
                <p>{post.cta}</p>
              </section>
            )}

            {post.hashtags && (
              <section>
                <span>Hashtags</span>
                <p>{post.hashtags}</p>
              </section>
            )}

            {post.observacoes_internas && (
              <section>
                <span>Observacoes internas</span>
                <p>{post.observacoes_internas}</p>
              </section>
            )}

            <section className="instagram-comment-history">
              <span>Comentarios do cliente</span>
              {comments.length === 0 ? (
                <p>Nenhum comentario recebido pelo link magico.</p>
              ) : (
                <div className="instagram-comment-list">
                  {comments.map((item) => (
                    <article key={item.id || `${item.criado_em}-${item.mensagem}`} className="instagram-comment-item">
                      <div>
                        <strong>{item.autor_nome || 'Cliente'}</strong>
                        <small>{formatDateTime(item.criado_em)}</small>
                      </div>
                      <p>{item.mensagem}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <button type="button" className="instagram-primary-button" onClick={onEdit}>
              <Edit3 size={16} />
              Editar
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function InstagramMediaElement({ src, showLink = false }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="instagram-media-fallback">
        <ImageIcon size={30} />
        <strong>Midia nao carregada</strong>
        <span>O link pode exigir permissao ou bloquear visualizacao incorporada.</span>
        {showLink && src && (
          <a href={src} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Abrir midia original
          </a>
        )}
      </div>
    );
  }

  if (isVideoMedia(src)) {
    return <video src={src} controls muted playsInline onError={() => setHasError(true)} />;
  }

  return <img src={src} alt="" onError={() => setHasError(true)} />;
}

function InstagramPostEditorModal({ post, profile, saving, onClose, onSave, onDuplicate, onDelete }) {
  const [draft, setDraft] = useState(createPostDraft(post));
  const statusOptions = INSTAGRAM_CONTENT_STATUS.filter((status) => POST_EDITOR_STATUS.includes(status.value));
  const editorMediaItems = getPostMediaItems({ midia_url: draft.midia_url });

  useEffect(() => {
    setDraft(createPostDraft(post));
  }, [post]);

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === 'data_prevista' && value ? { mes_referencia: value.slice(0, 7) } : {}),
    }));
  }

  function updateMediaField(value) {
    const firstMedia = getPostMediaItems({ midia_url: value })[0] || '';

    setDraft((current) => ({
      ...current,
      midia_url: value,
      thumbnail_url: firstMedia,
    }));
  }

  async function handleMediaFiles(files) {
    const fileList = Array.from(files || []);

    if (fileList.length === 0) return;

    const allowedFiles = fileList.filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));

    if (allowedFiles.length === 0) return;

    const dataUrls = await Promise.all(allowedFiles.map(readFileAsDataUrl));
    const currentMedia = draft.tipo === 'carrossel'
      ? getPostMediaItems({ midia_url: draft.midia_url })
      : [];
    const nextMedia = [...currentMedia, ...dataUrls].join('\n');

    updateMediaField(nextMedia);
  }

  function removeMediaItem(indexToRemove) {
    const nextMedia = editorMediaItems.filter((_, index) => index !== indexToRemove).join('\n');
    updateMediaField(nextMedia);
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <div className="instagram-editor-modal" role="dialog" aria-modal="true">
      <div className="instagram-preview-modal__backdrop" onClick={onClose} />

      <form className="instagram-editor-modal__panel" onSubmit={handleSubmit}>
        <header>
          <div>
            <p>Editor de Post</p>
            <h3>{draft.id && !isPreviewPlaceholderPost(draft) ? 'Editar post' : 'Novo post'}</h3>
            <span>{profile ? getClientName(profile) : 'Cliente nao selecionado'}</span>
          </div>

          <button type="button" onClick={onClose} aria-label="Fechar editor">
            <X size={18} />
          </button>
        </header>

        <div className="instagram-editor-modal__body">
          <section className="instagram-editor-form">
            <div className="instagram-editor-grid">
              <label className="instagram-editor-field">
                <span>Cliente vinculado</span>
                <input value={profile ? getClientName(profile) : ''} disabled />
              </label>

              <label className="instagram-editor-field">
                <span>Mes do planejamento</span>
                <input
                  type="month"
                  value={draft.mes_referencia}
                  onChange={(event) => updateField('mes_referencia', event.target.value)}
                />
              </label>

              <label className="instagram-editor-field">
                <span>Tipo</span>
                <select value={draft.tipo} onChange={(event) => updateField('tipo', event.target.value)}>
                  {INSTAGRAM_CONTENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="instagram-editor-field">
                <span>Status</span>
                <select value={draft.status} onChange={(event) => updateField('status', event.target.value)}>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="instagram-editor-field">
                <span>Data prevista</span>
                <input
                  type="date"
                  value={draft.data_prevista}
                  onChange={(event) => updateField('data_prevista', event.target.value)}
                />
              </label>

              <label className="instagram-editor-field">
                <span>Hora prevista</span>
                <input
                  type="time"
                  value={draft.hora_prevista}
                  onChange={(event) => updateField('hora_prevista', event.target.value)}
                />
              </label>

              <label className="instagram-editor-field">
                <span>Responsavel</span>
                <input
                  value={draft.responsavel}
                  onChange={(event) => updateField('responsavel', event.target.value)}
                  placeholder="Nome do responsavel"
                />
              </label>

              <label className={`instagram-editor-field ${draft.tipo === 'carrossel' ? 'is-full' : ''}`}>
                <span>{draft.tipo === 'carrossel' ? 'Midias do carrossel' : 'Imagem ou video'}</span>
                {draft.tipo === 'carrossel' ? (
                  <textarea
                    value={draft.midia_url}
                    onChange={(event) => updateMediaField(event.target.value)}
                    placeholder="Cole uma URL por linha ou envie arquivos abaixo. A primeira midia vira capa."
                    rows={4}
                  />
                ) : (
                  <input
                    value={draft.midia_url}
                    onChange={(event) => updateMediaField(event.target.value)}
                    placeholder="Cole a URL direta da imagem/video"
                  />
                )}
                <div className="instagram-media-uploader">
                  <label>
                    <ImageIcon size={15} />
                    <span>{draft.tipo === 'carrossel' ? 'Enviar imagens/videos' : 'Enviar imagem/video'}</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple={draft.tipo === 'carrossel'}
                      onChange={(event) => {
                        handleMediaFiles(event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <small>Links diretos abrem no preview. Links do Drive precisam estar publicos; arquivo local fica salvo no post.</small>
                </div>

                {editorMediaItems.length > 0 && (
                  <div className="instagram-editor-media-preview">
                    <div className="instagram-editor-media-preview__header">
                      <span>{editorMediaItems.length} midia(s) adicionada(s)</span>
                      <small>{draft.tipo === 'carrossel' ? 'A primeira midia sera a capa.' : 'Previa da midia principal.'}</small>
                    </div>

                    <div className="instagram-editor-media-preview__grid">
                      {editorMediaItems.map((item, index) => (
                        <article key={`${item}-${index}`}>
                          <div>
                            <InstagramMediaElement src={item} showLink />
                          </div>
                          <footer>
                            <span>{index === 0 ? 'Capa' : `Midia ${index + 1}`}</span>
                            <button type="button" onClick={() => removeMediaItem(index)} aria-label={`Remover midia ${index + 1}`}>
                              <X size={14} />
                            </button>
                          </footer>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </label>

              <label className="instagram-editor-field is-full">
                <span>Titulo interno</span>
                <input
                  value={draft.titulo_interno}
                  onChange={(event) => updateField('titulo_interno', event.target.value)}
                  placeholder="Ex: Reels educativo sobre diagnostico"
                />
              </label>

              <label className="instagram-editor-field is-full">
                <span>Legenda</span>
                <textarea
                  value={draft.legenda}
                  onChange={(event) => updateField('legenda', event.target.value)}
                  placeholder="Texto que sera publicado no Instagram"
                  rows={5}
                />
              </label>

              <label className="instagram-editor-field">
                <span>CTA</span>
                <input
                  value={draft.cta}
                  onChange={(event) => updateField('cta', event.target.value)}
                  placeholder="Ex: Agende sua avaliacao"
                />
              </label>

              <label className="instagram-editor-field">
                <span>Hashtags</span>
                <input
                  value={draft.hashtags}
                  onChange={(event) => updateField('hashtags', event.target.value)}
                  placeholder="#marketing #conteudo"
                />
              </label>

              <label className="instagram-editor-field is-full">
                <span>Observacoes internas</span>
                <textarea
                  value={draft.observacoes_internas}
                  onChange={(event) => updateField('observacoes_internas', event.target.value)}
                  placeholder="Notas para a equipe, referencias e cuidados antes de publicar"
                  rows={4}
                />
              </label>
            </div>
          </section>

          <aside className="instagram-editor-preview">
            <span>Previa rapida</span>
            <InstagramPostCard post={draft} />
            <div className="instagram-editor-preview__meta">
              <strong>{formatDate(draft.data_prevista)}</strong>
              <small>{draft.hora_prevista || 'Sem horario'} - {getPostStatusLabel(draft.status)}</small>
            </div>
          </aside>
        </div>

        <footer>
          <div className="instagram-editor-secondary-actions">
            <button
              type="button"
              className="instagram-ghost-button"
              onClick={() => onDuplicate(draft)}
              disabled={saving}
            >
              <Copy size={15} />
              Duplicar
            </button>

            <button
              type="button"
              className="instagram-danger-button"
              onClick={() => onDelete(draft)}
              disabled={saving}
            >
              <Trash2 size={15} />
              Excluir
            </button>
          </div>

          <div className="instagram-editor-primary-actions">
            <button type="button" className="instagram-ghost-button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="instagram-primary-button" disabled={saving}>
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar post'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function createPlanningDraft(planning = {}) {
  return {
    estrategia_mensal: planning.estrategia_mensal || '',
    objetivo_mes: planning.objetivo_mes || '',
    tom_comunicacao: planning.tom_comunicacao || '',
    pilares_conteudo: planning.pilares_conteudo || '',
    observacoes: planning.observacoes || '',
    status: planning.status || 'rascunho',
  };
}

function createPostDraft(post = {}, fallbackMonth = getCurrentMonthReference()) {
  const dataPrevista = String(post.data_prevista || '').slice(0, 10);
  const monthReference = post.mes_referencia || (dataPrevista ? dataPrevista.slice(0, 7) : fallbackMonth);

  return {
    id: isPreviewPlaceholderPost(post) ? '' : post.id || '',
    tipo: post.tipo || 'feed',
    midia_url: post.midia_url || post.thumbnail_url || '',
    thumbnail_url: post.thumbnail_url || post.midia_url || '',
    titulo_interno: post.titulo_interno || post.roteiro || '',
    legenda: post.legenda || '',
    cta: post.cta || '',
    hashtags: post.hashtags || '',
    data_prevista: dataPrevista,
    hora_prevista: String(post.hora_prevista || '').slice(0, 5),
    status: POST_EDITOR_STATUS.includes(post.status) ? post.status : 'rascunho',
    responsavel: post.responsavel || '',
    observacoes_internas: post.observacoes_internas || '',
    mes_referencia: monthReference || fallbackMonth,
    roteiro: post.roteiro || post.titulo_interno || '',
    status_aprovacao: post.status_aprovacao || 'em_revisao',
    alcance: post.alcance || 0,
  };
}

function getEditablePostSource(post = {}) {
  if (!isPreviewPlaceholderPost(post)) {
    return post;
  }

  return {
    ...post,
    id: '',
    status: 'rascunho',
    status_aprovacao: 'em_revisao',
    observacoes_internas: '',
  };
}

function createPreviewPlaceholderPosts(activeTab, monthReference) {
  const [year, month] = String(monthReference || getCurrentMonthReference()).split('-').map(Number);
  const safeYear = year || new Date().getFullYear();
  const safeMonth = month || new Date().getMonth() + 1;
  const baseType = activeTab === 'reels' ? 'reels' : 'feed';
  const items = activeTab === 'resultados'
    ? [
        ['Post de autoridade', 'feed', 5, 'publicado'],
        ['Reels educativo', 'reels', 12, 'aprovado'],
        ['Carrossel de prova social', 'carrossel', 20, 'em_revisao'],
      ]
    : [
        ['Tema editorial principal', baseType, 6, 'rascunho'],
        ['Conteudo de autoridade', baseType, 14, 'em_revisao'],
        ['Prova social ou bastidor', baseType, 22, 'rascunho'],
      ];

  return items.map(([title, type, day, status], index) => ({
    id: `preview-${activeTab}-${index}`,
    tipo: type,
    titulo_interno: title,
    roteiro: title,
    legenda: 'Legenda modelo para visualizar o formato do post antes do cadastro oficial.',
    cta: 'Fale com nossa equipe',
    hashtags: '#conteudo #instagram #planejamento',
    data_prevista: `${safeYear}-${String(safeMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    hora_prevista: '09:00',
    mes_referencia: `${safeYear}-${String(safeMonth).padStart(2, '0')}`,
    status,
    responsavel: 'Equipe de conteudo',
    observacoes_internas: 'Card modelo. Salve no editor para transformar em post real.',
    status_aprovacao: status === 'publicado' ? 'aprovado' : 'em_revisao',
    alcance: status === 'publicado' ? 1200 : 0,
  }));
}

function buildCalendarWeeks(monthReference, posts = []) {
  const [year, month] = String(monthReference || '').split('-').map(Number);

  if (!year || !month) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const todayKey = getDateKey(new Date());
  const postsByDate = posts.reduce((accumulator, post) => {
    const dateKey = String(post.data_prevista || '').slice(0, 10);

    if (!dateKey) return accumulator;

    return {
      ...accumulator,
      [dateKey]: [...(accumulator[dateKey] || []), post],
    };
  }, {});

  Object.keys(postsByDate).forEach((dateKey) => {
    postsByDate[dateKey].sort(comparePostsByTime);
  });

  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ date: '', day: '', posts: [], isToday: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    cells.push({
      date,
      day,
      posts: postsByDate[date] || [],
      isToday: date === todayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: '', day: '', posts: [], isToday: false });
  }

  const weeks = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

function getCurrentMonthReference() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}`;
}

function getClientName(profile) {
  const client = profile?.cliente || {};

  return client.nome || client.empresa || 'Cliente sem nome';
}

function getProfileOptionLabel(profile) {
  const clientName = getClientName(profile);
  const user = profile.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : profile.nome || 'sem usuario';

  return `${clientName} - ${user}`;
}

function getPlanningStatusLabel(value) {
  return INSTAGRAM_PLANNING_STATUS.find((status) => status.value === value)?.label || 'Rascunho';
}

function getPostMediaUrl(post) {
  const url = getPostMediaItems(post)[0] || '';

  return url;
}

function getPostMediaItems(post) {
  const source = post?.midia_url || post?.thumbnail_url || '';

  return String(source)
    .split(/\n|,/)
    .map((item) => normalizeMediaUrl(item.trim()))
    .filter(Boolean);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getPostTitle(post) {
  const source = post?.titulo_interno || post?.roteiro || post?.legenda || '';
  const firstLine = source.split('\n').find(Boolean);

  if (firstLine) {
    return firstLine.length > 62 ? `${firstLine.slice(0, 59)}...` : firstLine;
  }

  return `${getPostTypeLabel(post?.tipo)} planejado`;
}

function getPostTypeLabel(value) {
  const labels = {
    feed: 'Feed',
    reels: 'Reels',
    story: 'Story',
    carrossel: 'Carrossel',
  };

  return labels[value] || 'Feed';
}

function getPostStatusLabel(value) {
  const labels = {
    rascunho: 'Rascunho',
    em_revisao: 'Em revisao',
    aprovado: 'Aprovado',
    agendado: 'Agendado',
    reprovado: 'Reprovado',
    ajuste_solicitado: 'Ajuste solicitado',
    publicado: 'Publicado',
    arquivado: 'Arquivado',
  };

  return labels[value] || 'Em revisao';
}

function getInstagramFeedbackSummary(posts = []) {
  const summary = {
    pending: 0,
    approved: 0,
    adjustments: 0,
    rejected: 0,
    commentsTotal: 0,
    comments: [],
  };

  posts.forEach((post) => {
    const approvalStatus = getPostApprovalStatus(post);
    const comments = Array.isArray(post.comentarios) ? post.comentarios : [];

    if (approvalStatus === 'aprovado') {
      summary.approved += 1;
    } else if (approvalStatus === 'ajuste_solicitado') {
      summary.adjustments += 1;
    } else if (approvalStatus === 'reprovado') {
      summary.rejected += 1;
    } else {
      summary.pending += 1;
    }

    summary.commentsTotal += comments.length;
    comments.forEach((comment, index) => {
      summary.comments.push({
        ...comment,
        key: comment.id || `${post.id}-${comment.criado_em || index}`,
        post,
        approvalStatus,
      });
    });
  });

  summary.comments.sort((first, second) => {
    return new Date(second.criado_em || 0).getTime() - new Date(first.criado_em || 0).getTime();
  });

  return summary;
}

function getInstagramDashboardHealth(summary = {}) {
  if (summary.adjustmentsPosts > 0) {
    return {
      title: `${summary.adjustmentsPosts} ajuste${summary.adjustmentsPosts === 1 ? '' : 's'} pedindo atencao`,
      description: 'Priorize os retornos do cliente antes de liberar novos posts.',
      tone: 'red',
    };
  }

  if (summary.pendingPosts > 0) {
    return {
      title: `${summary.pendingPosts} post${summary.pendingPosts === 1 ? '' : 's'} aguardando revisao`,
      description: 'Acompanhe os links enviados e avance os clientes com pendencias.',
      tone: 'amber',
    };
  }

  if (summary.readyProfiles > 0) {
    return {
      title: `${summary.readyProfiles} cliente${summary.readyProfiles === 1 ? '' : 's'} pronto${summary.readyProfiles === 1 ? '' : 's'} para publicar`,
      description: 'Os pacotes aprovados estao organizados para a proxima etapa.',
      tone: 'green',
    };
  }

  return {
    title: 'Carteira Instagram organizada',
    description: 'Ative clientes, crie planejamentos e acompanhe aprovacoes em um fluxo unico.',
    tone: 'blue',
  };
}

function getInstagramWorkspaceTabs({ planningRecord, monthlyPosts = [], feedbackSummary = {}, hasMagicLink = false }) {
  return [
    {
      id: 'status',
      label: 'Painel',
      helper: 'Resumo do mes',
      icon: CheckCircle2,
    },
    {
      id: 'profile',
      label: 'Perfil',
      helper: 'Dados publicos',
      icon: AtSign,
    },
    {
      id: 'planning',
      label: 'Planejamento',
      helper: planningRecord ? 'Estrategia salva' : 'Criar estrategia',
      icon: BarChart3,
      badge: planningRecord ? '' : 'novo',
    },
    {
      id: 'posts',
      label: 'Posts',
      helper: 'Preview interno',
      icon: LayoutGrid,
      badge: monthlyPosts.length ? String(monthlyPosts.length) : '',
    },
    {
      id: 'feedback',
      label: 'Retornos',
      helper: 'Cliente e equipe',
      icon: MessageCircle,
      badge: feedbackSummary.commentsTotal ? String(feedbackSummary.commentsTotal) : '',
    },
    {
      id: 'calendar',
      label: 'Calendario',
      helper: 'Agenda mensal',
      icon: CalendarDays,
    },
    {
      id: 'link',
      label: 'Link',
      helper: hasMagicLink ? 'Ativo' : 'Gerar acesso',
      icon: ExternalLink,
      badge: hasMagicLink ? 'on' : '',
    },
  ];
}

function getInstagramPortfolioInsights(profiles = [], postsByProfile = {}) {
  const attention = [];
  const ready = [];

  profiles.forEach((profile) => {
    const posts = postsByProfile[profile.id] || [];
    const feedback = getInstagramFeedbackSummary(posts);
    const hasPosts = posts.length > 0;
    const attentionCount = feedback.adjustments + feedback.rejected;
    const pendingCount = feedback.pending;
    const approvedCount = feedback.approved;

    if (!hasPosts) {
      attention.push({
        profile,
        status: 'Sem posts',
        helper: 'Nenhum post cadastrado para este cliente.',
        tone: 'amber',
        postsCount: 0,
        approvedCount: 0,
        attentionCount: 1,
      });
      return;
    }

    if (attentionCount > 0) {
      attention.push({
        profile,
        status: 'Ajustes pendentes',
        helper: `${attentionCount} post${attentionCount > 1 ? 's' : ''} com ajuste ou reprovacao.`,
        tone: 'red',
        postsCount: posts.length,
        approvedCount,
        attentionCount,
      });
      return;
    }

    if (pendingCount > 0) {
      attention.push({
        profile,
        status: 'Aguardando aprovacao',
        helper: `${pendingCount} post${pendingCount > 1 ? 's' : ''} ainda sem resposta final.`,
        tone: 'blue',
        postsCount: posts.length,
        approvedCount,
        attentionCount: pendingCount,
      });
      return;
    }

    ready.push({
      profile,
      status: 'Pronto',
      helper: 'Todos os posts cadastrados estao aprovados.',
      tone: 'green',
      postsCount: posts.length,
      approvedCount,
      attentionCount: 0,
    });
  });

  return {
    attention: attention.slice(0, 5),
    ready: ready.slice(0, 5),
  };
}

function getInstagramMonthStatus({ planningRecord, planningDraft, posts = [], feedbackSummary, hasMagicLink }) {
  const planningStatus = planningRecord ? planningDraft.status || planningRecord.status || 'rascunho' : 'nao_iniciado';
  const approvalCounts = feedbackSummary || getInstagramFeedbackSummary(posts);
  const draftPosts = posts.filter((post) => post.status === 'rascunho').length;
  const scheduledPosts = posts.filter((post) => ['agendado', 'publicado'].includes(post.status)).length;
  const hasPosts = posts.length > 0;

  const items = [
    {
      id: 'planning',
      label: 'Planejamento',
      value: getPlanningStageLabel(planningStatus),
      helper: planningRecord ? 'Estrategia mensal registrada' : 'Ainda precisa criar a estrategia do mes',
      tone: planningRecord ? 'green' : 'amber',
    },
    {
      id: 'posts',
      label: 'Posts',
      value: String(posts.length),
      helper: draftPosts > 0 ? `${draftPosts} em rascunho` : hasPosts ? 'Conteudos cadastrados' : 'Nenhum post cadastrado',
      tone: hasPosts ? 'green' : 'amber',
    },
    {
      id: 'approval',
      label: 'Aprovacao',
      value: `${approvalCounts.approved}/${posts.length || 0}`,
      helper: hasMagicLink ? 'Link gerado nesta sessao' : 'Gere o link para o cliente revisar',
      tone: approvalCounts.approved > 0 ? 'green' : 'blue',
    },
    {
      id: 'returns',
      label: 'Retornos',
      value: String(approvalCounts.commentsTotal),
      helper: approvalCounts.adjustments || approvalCounts.rejected
        ? `${approvalCounts.adjustments + approvalCounts.rejected} pedem atencao`
        : 'Sem pendencias criticas',
      tone: approvalCounts.adjustments || approvalCounts.rejected ? 'red' : 'green',
    },
    {
      id: 'publish',
      label: 'Agenda/Publicacao',
      value: String(scheduledPosts),
      helper: scheduledPosts > 0 ? 'Posts agendados ou publicados' : 'Ainda sem posts agendados',
      tone: scheduledPosts > 0 ? 'green' : 'blue',
    },
  ];

  if (!planningRecord) {
    return {
      label: 'Planejamento pendente',
      tone: 'amber',
      items,
      nextStep: {
        title: 'Criar planejamento mensal',
        description: 'Defina objetivo, tom e pilares antes de cadastrar os posts.',
        action: 'Abrir planejamento',
        section: 'planning',
      },
    };
  }

  if (!hasPosts) {
    return {
      label: 'Sem posts',
      tone: 'amber',
      items,
      nextStep: {
        title: 'Cadastrar posts do mes',
        description: 'Crie os conteudos que entrarao no preview e no calendario.',
        action: 'Criar posts',
        section: 'posts',
      },
    };
  }

  if (draftPosts > 0) {
    return {
      label: 'Posts em rascunho',
      tone: 'blue',
      items,
      nextStep: {
        title: 'Finalizar rascunhos',
        description: 'Revise os posts em rascunho antes de enviar para aprovacao.',
        action: 'Ver posts',
        section: 'posts',
      },
    };
  }

  if (!hasMagicLink && approvalCounts.pending > 0) {
    return {
      label: 'Enviar aprovacao',
      tone: 'blue',
      items,
      nextStep: {
        title: 'Gerar link de aprovacao',
        description: 'Envie o preview para o cliente aprovar, comentar ou pedir ajustes.',
        action: 'Gerar link',
        section: 'link',
      },
    };
  }

  if (approvalCounts.adjustments || approvalCounts.rejected) {
    return {
      label: 'Ajustes pendentes',
      tone: 'red',
      items,
      nextStep: {
        title: 'Aplicar retornos do cliente',
        description: 'Veja os comentarios e corrija posts com ajuste solicitado ou reprovacao.',
        action: 'Ver retornos',
        section: 'feedback',
      },
    };
  }

  if (approvalCounts.pending > 0) {
    return {
      label: 'Aguardando cliente',
      tone: 'amber',
      items,
      nextStep: {
        title: 'Acompanhar aprovacao',
        description: 'Ainda existem posts aguardando resposta pelo link magico.',
        action: 'Ver retornos',
        section: 'feedback',
      },
    };
  }

  return {
    label: 'Pronto para publicar',
    tone: 'green',
    items,
    nextStep: {
      title: 'Agendar ou publicar posts',
      description: 'Todos os posts do mes foram aprovados. O proximo passo e agendar ou publicar.',
      action: 'Abrir calendario',
      section: 'calendar',
    },
  };
}

function getInstagramMonthPackage({ profile, monthReference, posts = [], feedbackSummary, monthStatus, magicLink, latestMagicLink }) {
  const client = profile?.cliente || {};
  const plannedQuantity = Math.max(
    Number(profile?.posts_mensais || profile?.quantidade_posts || client.artigos_mensais || 0),
    posts.length,
    0
  );
  const targetQuantity = plannedQuantity || posts.length || 0;
  const approved = Number(feedbackSummary?.approved || 0);
  const adjustments = Number(feedbackSummary?.adjustments || 0);
  const rejected = Number(feedbackSummary?.rejected || 0);
  const pending = Math.max(posts.length - approved - adjustments - rejected, 0);
  const progressBase = targetQuantity || posts.length || 1;
  const progress = Math.min(100, Math.round((posts.length / progressBase) * 100));
  const responsible = profile?.responsavel || client.responsavel_padrao || client.responsavel_cliente || 'Equipe de conteudo';
  const monthLabel = formatMonthLabel(monthReference);

  return {
    title: `${monthLabel} - ${getClientName(profile)}`,
    status: monthStatus?.label || 'Em planejamento',
    tone: monthStatus?.tone || 'blue',
    progress,
    responsible,
    linkStatus: getMagicLinkStatusText(magicLink, latestMagicLink),
    metrics: [
      {
        label: 'Planejados',
        value: targetQuantity || '-',
      },
      {
        label: 'Criados',
        value: posts.length,
      },
      {
        label: 'Aprovados',
        value: approved,
      },
      {
        label: 'Aguardando',
        value: pending,
      },
      {
        label: 'Com ajuste',
        value: adjustments + rejected,
      },
    ],
  };
}

function getInstagramMonthTimeline({ planningRecord, posts = [], latestMagicLink }) {
  const events = [];

  if (planningRecord?.criado_em || planningRecord?.atualizado_em) {
    events.push({
      id: `planning-${planningRecord.id || planningRecord.atualizado_em || planningRecord.criado_em}`,
      title: 'Planejamento atualizado',
      description: getPlanningStatusLabel(planningRecord.status),
      date: planningRecord.atualizado_em || planningRecord.criado_em,
      tone: 'blue',
    });
  }

  if (latestMagicLink?.criado_em) {
    events.push({
      id: `link-created-${latestMagicLink.id || latestMagicLink.criado_em}`,
      title: 'Link de aprovacao gerado',
      description: latestMagicLink.expira_em ? `Expira em ${formatDateTime(latestMagicLink.expira_em)}` : 'Link sem expiracao informada',
      date: latestMagicLink.criado_em,
      tone: isMagicLinkExpired(latestMagicLink) ? 'amber' : 'green',
    });
  }

  if (latestMagicLink?.ultimo_acesso_em) {
    events.push({
      id: `link-access-${latestMagicLink.id || latestMagicLink.ultimo_acesso_em}`,
      title: 'Cliente acessou o preview',
      description: 'O link magico foi aberto pelo cliente.',
      date: latestMagicLink.ultimo_acesso_em,
      tone: 'blue',
    });
  }

  posts.forEach((post) => {
    const approvalStatus = getPostApprovalStatus(post);

    if (post.criado_em) {
      events.push({
        id: `post-created-${post.id}`,
        title: 'Post criado',
        description: getPostTitle(post),
        date: post.criado_em,
        tone: 'blue',
      });
    }

    if (post.aprovado_em) {
      events.push({
        id: `post-approved-${post.id}`,
        title: 'Post aprovado',
        description: getPostTitle(post),
        date: post.aprovado_em,
        tone: 'green',
      });
    }

    if (post.ajuste_solicitado_em) {
      events.push({
        id: `post-adjust-${post.id}`,
        title: 'Ajuste solicitado',
        description: getPostTitle(post),
        date: post.ajuste_solicitado_em,
        tone: 'amber',
      });
    }

    if (post.reprovado_em) {
      events.push({
        id: `post-rejected-${post.id}`,
        title: 'Post reprovado',
        description: getPostTitle(post),
        date: post.reprovado_em,
        tone: 'red',
      });
    }

    const comments = Array.isArray(post.comentarios) ? post.comentarios : [];
    comments.forEach((comment, index) => {
      events.push({
        id: comment.id || `comment-${post.id}-${index}`,
        title: approvalStatus === 'aprovado' ? 'Comentario em post aprovado' : 'Comentario recebido',
        description: `${getPostTitle(post)}: ${comment.mensagem || 'Sem mensagem'}`,
        date: comment.criado_em,
        tone: approvalStatus === 'ajuste_solicitado' ? 'amber' : approvalStatus === 'reprovado' ? 'red' : 'blue',
      });
    });
  });

  return events
    .filter((event) => event.date)
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 8);
}

function getPlanningStageLabel(status) {
  const labels = {
    nao_iniciado: 'Nao iniciado',
    rascunho: 'Rascunho',
    em_revisao: 'Em revisao',
    aprovado: 'Pronto',
    concluido: 'Pronto',
    publicado: 'Pronto',
  };

  return labels[status] || getPlanningStatusLabel(status);
}

function hasUsableMagicLink(generatedLink, latestLink) {
  if (generatedLink?.url) return true;
  if (!latestLink?.ativo) return false;

  return !isMagicLinkExpired(latestLink);
}

function isMagicLinkExpired(link) {
  if (!link?.expira_em) return false;

  return new Date(link.expira_em).getTime() < Date.now();
}

function getMagicLinkStatusText(generatedLink, latestLink) {
  if (generatedLink?.url) {
    return `Novo link gerado, expira em ${formatDateTime(generatedLink.expiresAt)}`;
  }

  if (!latestLink) return 'Link de aprovacao ainda nao gerado';
  if (!latestLink.ativo) return 'Ultimo link esta desativado';
  if (isMagicLinkExpired(latestLink)) return `Ultimo link expirou em ${formatDateTime(latestLink.expira_em)}`;

  return `Ultimo link ativo ate ${formatDateTime(latestLink.expira_em)}`;
}

function getFeedbackIcon(status) {
  if (status === 'aprovado') return <CheckCircle2 size={17} />;
  if (status === 'reprovado') return <XCircle size={17} />;
  if (status === 'ajuste_solicitado') return <RotateCcw size={17} />;

  return <MessageCircle size={17} />;
}

function getPostApprovalStatus(post) {
  if (post?.status_aprovacao) return post.status_aprovacao;
  if (['aprovado', 'reprovado', 'ajuste_solicitado'].includes(post?.status)) return post.status;

  return 'aguardando_aprovacao';
}

function getPostApprovalStatusLabel(value) {
  const labels = {
    aguardando_aprovacao: 'Aguardando aprovacao',
    em_revisao: 'Aguardando aprovacao',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
    ajuste_solicitado: 'Ajuste solicitado',
  };

  return labels[value] || 'Aguardando aprovacao';
}

function getPostApprovalStatusDescription(value) {
  const descriptions = {
    aguardando_aprovacao: 'O cliente ainda nao respondeu pelo link de aprovacao.',
    em_revisao: 'O cliente ainda nao respondeu pelo link de aprovacao.',
    aprovado: 'O cliente aprovou este conteudo pelo link magico.',
    reprovado: 'O cliente reprovou este conteudo. Revise antes de reenviar.',
    ajuste_solicitado: 'O cliente solicitou ajustes neste conteudo.',
  };

  return descriptions[value] || descriptions.aguardando_aprovacao;
}

function formatDate(value) {
  if (!value) return 'Sem data';

  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);

  if (!year || !month || !day) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatMonthLabel(value) {
  if (!value) return 'Mes nao definido';

  const [year, month] = String(value).split('-').map(Number);

  if (!year || !month) return value;

  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat('pt-BR', {
    notation: Number(value || 0) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function sumPostMetric(posts, field) {
  return formatCompactNumber(posts.reduce((total, post) => total + Number(post?.[field] || 0), 0));
}

function isUpcomingPost(post) {
  if (!post?.data_prevista) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limit = new Date(today);
  limit.setDate(limit.getDate() + 14);

  const [year, month, day] = String(post.data_prevista).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return false;

  const postDate = new Date(year, month - 1, day);

  return postDate >= today && postDate <= limit && post.status !== 'publicado';
}

function comparePostsByTime(firstPost, secondPost) {
  const firstTime = String(firstPost.hora_prevista || '99:99').slice(0, 5);
  const secondTime = String(secondPost.hora_prevista || '99:99').slice(0, 5);

  return firstTime.localeCompare(secondTime);
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDefaultPostDate(monthReference) {
  const [year, month] = String(monthReference || getCurrentMonthReference()).split('-').map(Number);
  const safeYear = year || new Date().getFullYear();
  const safeMonth = month || new Date().getMonth() + 1;

  return `${safeYear}-${String(safeMonth).padStart(2, '0')}-01`;
}

function isPreviewPlaceholderPost(post) {
  return String(post?.id || '').startsWith('preview-');
}

function InstagramProfileRow({ profile, selected, onSelect }) {
  const client = profile.cliente || {};
  const clientName = client.nome || client.empresa || 'Cliente sem nome';

  return (
    <button
      type="button"
      className={`instagram-row ${selected ? 'is-selected' : ''}`}
      onClick={onSelect}
    >
      <div className="instagram-row__client">
        <div className="instagram-row__avatar">
          {profile.foto_url ? (
            <img src={normalizeUrl(profile.foto_url)} alt="" />
          ) : (
            getInitials(clientName)
          )}
        </div>

        <div>
          <strong>{clientName}</strong>
          <span>{client.empresa || client.email || 'Carteira de clientes'}</span>
        </div>
      </div>

      <div className="instagram-row__meta">
        <strong>{profile.nome || 'Perfil sem nome'}</strong>
        <span>Nome do perfil</span>
      </div>

      <div className="instagram-row__meta">
        <strong>{profile.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : 'Nao informado'}</strong>
        <span>Usuario</span>
      </div>

      <div className="instagram-row__meta">
        <span className={`instagram-status ${profile.ativo ? 'is-active' : 'is-inactive'}`}>
          <CheckCircle2 size={14} />
          {profile.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="instagram-row__meta">
        <strong>{formatDateTime(profile.atualizado_em || profile.criado_em)}</strong>
        <span>Ultima atualizacao</span>
      </div>
    </button>
  );
}

function getInstagramActionError(error, fallback) {
  const message = String(error?.message || '');

  if (/relation|column|schema|does not exist|cache/i.test(message)) {
    return `${fallback} Verifique se as migrations 004, 005, 006, 007, 008 e 017 foram rodadas no Supabase.`;
  }

  if (/row-level security|permission|not authorized|unauthorized|policy/i.test(message)) {
    return `${fallback} Verifique as permissoes/RLS do Supabase para o usuario logado.`;
  }

  return message || fallback;
}

function getInstagramConnectionReason(reason) {
  const reasons = {
    instagram_autorizacao_negada: 'A autorizacao do Instagram foi cancelada ou negada.',
    instagram_codigo_ausente: 'O Instagram nao retornou o codigo de autorizacao.',
    instagram_state_invalido: 'A sessao de conexao expirou. Tente conectar novamente.',
    instagram_state_expirado: 'A sessao de conexao expirou. Tente conectar novamente.',
    instagram_perfil_nao_encontrado: 'Perfil Instagram nao encontrado no CRM.',
    instagram_token_invalido: 'Nao foi possivel obter o token do Instagram.',
    instagram_callback_erro: 'Nao foi possivel concluir a conexao com Instagram.',
  };

  return reasons[reason] || 'Nao foi possivel concluir a conexao com Instagram.';
}

function getInstagramConnectionStatus(profile) {
  const status = profile?.meta_connection_status || (profile?.meta_account_id ? 'conectado' : 'desconectado');

  if (status === 'conectado') {
    return {
      connected: true,
      tone: 'green',
      title: 'Instagram conectado',
      description: 'A conta pode sincronizar dados basicos do perfil e metricas disponiveis pela API.',
    };
  }

  if (status === 'pendente') {
    return {
      connected: false,
      tone: 'amber',
      title: 'Conexao pendente',
      description: 'A autorizacao foi iniciada. Se for cliente externo, envie o link para ele abrir logado no Instagram correto.',
    };
  }

  if (status === 'expirado') {
    return {
      connected: false,
      tone: 'red',
      title: 'Token expirado',
      description: 'Reconecte a conta para voltar a sincronizar os dados deste perfil.',
    };
  }

  if (status === 'erro') {
    return {
      connected: false,
      tone: 'red',
      title: 'Conexao com erro',
      description: profile?.meta_error || 'Revise a conexao e tente autorizar novamente.',
    };
  }

  return {
    connected: false,
    tone: 'muted',
    title: 'Instagram nao conectado',
    description: 'Preencha o @ esperado e envie o link de autorizacao para o cliente conectar a conta correta.',
  };
}

function getInitials(value) {
  return String(value || 'IG')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function normalizeInstagramUser(value) {
  return String(value || '').trim().replace(/^@+/, '');
}

function buildInstagramAuthorizationMessage(profile, url) {
  const clientName = getClientName(profile);
  const expectedUser = profile?.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : 'o Instagram da sua empresa';

  return [
    `Ola, ${clientName}.`,
    '',
    'Para conectarmos o Instagram ao painel da agencia, acesse o link abaixo e autorize com a conta correta:',
    '',
    url,
    '',
    `Importante: abra o link logado no perfil ${expectedUser}.`,
    'Nao precisa enviar senha. A autorizacao e feita diretamente pela Meta/Instagram.',
  ].join('\n');
}

function buildInstagramAuthorizationEmailUrl(profile, url) {
  const client = profile?.cliente || {};
  const email = String(client.email || '').trim();
  const subject = `Autorizacao do Instagram - ${getClientName(profile)}`;
  const body = buildInstagramAuthorizationMessage(profile, url);

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildInstagramAuthorizationWhatsAppUrl(profile, url) {
  const client = profile?.cliente || {};
  const phone = normalizeBrazilianPhone(client.whatsapp || client.telefone);
  const message = encodeURIComponent(buildInstagramAuthorizationMessage(profile, url));

  return phone
    ? `https://wa.me/${phone}?text=${message}`
    : `https://wa.me/?text=${message}`;
}

function normalizeBrazilianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;

  return digits;
}

function normalizeUrl(url) {
  const trimmedUrl = String(url || '').trim();

  if (!trimmedUrl) return '';
  if (trimmedUrl.startsWith('data:')) return trimmedUrl;
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) return trimmedUrl;

  return `https://${trimmedUrl}`;
}

function normalizeMediaUrl(url) {
  const value = normalizeUrl(url);

  if (!value) return '';
  if (value.startsWith('data:')) return value;

  const driveFileMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (driveFileMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
  }

  const driveOpenMatch = value.match(/[?&]id=([^&]+)/i);
  if (/drive\.google\.com/i.test(value) && driveOpenMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }

  if (/dropbox\.com/i.test(value)) {
    return value.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=0/i, '');
  }

  return value;
}

function isVideoMedia(url) {
  const value = String(url || '').toLowerCase();

  return value.startsWith('data:video/') || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(value);
}

function formatDateTime(value) {
  if (!value) return 'Nao informado';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

async function copyTextToClipboard(value) {
  const text = String(value || '').trim();

  if (!text) return;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}
