import { CalendarCheck, Clock3, FileText, Link2, MessageCircle, Send } from 'lucide-react';
import {
  formatMonthReferenceLabel,
  getContentDeliveryStatusLabel,
  getContentDeliveryWorkflowKey,
  getContentDeliveryWorkflowStatus,
} from '../services/contentService.js';

export function ContentHistoryPanel({
  client,
  delivery,
  items = [],
  comments = [],
  history = [],
  briefings = [],
  magicLinks = [],
}) {
  if (!delivery) return null;

  const clientName = client?.nome || client?.empresa || 'Cliente sem nome';
  const approvedCount = items.filter((item) => item.status === 'aprovado').length;
  const revisionCount = items.filter((item) => item.status === 'revisar').length;
  const reviewedCount = items.filter((item) => ['aprovado', 'revisar', 'publicado'].includes(item.status)).length;
  const firstMagicLink = magicLinks[0] || null;
  const reviewFinishedAt = delivery.revisao_concluida_em || getLatestDecisionDate(items);
  const reviewTime = getReviewDuration(firstMagicLink?.ultimo_acesso_em || firstMagicLink?.criado_em, reviewFinishedAt);
  const nextStep = getNextStepLabel(delivery);
  const hasStrategy = [
    delivery.objetivo_estrategia,
    delivery.publico_alvo,
    delivery.tom_comunicacao,
    delivery.palavras_chave,
    delivery.servicos_priorizados,
    delivery.objetivos_seo,
  ].some((value) => String(value || '').trim());

  return (
    <article className="content-history-panel">
      <header className="content-panel__toolbar">
        <div>
          <span className="content-kicker">Historico</span>
          <h2>Historico do pacote</h2>
          <p>Linha do tempo, retornos do cliente e briefing em um unico lugar.</p>
        </div>
      </header>

      <section className="content-history-overview" aria-label="Resumo da entrega">
        <div className="content-history-overview__main">
          <span className="content-kicker">Resumo</span>
          <h3>{clientName}</h3>
          <p>{delivery.titulo || 'Entrega mensal'} - {formatMonthReferenceLabel(delivery.mes_referencia)}</p>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{getContentDeliveryWorkflowStatus(delivery)}</dd>
            </div>
            <div>
              <dt>Responsavel</dt>
              <dd>{delivery.responsavel || 'Nao informado'}</dd>
            </div>
            <div>
              <dt>Conclusao</dt>
              <dd>{formatDateTime(reviewFinishedAt)}</dd>
            </div>
            <div>
              <dt>Tempo de revisao</dt>
              <dd>{reviewTime}</dd>
            </div>
            <div>
              <dt>Proximo passo</dt>
              <dd>{nextStep}</dd>
            </div>
          </dl>
        </div>

        <div className="content-history-overview__metrics">
          <HistoryStat icon={FileText} label="Itens" value={items.length} helper={`${reviewedCount} revisado(s)`} />
          <HistoryStat icon={CalendarCheck} label="Aprovados" value={approvedCount} helper="Liberados" />
          <HistoryStat icon={Clock3} label="Ajustes" value={revisionCount} helper="Pedem revisao" />
          <HistoryStat icon={MessageCircle} label="Comentarios" value={comments.length} helper="Recebidos" />
        </div>
      </section>

      {delivery.revisao_concluida_em && (
        <section className={`content-history-next-step content-history-next-step--${getContentDeliveryWorkflowKey(delivery)}`}>
          <div>
            <span className="content-kicker">Proximo passo</span>
            <h3>{nextStep}</h3>
            <p>
              Revisao finalizada em {formatDateTime(delivery.revisao_concluida_em)} com {approvedCount} aprovado(s)
              {revisionCount > 0 ? ` e ${revisionCount} item(ns) para ajuste.` : '.'}
            </p>
          </div>
        </section>
      )}

      <section className="content-history-main-grid">
        <TimelineCard
          delivery={delivery}
          magicLinks={magicLinks}
          hasStrategy={hasStrategy}
          reviewFinishedAt={reviewFinishedAt}
        />

        <div className="content-history-side-stack">
          <LinksCard magicLinks={magicLinks} />
          <EventsCard history={history} items={items} />
        </div>
      </section>

      <section className="content-history-detail-stack">
        <CommentsCard comments={comments} items={items} />
        <BriefingsCard briefings={briefings} delivery={delivery} />
      </section>
    </article>
  );
}

