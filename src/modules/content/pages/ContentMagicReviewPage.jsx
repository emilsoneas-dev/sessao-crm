import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, MessageCircle, RotateCcw } from 'lucide-react';
import {
  fetchContentMagicReviewByToken,
  finalizeContentMagicReview,
  formatMonthReferenceLabel,
  getContentDeliveryStatusLabel,
  submitContentMagicBriefing,
  submitContentMagicReviewAction,
} from '../services/contentService.js';
import '../styles/content.css';

export function ContentMagicReviewPage() {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState('');
  const [started, setStarted] = useState(false);
  const [activeView, setActiveView] = useState('strategy');
  const [feedback, setFeedback] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [briefingMode, setBriefingMode] = useState('invite');
  const [briefingForm, setBriefingForm] = useState({
    servico_produto_destaque: '',
    campanha_evento_data: '',
    perguntas_frequentes_clientes: '',
    observacoes_equipe: '',
  });

  const token = useMemo(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const rawToken = pathParts[1] || '';

    try {
      return decodeURIComponent(rawToken);
    } catch {
      return rawToken;
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadReview() {
      if (!token) {
        setErrorStatus('invalid');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchContentMagicReviewByToken(token);

        if (ignore) return;

        if (data?.status !== 'ok') {
          setErrorStatus(data?.status || 'invalid');
          setReview(null);
          return;
        }

        setReview(data);
        setErrorStatus('');
      } catch (error) {
        console.error('Erro ao carregar revisao de conteudo:', error);

        if (!ignore) {
          setErrorStatus(error?.code === 'CONTENT_REVIEW_RPC_MISSING' ? 'setup' : 'invalid');
          setReview(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadReview();

    return () => {
      ignore = true;
    };
  }, [token]);

  const items = useMemo(() => sortItems(review?.items || []), [review?.items]);
  const delivery = review?.delivery || {};
  const client = review?.client || {};
  const activeItem = items.find((item) => item.id === activeView) || null;
  const activeItemIndex = activeItem ? items.findIndex((item) => item.id === activeItem.id) : -1;
  const reviewStats = useMemo(() => getReviewStats(items), [items]);
  const reviewedCount = reviewStats.reviewed;
  const reviewComplete = items.length > 0 && reviewedCount >= items.length;
  const reviewLocked = Boolean(delivery.revisao_concluida_em);
  const progressPercent = items.length ? Math.round((reviewedCount / items.length) * 100) : 0;
  const pendingCount = Math.max(items.length - reviewedCount, 0);
  const headerStatusText = reviewLocked
    ? `Revisao concluida em ${formatDateTime(delivery.revisao_concluida_em)}. Link em modo leitura.`
    : pendingCount
      ? `${pendingCount} item(ns) pendente(s)`
      : 'Todos os itens revisados';

  useEffect(() => {
    if (!reviewLocked || loading) return;

    setStarted(true);
    setActiveView('complete');
  }, [loading, reviewLocked]);

  function startReview() {
    setStarted(true);
    setActiveView(reviewLocked ? 'complete' : getNextPendingItem('', items)?.id || items[0]?.id || 'strategy');
  }

  function openActionModal(action) {
    setActionModal(action);
    setActionComment('');
    setFeedback('');
  }

  async function handleSubmitAction(action, comment = '') {
    if (!activeItem?.id || actionLoading) return;

    if (reviewLocked) {
      setFeedback('Esta revisao ja foi finalizada. O link esta em modo leitura.');
      return;
    }

    if ((action === 'revisar' || action === 'comentar') && !comment.trim()) {
      setFeedback('Descreva os ajustes ou escreva um comentario para continuar.');
      return;
    }

    try {
      setActionLoading(true);
      const updatedReview = await submitContentMagicReviewAction(token, activeItem.id, action, comment);

      if (updatedReview?.status !== 'ok') {
        setErrorStatus(updatedReview?.status || 'invalid');
        return;
      }

      const updatedItems = sortItems(updatedReview.items || []);
      setReview(updatedReview);
      setActionModal(null);
      setActionComment('');

      if (action === 'aprovar' || action === 'revisar') {
        const nextItem = getNextPendingItem(activeItem.id, updatedItems);
        setActiveView(nextItem?.id || 'complete');
      }

      const messages = {
        aprovar: 'Item aprovado. Vamos para o proximo pendente.',
        revisar: 'Ajustes enviados. Vamos para o proximo pendente.',
        comentar: 'Comentario salvo neste item.',
      };
      setFeedback(messages[action]);
    } catch (error) {
      console.error('Erro ao registrar revisao publica:', error);
      setFeedback(error?.message || 'Nao foi possivel registrar sua acao.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmitBriefing() {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setFeedback('');

      const updatedReview = await submitContentMagicBriefing(token, briefingForm);

      if (updatedReview?.status !== 'ok') {
        setErrorStatus(updatedReview?.status || 'invalid');
        return;
      }

      setReview(updatedReview);
      setBriefingMode('submitted');
      setFeedback('Sugestoes enviadas com sucesso.');
    } catch (error) {
      console.error('Erro ao enviar briefing do proximo mes:', error);
      setFeedback(error?.message || 'Nao foi possivel enviar suas sugestoes.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFinalizeReview() {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setFeedback('');

      const updatedReview = await finalizeContentMagicReview(token);

      if (updatedReview?.status !== 'ok') {
        setErrorStatus(updatedReview?.status || 'invalid');
        return;
      }

      setReview(updatedReview);
      setStarted(true);
      setActiveView('complete');
      setFeedback('Revisao finalizada. Nossa equipe ja recebeu o aviso.');
    } catch (error) {
      console.error('Erro ao finalizar revisao publica:', error);
      setFeedback(error?.message || 'Nao foi possivel finalizar a revisao.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="content-public-page">
        <div className="content-public-state">
          <span className="app-loading-spinner" />
          <strong>Carregando revisao...</strong>
        </div>
      </main>
    );
  }

  if (errorStatus) {
    return (
      <main className="content-public-page">
        <div className="content-public-state">
          <FileText size={30} />
          <strong>{getPublicErrorTitleSafe(errorStatus)}</strong>
          <p>{getPublicErrorMessageSafe(errorStatus)}</p>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="content-public-page">
        <section className="content-public-intro">
          <header>
            <span>Central de revisao</span>
            <h1>{client.nome || client.empresa || 'Cliente'}</h1>
            <p>Revise a estrategia e aprove os textos planejados para este periodo.</p>
          </header>

          <div className="content-public-summary">
            <InfoCard label="Cliente" value={client.nome || client.empresa || 'Nao informado'} />
            <InfoCard label="Periodo" value={formatMonthReferenceLabel(delivery.mes_referencia)} />
            <InfoCard label="Itens" value={items.length} />
            <InfoCard label="Progresso" value={`${reviewedCount}/${items.length} revisados`} />
          </div>

          <article className="content-public-objective">
            <span>Objetivo da estrategia</span>
            <p>{delivery.objetivo_estrategia || 'A estrategia editorial ainda nao foi preenchida pela equipe.'}</p>
          </article>

          <button type="button" className="content-public-primary" onClick={startReview}>
            {reviewLocked ? 'Ver resumo final' : 'Iniciar revisao'}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="content-public-page">
      <section className="content-public-review">
        <header className="content-public-review-header">
          <div>
            <span>Central de revisao</span>
            <h1>{client.nome || client.empresa || 'Cliente'}</h1>
            <p>{formatMonthReferenceLabel(delivery.mes_referencia)} - {headerStatusText}</p>
          </div>

          <div className="content-public-review-header__progress" aria-label={`Progresso da revisao: ${progressPercent}%`}>
            <strong>{progressPercent}%</strong>
            <span>{reviewedCount}/{items.length} revisados</span>
            <ProgressBar value={progressPercent} />
          </div>
        </header>

        <aside className="content-public-sidebar">
          <div className="content-public-sidebar__header">
            <span>Revisao guiada</span>
            <strong>{formatMonthReferenceLabel(delivery.mes_referencia)}</strong>
            <small>{reviewLocked ? 'Modo leitura' : `${reviewedCount}/${items.length} revisados`}</small>
            <ProgressBar value={progressPercent} />
          </div>

          <button
            type="button"
            className={activeView === 'strategy' ? 'is-active' : ''}
            onClick={() => {
              setActiveView('strategy');
              setFeedback('');
            }}
          >
            <span>Estrategia</span>
            <small>Contexto editorial</small>
          </button>

          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={[
                activeView === item.id ? 'is-active' : '',
                `content-public-sidebar__item--${item.status || 'default'}`,
              ].filter(Boolean).join(' ')}
              onClick={() => {
                setActiveView(item.id);
                setFeedback('');
              }}
            >
              <span>{index + 1}. {item.titulo || 'Item sem titulo'}</span>
              <small>
                {getContentDeliveryStatusLabel(item.status)}
                {item.aprovado_em ? ` - ${formatDateTime(item.aprovado_em)}` : ''}
              </small>
            </button>
          ))}

          {(reviewComplete || reviewLocked) && (
            <button
              type="button"
              className={activeView === 'complete' ? 'is-active' : ''}
              onClick={() => {
                setActiveView('complete');
                setFeedback('');
              }}
            >
              <span>Revisao concluida</span>
              <small>Resumo final</small>
            </button>
          )}
        </aside>

        <section className="content-public-document">
          {activeView === 'complete' ? (
            <ReviewCompleteState
              stats={reviewStats}
              items={items}
              briefings={review?.briefings || []}
              briefingMode={briefingMode}
              briefingForm={briefingForm}
              saving={actionLoading}
              onStartBriefing={() => {
                setBriefingMode('form');
                setFeedback('');
              }}
              onSkipBriefing={() => {
                setBriefingMode('skipped');
                setFeedback('');
              }}
              onChangeBriefing={(field, value) => {
                setBriefingForm((current) => ({ ...current, [field]: value }));
              }}
              onSubmitBriefing={handleSubmitBriefing}
              onFinalizeReview={handleFinalizeReview}
              reviewLocked={reviewLocked}
              finishedAt={delivery.revisao_concluida_em}
              feedback={feedback}
            />
          ) : activeItem ? (
            <>
              <div className="content-public-article-bar">
                <div className="content-public-article-bar__title">
                  <span>Artigo {activeItemIndex + 1} de {items.length}</span>
                  <strong>{activeItem.titulo || 'Item sem titulo'}</strong>
                  <small>{pendingCount ? `${pendingCount} pendente(s) nesta revisao` : 'Todos os itens revisados'}</small>
                </div>

                {reviewLocked ? (
                  <div className="content-public-locked-badge">
                    Revisao concluida
                  </div>
                ) : (
                  <div className="content-public-article-actions">
                    <span className={`content-public-status-pill content-public-status-pill--${activeItem.status || 'default'}`}>
                      {getContentDeliveryStatusLabel(activeItem.status)}
                    </span>
                    <button type="button" className="content-public-action-button content-public-action-button--approve" onClick={() => handleSubmitAction('aprovar')} disabled={actionLoading}>
                      <CheckCircle2 size={16} />
                      {actionLoading ? 'Salvando...' : 'Aprovar'}
                    </button>
                    <button type="button" className="content-public-action-button" onClick={() => openActionModal('revisar')} disabled={actionLoading}>
                      <RotateCcw size={16} />
                      Revisar
                    </button>
                    <button type="button" className="content-public-action-button content-public-action-button--quiet" onClick={() => openActionModal('comentar')} disabled={actionLoading}>
                      <MessageCircle size={16} />
                      Comentar
                    </button>
                  </div>
                )}
              </div>

              {feedback && <div className="content-public-feedback">{feedback}</div>}
              {reviewLocked && (
                <div className="content-public-feedback content-public-feedback--locked">
                  Esta revisao foi finalizada em {formatDateTime(delivery.revisao_concluida_em)}. O link permanece disponivel apenas para consulta.
                </div>
              )}

              <article className="content-public-paper">
                <span>{getTypeLabel(activeItem.tipo)}</span>
                <h1>{activeItem.titulo || 'Item sem titulo'}</h1>
                {(activeItem.palavra_chave_principal || activeItem.meta_title || activeItem.meta_description) && (
                  <div className="content-public-paper__meta">
                    {activeItem.palavra_chave_principal && <p><strong>Palavra-chave</strong>{activeItem.palavra_chave_principal}</p>}
                    {activeItem.meta_title && <p><strong>Meta title</strong>{activeItem.meta_title}</p>}
                    {activeItem.meta_description && <p><strong>Meta description</strong>{activeItem.meta_description}</p>}
                  </div>
                )}
                <div className="content-public-paper__body">{activeItem.conteudo || 'Texto ainda nao cadastrado.'}</div>
              </article>

              <ReviewHistory item={activeItem} />
            </>
          ) : (
            <article className="content-public-paper content-public-paper--strategy">
              <span>Estrategia Editorial</span>
              <h1>{delivery.titulo || 'Estrategia da entrega'}</h1>
              <p><strong>Objetivo:</strong> {delivery.objetivo_estrategia || 'Nao informado.'}</p>
              <p><strong>Publico-alvo:</strong> {delivery.publico_alvo || 'Nao informado.'}</p>
              <p><strong>Tom de comunicacao:</strong> {delivery.tom_comunicacao || 'Nao informado.'}</p>
              <p><strong>Palavras-chave:</strong> {delivery.palavras_chave || 'Nao informado.'}</p>
              <p><strong>Servicos priorizados:</strong> {delivery.servicos_priorizados || 'Nao informado.'}</p>
              <p><strong>Objetivos de SEO:</strong> {delivery.objetivos_seo || 'Nao informado.'}</p>
            </article>
          )}
        </section>
      </section>

      {actionModal && (
        <ReviewCommentModal
          action={actionModal}
          value={actionComment}
          saving={actionLoading}
          onChange={setActionComment}
          onClose={() => {
            setActionModal(null);
            setActionComment('');
          }}
          onSubmit={() => handleSubmitAction(actionModal, actionComment)}
        />
      )}
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressBar({ value }) {
  const normalizedValue = Math.max(0, Math.min(Number(value) || 0, 100));

  return (
    <div className="content-public-progress" aria-hidden="true">
      <span style={{ width: `${normalizedValue}%` }} />
    </div>
  );
}

function sortItems(items) {
  return [...items].sort((first, second) => {
    const orderDiff = Number(first.ordem || 0) - Number(second.ordem || 0);
    if (orderDiff !== 0) return orderDiff;

    return new Date(first.criado_em || 0) - new Date(second.criado_em || 0);
  });
}

function getReviewStats(items) {
  return items.reduce((stats, item) => {
    stats.total += 1;

    if (isReviewedItem(item)) stats.reviewed += 1;
    if (item.status === 'aprovado') stats.approved += 1;
    if (item.status === 'revisar') stats.revision += 1;
    if (item.status === 'publicado') stats.published += 1;

    return stats;
  }, {
    total: 0,
    reviewed: 0,
    approved: 0,
    revision: 0,
    published: 0,
  });
}

function isReviewedItem(item) {
  return ['aprovado', 'revisar', 'publicado'].includes(item?.status);
}

function getNextPendingItem(currentItemId, sourceItems) {
  const orderedItems = sortItems(sourceItems || []);
  const currentIndex = orderedItems.findIndex((item) => item.id === currentItemId);
  const nextItems = currentIndex >= 0
    ? orderedItems.slice(currentIndex + 1).concat(orderedItems.slice(0, currentIndex + 1))
    : orderedItems;

  return nextItems.find((item) => !isReviewedItem(item)) || null;
}

function ReviewHistory({ item }) {
  const comments = item?.comentarios || [];
  const decisions = item?.historico || [];
  const lastDecision = decisions[decisions.length - 1] || null;

  return (
    <aside className="content-public-history">
      <div>
        <span>Historico do item</span>
        <strong>{lastDecision ? getHistoryEventLabel(lastDecision.evento) : 'Sem decisoes registradas'}</strong>
        {lastDecision?.data_decisao && <small>Ultima acao em {formatDateTime(lastDecision.data_decisao)}</small>}
      </div>

      {item.aprovado_em && (
        <div className="content-public-history__decision content-public-history__decision--approved">
          Aprovado em {formatDateTime(item.aprovado_em)}
        </div>
      )}

      {item.revisar_em && (
        <div className="content-public-history__decision content-public-history__decision--revision">
          Revisao solicitada em {formatDateTime(item.revisar_em)}
        </div>
      )}

      <div className="content-public-comments">
        <span>Comentarios</span>
        {comments.length ? comments.map((comment) => (
          <article key={comment.id}>
            <strong>{comment.autor_nome || 'Cliente'}</strong>
            <small>{formatDateTime(comment.criado_em)} - {getInteractionLabel(comment.tipo_interacao)}</small>
            <p>{comment.mensagem}</p>
          </article>
        )) : (
          <p>Nenhum comentario registrado para este item.</p>
        )}
      </div>
    </aside>
  );
}

function ReviewCompleteState({
  stats,
  items,
  briefings,
  briefingMode,
  briefingForm,
  saving,
  reviewLocked,
  finishedAt,
  feedback,
  onStartBriefing,
  onSkipBriefing,
  onChangeBriefing,
  onSubmitBriefing,
  onFinalizeReview,
}) {
  const hasSubmittedBriefing = briefings?.length > 0 || briefingMode === 'submitted';
  const shouldShowFinalizeCard = !reviewLocked && briefingMode !== 'skipped';

  return (
    <article className={`content-public-complete${reviewLocked ? ' content-public-complete--locked' : ''}`}>
      <CheckCircle2 size={36} aria-hidden="true" />
      <span>{reviewLocked ? 'Modo leitura' : 'Revisao concluida'}</span>
      <h1>{reviewLocked ? 'Revisao finalizada' : 'Obrigado, recebemos seus retornos.'}</h1>
      <p>
        {reviewLocked
          ? 'Esta entrega esta bloqueada para novas alteracoes pelo link publico. Voce ainda pode consultar os itens e retornos enviados.'
          : 'Finalize para avisar a equipe e deixar este link apenas em modo leitura.'}
      </p>

      {feedback && <div className="content-public-feedback">{feedback}</div>}

      <div className="content-public-summary">
        <InfoCard label="Revisados" value={`${stats.reviewed}/${stats.total}`} />
        <InfoCard label="Aprovados" value={stats.approved} />
        <InfoCard label="Para revisar" value={stats.revision} />
        <InfoCard label="Publicados" value={stats.published} />
      </div>

      <div className="content-public-complete__list">
        {items.map((item, index) => (
          <div key={item.id}>
            <strong>{index + 1}. {item.titulo || 'Item sem titulo'}</strong>
            <small>{getContentDeliveryStatusLabel(item.status)}</small>
          </div>
        ))}
      </div>

      {reviewLocked ? (
        <div className="content-public-finalized-note">
          <CheckCircle2 size={18} aria-hidden="true" />
          <div>
            <strong>Revisao finalizada</strong>
            <span>Concluida em {formatDateTime(finishedAt)}. Nossa equipe seguira com publicacao ou ajustes.</span>
          </div>
        </div>
      ) : shouldShowFinalizeCard ? (
        <div className="content-public-finalize-card">
          <div>
            <span>Concluir processo</span>
            <strong>Finalizar e avisar a equipe</strong>
            <p>Depois de finalizar, este link ficara em modo leitura e nao aceitara novas aprovacoes, revisoes ou comentarios.</p>
          </div>
          <button type="button" className="content-public-primary" onClick={onFinalizeReview} disabled={saving}>
            {saving ? 'Finalizando...' : 'Finalizar revisao'}
          </button>
        </div>
      ) : null}

      {!reviewLocked && (
        <section className="content-public-next-briefing">
          {hasSubmittedBriefing ? (
          <div className="content-public-next-briefing__done">
            <span>Proximo planejamento</span>
            <h2>Sugestoes recebidas</h2>
            <p>Obrigado. Nossa equipe usara suas respostas para preparar uma estrategia ainda melhor para o proximo mes.</p>
          </div>
        ) : briefingMode === 'skipped' ? (
          <div className="content-public-next-briefing__done">
            <span>Finalizar revisao</span>
            <h2>Perfeito!</h2>
            <p>Nossa equipe preparara a estrategia do proximo mes com base:</p>
            <ul>
              <li>nos itens aprovados;</li>
              <li>no desempenho do projeto;</li>
              <li>nas oportunidades identificadas;</li>
              <li>no planejamento estrategico do cliente.</li>
            </ul>
            <p>Caso tenha alguma solicitacao especifica futuramente, basta entrar em contato conosco.</p>
            {!reviewLocked && (
              <button type="button" className="content-public-primary" onClick={onFinalizeReview} disabled={saving}>
                {saving ? 'Finalizando...' : 'Finalizar revisao'}
              </button>
            )}
          </div>
        ) : briefingMode === 'form' ? (
          <div className="content-public-next-briefing__form">
            <span>Briefing opcional</span>
            <h2>Personalizar estrategia</h2>
            <BriefingQuestion
              label="Existe algum servico, produto ou procedimento que voce gostaria de destacar no proximo mes?"
              value={briefingForm.servico_produto_destaque}
              onChange={(value) => onChangeBriefing('servico_produto_destaque', value)}
            />
            <BriefingQuestion
              label="Existe alguma campanha, evento ou data importante?"
              value={briefingForm.campanha_evento_data}
              onChange={(value) => onChangeBriefing('campanha_evento_data', value)}
            />
            <BriefingQuestion
              label="Tem algum assunto que seus clientes ou pacientes tem perguntado com frequencia?"
              value={briefingForm.perguntas_frequentes_clientes}
              onChange={(value) => onChangeBriefing('perguntas_frequentes_clientes', value)}
            />
            <BriefingQuestion
              label="Existe alguma observacao para nossa equipe?"
              value={briefingForm.observacoes_equipe}
              onChange={(value) => onChangeBriefing('observacoes_equipe', value)}
            />
            <div className="content-public-next-briefing__actions">
              <button type="button" onClick={onSkipBriefing} disabled={saving}>Agora nao</button>
              <button type="button" className="content-public-primary" onClick={onSubmitBriefing} disabled={saving}>
                {saving ? 'Enviando...' : 'Enviar sugestoes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="content-public-next-briefing__invite">
            <span>Proximo mes</span>
            <h2>Quer nos ajudar a preparar uma estrategia ainda melhor para o proximo mes?</h2>
            <p>Leva menos de 2 minutos e e totalmente opcional.</p>
            <div className="content-public-next-briefing__actions">
              <button type="button" className="content-public-primary" onClick={onStartBriefing}>
                Personalizar estrategia
              </button>
              <button type="button" onClick={onSkipBriefing}>Agora nao</button>
            </div>
          </div>
          )}
        </section>
      )}
    </article>
  );
}

function BriefingQuestion({ label, value, onChange }) {
  return (
    <label className="content-public-briefing-question">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        placeholder="Escreva aqui..."
      />
    </label>
  );
}

function ReviewCommentModal({ action, value, saving, onChange, onClose, onSubmit }) {
  const isRevision = action === 'revisar';

  return (
    <div className="content-public-modal" role="dialog" aria-modal="true">
      <div className="content-public-modal__card">
        <header>
          <span>{isRevision ? 'Solicitar ajustes' : 'Comentar item'}</span>
          <h2>{isRevision ? 'Descreva os ajustes desejados' : 'Adicionar comentario'}</h2>
          <p>
            {isRevision
              ? 'Seu comentario e obrigatorio para orientar a equipe.'
              : 'Esse comentario nao altera o status do item.'}
          </p>
        </header>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={isRevision ? 'Explique o que precisa ser ajustado...' : 'Escreva seu comentario...'}
          rows={6}
          autoFocus
        />

        <footer>
          <button type="button" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className="content-public-primary" onClick={onSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Enviar'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function getHistoryEventLabel(event) {
  const labels = {
    conteudo_aprovado: 'Item aprovado',
    conteudo_enviado_para_revisao: 'Ajuste solicitado',
    comentario_criado: 'Comentario criado',
  };

  return labels[event] || 'Historico atualizado';
}

function getInteractionLabel(type) {
  const labels = {
    comentario: 'Comentario',
    aprovacao: 'Aprovacao',
    revisao: 'Revisao',
    publicacao: 'Publicacao',
  };

  return labels[type] || 'Comentario';
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

function getTypeLabel(value) {
  const labels = {
    artigo: 'Artigo',
    landing_page: 'Landing page',
    email: 'Email',
    newsletter: 'Newsletter',
    roteiro: 'Roteiro',
    outro: 'Outro',
  };

  return labels[value] || 'Item';
}

function getPublicErrorTitleSafe(status) {
  if (status === 'setup') return 'Configuracao pendente';
  if (status === 'expired') return 'Link expirado';
  if (status === 'inactive') return 'Link desativado';

  return 'Link invalido';
}

function getPublicErrorMessageSafe(status) {
  if (status === 'setup') return 'A funcao publica do link magico ainda nao foi instalada no Supabase. Rode as migrations de Conteudo ate a 015.';
  if (status === 'expired') return 'Solicite um novo link de revisao para a agencia.';
  if (status === 'inactive') return 'Este link foi desativado pela agencia.';

  return 'Nao foi possivel encontrar uma revisao valida para este link.';
}

function getPublicErrorTitle(status) {
  if (status === 'setup') return 'Configuração pendente';
  if (status === 'expired') return 'Link expirado';
  if (status === 'inactive') return 'Link desativado';

  return 'Link invalido';
}

function getPublicErrorMessage(status) {
  if (status === 'setup') return 'A função pública do link mágico ainda não foi instalada no Supabase. Rode a migration 013_content_review_actions_rpc.sql.';
  if (status === 'expired') return 'Solicite um novo link de revisao para a agencia.';
  if (status === 'inactive') return 'Este link foi desativado pela agencia.';

  return 'Nao foi possivel encontrar uma revisao valida para este link.';
}
