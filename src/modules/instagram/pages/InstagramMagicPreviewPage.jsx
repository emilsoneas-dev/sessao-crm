import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Camera, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, ImageIcon, MessageCircle, RotateCcw, Send, X, XCircle } from 'lucide-react';
import {
  fetchInstagramMagicPreviewByToken,
  submitInstagramMagicApproval,
} from '../services/instagramService.js';
import '../styles/instagram.css';

const PUBLIC_TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'reels', label: 'Reels' },
  { id: 'resultados', label: 'Resultados' },
];

export function InstagramMagicPreviewPage() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedPost, setSelectedPost] = useState(null);

  const token = useMemo(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    return pathParts[1] || '';
  }, []);

  const monthReference = useMemo(() => {
    return new URLSearchParams(window.location.search).get('mes') || getCurrentMonthReference();
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPreview() {
      if (!token) {
        setErrorStatus('invalid');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchInstagramMagicPreviewByToken(token);

        if (ignore) return;

        if (data?.status !== 'ok') {
          setErrorStatus(data?.status || 'invalid');
          setPreview(null);
          return;
        }

        setPreview(data);
        setErrorStatus('');
      } catch (error) {
        console.error('Erro ao carregar link magico Instagram:', error);

        if (!ignore) {
          setErrorStatus('invalid');
          setPreview(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      ignore = true;
    };
  }, [token]);

  async function reloadPreview(selectedPostId = '') {
    const data = await fetchInstagramMagicPreviewByToken(token);

    if (data?.status !== 'ok') {
      setErrorStatus(data?.status || 'invalid');
      setPreview(null);
      return null;
    }

    setPreview(data);
    setErrorStatus('');

    if (selectedPostId) {
      setSelectedPost((data.posts || []).find((post) => post.id === selectedPostId) || null);
    }

    return data;
  }

  async function handleSubmitPostApproval(post, action, comment) {
    await submitInstagramMagicApproval(token, post.id, action, comment);
    await reloadPreview(post.id);
  }

  const monthlyPosts = useMemo(() => {
    const posts = preview?.posts || [];

    return posts.filter((post) => {
      const postMonth = post.mes_referencia || String(post.data_prevista || '').slice(0, 7);

      return postMonth === monthReference;
    });
  }, [preview, monthReference]);

  const visiblePosts = useMemo(() => {
    if (activeTab === 'feed') {
      return monthlyPosts.filter((post) => ['feed', 'carrossel'].includes(post.tipo || 'feed'));
    }

    if (activeTab === 'reels') {
      return monthlyPosts.filter((post) => post.tipo === 'reels');
    }

    return monthlyPosts;
  }, [activeTab, monthlyPosts]);

  if (loading) {
    return (
      <main className="instagram-public-page">
        <div className="instagram-public-state">
          <span className="app-loading-spinner" />
          <strong>Carregando preview...</strong>
        </div>
      </main>
    );
  }

  if (errorStatus) {
    return (
      <main className="instagram-public-page">
        <div className="instagram-public-state">
          <Camera size={30} />
          <strong>{getPublicErrorTitle(errorStatus)}</strong>
          <p>{getPublicErrorMessage(errorStatus)}</p>
        </div>
      </main>
    );
  }

  const profile = preview?.profile || {};

  return (
    <main className="instagram-public-page">
      <section className="instagram-public-shell">
        <header className="instagram-public-header">
          <div>
            <p>Preview Instagram</p>
            <h1>{profile.cliente_nome || profile.nome || 'Instagram'}</h1>
            <span>{formatMonthLabel(monthReference)}</span>
          </div>

          <div className="instagram-public-expiration">
            <span>Link valido ate</span>
            <strong>{formatDateTime(preview?.link?.expira_em)}</strong>
          </div>
        </header>

        <section className="instagram-profile-preview instagram-profile-preview--public">
          <div className="instagram-profile-preview__avatar">
            {profile.foto_url ? (
              <img src={normalizeUrl(profile.foto_url)} alt="" />
            ) : (
              <Camera size={34} />
            )}
          </div>

          <div className="instagram-profile-preview__content">
            <div className="instagram-profile-preview__topline">
              <div>
                <h4>{profile.nome || profile.cliente_nome || 'Perfil Instagram'}</h4>
                <span>{profile.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : '@usuario'}</span>
              </div>

              <div className="instagram-profile-preview__stats" aria-label="Estatisticas do perfil">
                <div>
                  <strong>{monthlyPosts.length}</strong>
                  <span>Posts</span>
                </div>
                <div>
                  <strong>{formatCompactNumber(profile.seguidores || 0)}</strong>
                  <span>Seguidores</span>
                </div>
                <div>
                  <strong>{formatCompactNumber(profile.seguindo || 0)}</strong>
                  <span>Seguindo</span>
                </div>
              </div>
            </div>

            <p>{profile.bio || 'Bio ainda nao preenchida para este perfil.'}</p>

            {profile.site ? (
              <a href={normalizeUrl(profile.site)} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                {profile.site}
              </a>
            ) : (
              <span className="instagram-profile-preview__empty-link">Link do perfil nao informado</span>
            )}
          </div>
        </section>

        <div className="instagram-tabs instagram-preview-tabs" aria-label="Preview Instagram">
          {PUBLIC_TABS.map((tab) => (
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

        {activeTab === 'resultados' && (
          <div className="instagram-results-strip">
            <div>
              <BarChart3 size={16} />
              <span>Resultados do periodo</span>
            </div>
            <strong>{sumPostMetric(monthlyPosts, 'alcance')}</strong>
            <small>alcance total</small>
          </div>
        )}

        <div className="instagram-preview-grid">
          {visiblePosts.length === 0 ? (
            <div className="instagram-empty instagram-empty--compact">
              Nenhum post planejado para esta aba.
            </div>
          ) : (
            visiblePosts.map((post) => (
              <PublicInstagramPostCard
                key={post.id}
                post={post}
                onOpen={() => setSelectedPost(post)}
              />
            ))
          )}
        </div>
      </section>

      {selectedPost && (
        <PublicPostModal
          post={selectedPost}
          profile={profile}
          onSubmitApproval={handleSubmitPostApproval}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </main>
  );
}

function PublicInstagramPostCard({ post, onOpen }) {
  const mediaItems = getPostMediaItems(post);
  const mediaUrl = mediaItems[0] || '';
  const approvalStatus = getPostApprovalStatus(post);

  return (
    <button type="button" className="instagram-post-card" onClick={onOpen}>
      <div className="instagram-post-card__media">
        {mediaUrl ? (
          <InstagramPublicMediaElement src={mediaUrl} />
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
      </div>
    </button>
  );
}

function PublicPostModal({ post, profile, onClose, onSubmitApproval }) {
  const mediaItems = getPostMediaItems(post);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const mediaUrl = mediaItems[activeMediaIndex] || '';
  const hasCarousel = mediaItems.length > 1;
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submittingAction, setSubmittingAction] = useState('');
  const [actionDialog, setActionDialog] = useState('');
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

  async function handleAction(action, actionComment = '') {
    const normalizedComment = String(actionComment || '').trim();

    if (['reprovar', 'solicitar_ajuste', 'comentar'].includes(action) && !normalizedComment) {
      setFeedback('Escreva um comentario antes de continuar.');
      return;
    }

    try {
      setSubmittingAction(action);
      setFeedback('');
      await onSubmitApproval(post, action, normalizedComment);
      setComment('');
      setActionDialog('');
      setFeedback(getApprovalSuccessMessage(action));
    } catch (error) {
      console.error('Erro ao registrar aprovacao Instagram:', error);
      setFeedback(error?.message || 'Nao foi possivel registrar sua resposta.');
    } finally {
      setSubmittingAction('');
    }
  }

  return (
    <div className="instagram-preview-modal" role="dialog" aria-modal="true">
      <div className="instagram-preview-modal__backdrop" onClick={onClose} />

      <article className="instagram-preview-modal__panel instagram-preview-modal__panel--public-post">
        <header className="instagram-public-post-header">
          <div className="instagram-public-post-author">
            <div className="instagram-public-post-author__avatar">
              {profile?.foto_url ? (
                <img src={normalizeUrl(profile.foto_url)} alt="" />
              ) : (
                <Camera size={18} />
              )}
            </div>
            <div>
              <strong>{profile?.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : profile?.nome || 'Perfil Instagram'}</strong>
              <span>{formatDate(post.data_prevista)}{post.hora_prevista ? ` as ${String(post.hora_prevista).slice(0, 5)}` : ''}</span>
            </div>
          </div>

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
              <InstagramPublicMediaElement src={mediaUrl} showLink />
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
            <div className="instagram-public-post-media-bar">
              <span>{getPostTypeLabel(post.tipo)}</span>
              <strong>{hasCarousel ? `${activeMediaIndex + 1}/${mediaItems.length}` : getPostApprovalStatusLabel(approvalStatus)}</strong>
            </div>
          </div>

          <div className="instagram-preview-modal__details">
            <section className="instagram-public-caption">
              <div className="instagram-public-post-author instagram-public-post-author--compact">
                <div className="instagram-public-post-author__avatar">
                  {profile?.foto_url ? (
                    <img src={normalizeUrl(profile.foto_url)} alt="" />
                  ) : (
                    <Camera size={16} />
                  )}
                </div>
                <div>
                  <strong>{profile?.usuario ? `@${normalizeInstagramUser(profile.usuario)}` : profile?.nome || 'Perfil Instagram'}</strong>
                  <span>{getPostTypeLabel(post.tipo)}</span>
                </div>
              </div>
              <p>{post.legenda || 'Legenda ainda nao cadastrada.'}</p>
            </section>

            <section className={`instagram-approval-summary instagram-approval-summary--${approvalStatus}`}>
              <span>Status de aprovacao</span>
              <strong>{getPostApprovalStatusLabel(approvalStatus)}</strong>
              <p>{getPostApprovalStatusDescription(approvalStatus)}</p>
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

            <section className="instagram-approval-panel">
              <div className="instagram-approval-panel__header">
                <div>
                  <span>Resposta do cliente</span>
                  <strong>Escolha uma acao para este post</strong>
                </div>
                <MessageCircle size={18} />
              </div>

              <div className="instagram-approval-actions">
                <button
                  type="button"
                  className="instagram-approval-action instagram-approval-action--approve"
                  onClick={() => handleAction('aprovar')}
                  disabled={Boolean(submittingAction)}
                >
                  <CheckCircle2 size={16} />
                  {submittingAction === 'aprovar' ? 'Aprovando...' : 'Aprovar post'}
                </button>
                <button
                  type="button"
                  className="instagram-approval-action instagram-approval-action--comment"
                  onClick={() => {
                    setComment('');
                    setFeedback('');
                    setActionDialog('comentar');
                  }}
                  disabled={Boolean(submittingAction)}
                >
                  <MessageCircle size={16} />
                  Comentar
                </button>
                <button
                  type="button"
                  className="instagram-approval-action instagram-approval-action--adjust"
                  onClick={() => {
                    setComment('');
                    setFeedback('');
                    setActionDialog('solicitar_ajuste');
                  }}
                  disabled={Boolean(submittingAction)}
                >
                  <RotateCcw size={16} />
                  Solicitar ajuste
                </button>
                <button
                  type="button"
                  className="instagram-approval-action instagram-approval-action--reject"
                  onClick={() => {
                    setComment('');
                    setFeedback('');
                    setActionDialog('reprovar');
                  }}
                  disabled={Boolean(submittingAction)}
                >
                  <XCircle size={16} />
                  Reprovar
                </button>
              </div>

              {feedback && (
                <p className={`instagram-approval-feedback ${feedback.includes('registrada') || feedback.includes('aprovado') ? 'is-success' : ''}`}>
                  <Send size={14} />
                  {feedback}
                </p>
              )}
            </section>

            {actionDialog && (
              <section className="instagram-approval-dialog">
                <div className="instagram-approval-dialog__header">
                  <div>
                    <span>{getApprovalDialogEyebrow(actionDialog)}</span>
                    <strong>{getApprovalDialogTitle(actionDialog)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActionDialog('');
                      setComment('');
                    }}
                    aria-label="Fechar comentario"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p>{getApprovalDialogDescription(actionDialog)}</p>

                <textarea
                  value={comment}
                  onChange={(event) => {
                    setComment(event.target.value);
                    setFeedback('');
                  }}
                  placeholder={getApprovalDialogPlaceholder(actionDialog)}
                  rows={4}
                />

                <div className="instagram-approval-dialog__actions">
                  <button
                    type="button"
                    className="instagram-approval-action"
                    onClick={() => {
                      setActionDialog('');
                      setComment('');
                    }}
                    disabled={Boolean(submittingAction)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={`instagram-approval-action instagram-approval-action--${getApprovalActionVariant(actionDialog)}`}
                    onClick={() => handleAction(actionDialog, comment)}
                    disabled={Boolean(submittingAction)}
                  >
                    <Send size={15} />
                    {submittingAction === actionDialog ? 'Enviando...' : getApprovalDialogSubmitLabel(actionDialog)}
                  </button>
                </div>
              </section>
            )}

            <section className="instagram-comment-history">
              <span>Historico de comentarios</span>
              {comments.length === 0 ? (
                <p>Nenhum comentario registrado neste post.</p>
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
          </div>
        </div>
      </article>
    </div>
  );
}

function InstagramPublicMediaElement({ src, showLink = false }) {
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

function getPublicErrorTitle(status) {
  if (status === 'expired') return 'Link expirado';
  if (status === 'inactive') return 'Link desativado';

  return 'Link invalido';
}

function getPublicErrorMessage(status) {
  if (status === 'expired') {
    return 'Solicite um novo link de aprovacao para a agencia.';
  }

  if (status === 'inactive') {
    return 'Este link foi desativado pela agencia.';
  }

  return 'Nao foi possivel encontrar um preview valido para este link.';
}

function getCurrentMonthReference() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}`;
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
  };

  return labels[value] || 'Em revisao';
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
    aguardando_aprovacao: 'A agencia ainda aguarda sua resposta sobre este conteudo.',
    em_revisao: 'A agencia ainda aguarda sua resposta sobre este conteudo.',
    aprovado: 'Este post foi aprovado pelo cliente.',
    reprovado: 'Este post foi reprovado e precisa ser revisado pela agencia.',
    ajuste_solicitado: 'O cliente pediu ajustes antes da aprovacao final.',
  };

  return descriptions[value] || descriptions.aguardando_aprovacao;
}

function getApprovalSuccessMessage(action) {
  const messages = {
    aprovar: 'Aprovacao registrada com sucesso.',
    reprovar: 'Reprovacao registrada com sucesso.',
    solicitar_ajuste: 'Solicitacao de ajuste registrada com sucesso.',
    comentar: 'Comentario salvo com sucesso.',
  };

  return messages[action] || 'Resposta registrada com sucesso.';
}

function getApprovalDialogEyebrow(action) {
  const labels = {
    comentar: 'Comentario',
    solicitar_ajuste: 'Ajuste solicitado',
    reprovar: 'Reprovacao',
  };

  return labels[action] || 'Resposta';
}

function getApprovalDialogTitle(action) {
  const labels = {
    comentar: 'Adicionar comentario sem alterar o status',
    solicitar_ajuste: 'Descreva os ajustes desejados',
    reprovar: 'Explique por que este post foi reprovado',
  };

  return labels[action] || 'Enviar resposta';
}

function getApprovalDialogDescription(action) {
  const descriptions = {
    comentar: 'Use este campo para orientar a agencia sem aprovar ou reprovar o post.',
    solicitar_ajuste: 'Seu comentario e obrigatorio para que a equipe saiba exatamente o que alterar.',
    reprovar: 'Informe o motivo da reprovacao para evitar retrabalho e facilitar a revisao.',
  };

  return descriptions[action] || 'Escreva sua mensagem para a agencia.';
}

function getApprovalDialogPlaceholder(action) {
  const placeholders = {
    comentar: 'Escreva uma observacao para a agencia...',
    solicitar_ajuste: 'Ex: Ajustar legenda, trocar imagem, alterar CTA...',
    reprovar: 'Explique o motivo da reprovacao...',
  };

  return placeholders[action] || 'Escreva seu comentario...';
}

function getApprovalDialogSubmitLabel(action) {
  const labels = {
    comentar: 'Salvar comentario',
    solicitar_ajuste: 'Enviar ajuste',
    reprovar: 'Enviar reprovacao',
  };

  return labels[action] || 'Enviar';
}

function getApprovalActionVariant(action) {
  const variants = {
    comentar: 'comment',
    solicitar_ajuste: 'adjust',
    reprovar: 'reject',
  };

  return variants[action] || 'comment';
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

function formatDateTime(value) {
  if (!value) return 'Sem expiracao';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
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

function normalizeInstagramUser(value) {
  return String(value || '').trim().replace(/^@+/, '');
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