function getNextStepLabel(delivery) {
  const workflowStatus = getContentDeliveryWorkflowKey(delivery);

  if (workflowStatus === 'ajustes_solicitados') return 'Aplicar ajustes';
  if (workflowStatus === 'pronto_publicar') return 'Publicar itens';

  return delivery?.revisao_concluida_em ? 'Validar conclusao' : 'Aguardar revisao';
}

function HistoryStat({ icon: Icon, label, value, helper }) {
  return (
    <div>
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function TimelineCard({ delivery, magicLinks, hasStrategy, reviewFinishedAt }) {
  const firstMagicLink = magicLinks[0] || null;

  const events = [
    {
      title: 'Entrega criada',
      detail: delivery.titulo || 'Entrega mensal',
      date: delivery.criado_em,
    },
    {
      title: hasStrategy ? 'Estrategia criada' : 'Estrategia pendente',
      detail: hasStrategy ? 'Direcao editorial registrada.' : 'Ainda sem estrategia editorial completa.',
      date: hasStrategy ? delivery.atualizado_em || delivery.criado_em : null,
    },
    {
      title: firstMagicLink ? 'Enviado ao cliente' : 'Link ainda nao gerado',
      detail: firstMagicLink ? 'Link magico criado para revisao.' : 'Gere um link para iniciar a revisao externa.',
      date: firstMagicLink?.criado_em,
    },
    {
      title: firstMagicLink?.ultimo_acesso_em ? 'Link utilizado' : 'Aguardando acesso',
      detail: firstMagicLink?.ultimo_acesso_em ? 'Cliente acessou a Central de Revisao.' : 'Nenhum acesso registrado no link magico.',
      date: firstMagicLink?.ultimo_acesso_em,
    },
    {
      title: reviewFinishedAt ? 'Revisao concluida' : 'Revisao em andamento',
      detail: reviewFinishedAt ? 'Todos os itens foram revisados.' : 'Ainda existem itens pendentes.',
      date: reviewFinishedAt,
    },
  ];

  return (
    <HistoryCard title="Linha do tempo" icon={Clock3} featured>
      <div className="content-history-timeline">
        {events.map((event) => (
          <div key={event.title}>
            <span />
            <div>
              <strong>{event.title}</strong>
              <p>{event.detail}</p>
              <small>{formatDateTime(event.date)}</small>
            </div>
          </div>
        ))}
      </div>
    </HistoryCard>
  );
}

function LinksCard({ magicLinks }) {
  return (
    <HistoryCard title="Link magico utilizado" icon={Link2} count={magicLinks.length} collapsible>
      {magicLinks.length ? (
        <div className="content-history-list">
          {magicLinks.map((link) => (
            <div key={link.id}>
              <strong>{link.ativo ? 'Link ativo' : 'Link desativado'}</strong>
              <span>Criado em {formatDateTime(link.criado_em)}</span>
              <span>Ultimo acesso: {formatDateTime(link.ultimo_acesso_em)}</span>
              <span>Expira em {formatDateTime(link.expira_em)}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyText text="Nenhum link magico foi gerado para esta entrega." />
      )}
    </HistoryCard>
  );
}

function CommentsCard({ comments, items }) {
  return (
    <HistoryCard title="Comentarios recebidos" icon={MessageCircle} count={comments.length} collapsible defaultOpen={comments.length > 0}>
      {comments.length ? (
        <div className="content-history-list">
          {comments.map((comment) => (
            <div key={comment.id}>
              <strong>{findItemTitle(items, comment.item_id)}</strong>
              <span>{comment.autor_nome || 'Cliente'} - {getInteractionLabel(comment.tipo_interacao)}</span>
              <p>{comment.mensagem}</p>
              <small>{formatDateTime(comment.criado_em)}</small>
            </div>
          ))}
        </div>
      ) : (
        <EmptyText text="Nenhum comentario registrado nesta entrega." />
      )}
    </HistoryCard>
  );
}

function EventsCard({ history, items }) {
  return (
    <HistoryCard title="Alteracoes registradas" icon={Send} count={history.length} collapsible>
      {history.length ? (
        <div className="content-history-list">
          {history.map((event) => (
            <div key={event.id}>
              <strong>{getEventLabel(event.evento)}</strong>
              <span>{findItemTitle(items, event.item_id)}</span>
              <span>{getContentDeliveryStatusLabel(event.status_anterior)} {'->'} {getContentDeliveryStatusLabel(event.status_novo)}</span>
              {event.observacao && <p>{event.observacao}</p>}
              <small>{formatDateTime(event.data_decisao || event.criado_em)}</small>
            </div>
          ))}
        </div>
      ) : (
        <EmptyText text="Nenhuma alteracao registrada ainda." />
      )}
    </HistoryCard>
  );
}

function BriefingsCard({ briefings, delivery }) {
  return (
    <HistoryCard
      title="Briefing do proximo mes"
      icon={FileText}
      count={briefings.length}
      collapsible
      defaultOpen={briefings.length > 0}
      helper={delivery?.titulo || 'Entrega relacionada'}
    >
      {briefings.length ? (
        briefings.map((briefing) => (
          <article key={briefing.id}>
            <span>Enviado em {formatDateTime(briefing.enviado_em || briefing.criado_em)}</span>
            <BriefingAnswer label="Servico, produto ou procedimento" value={briefing.servico_produto_destaque} />
            <BriefingAnswer label="Campanha, evento ou data importante" value={briefing.campanha_evento_data} />
            <BriefingAnswer label="Perguntas frequentes dos clientes" value={briefing.perguntas_frequentes_clientes} />
            <BriefingAnswer label="Observacoes para equipe" value={briefing.observacoes_equipe} />
          </article>
        ))
      ) : (
        <EmptyText text="O cliente ainda nao enviou sugestoes para o proximo mes." />
      )}
    </HistoryCard>
  );
}

function BriefingAnswer({ label, value }) {
  return (
    <div>
      <strong>{label}</strong>
      <p>{value || 'Nao informado.'}</p>
    </div>
  );
}

function HistoryCard({ title, icon: Icon, children, count, collapsible = false, defaultOpen = false, featured = false, helper }) {
  const className = [
    'content-history-card',
    featured ? 'content-history-card--featured' : '',
    collapsible ? 'content-history-card--collapsible' : '',
  ].filter(Boolean).join(' ');

  if (collapsible) {
    return (
      <details className={className} open={defaultOpen}>
        <summary>
          <span>
            <Icon size={18} aria-hidden="true" />
            <strong>{title}</strong>
            {helper && <small>{helper}</small>}
          </span>
          {typeof count === 'number' && <em>{count}</em>}
        </summary>
        <div className="content-history-card__body">{children}</div>
      </details>
    );
  }

  return (
    <section className={className}>
      <header>
        <Icon size={18} aria-hidden="true" />
        <h3>{title}</h3>
      </header>
      {children}
    </section>
  );
}

function EmptyText({ text }) {
  return <p className="content-history-empty">{text}</p>;
}

function findItemTitle(items, itemId) {
  if (!itemId) return 'Entrega';

  const item = items.find((current) => current.id === itemId);
  return item?.titulo || 'Item removido ou nao localizado';
}

function getLatestDecisionDate(items) {
  const dates = items
    .map((item) => item.ultima_decisao_em || item.aprovado_em || item.revisar_em)
    .filter(Boolean)
    .map((date) => new Date(date));

  if (!dates.length) return '';

  return new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString();
}

function getReviewDuration(start, end) {
  if (!start || !end) return 'Nao concluido';

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return 'Nao informado';
  }

  const minutes = Math.max(1, Math.round((endTime - startTime) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}min`;

  return `${minutes}min`;
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

function getEventLabel(event) {
  const labels = {
    conteudo_aprovado: 'Item aprovado',
    conteudo_enviado_para_revisao: 'Ajuste solicitado',
    comentario_criado: 'Comentario criado',
    briefing_proximo_mes_enviado: 'Briefing enviado',
  };

  return labels[event] || 'Evento registrado';
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
