import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Edit3,
  FileText,
  MessageCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { getContentDeliveryStatusLabel } from '../services/contentService.js';

const TYPE_LABELS = {
  artigo: 'Artigo',
  landing_page: 'Landing page',
  email: 'Email',
  newsletter: 'Newsletter',
  roteiro: 'Roteiro',
  outro: 'Outro',
};

export function ContentArticlesPanel({
  delivery,
  items,
  loading = false,
  focusItemId = '',
  onCreate,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
}) {
  const [activeItemId, setActiveItemId] = useState('');
  const orderedItems = useMemo(() => sortItems(items), [items]);
  const stats = useMemo(() => getArticleStats(orderedItems), [orderedItems]);

  useEffect(() => {
    if (!orderedItems.length) {
      setActiveItemId('');
      return;
    }

    if (focusItemId && orderedItems.some((item) => item.id === focusItemId)) {
      setActiveItemId(focusItemId);
      return;
    }

    setActiveItemId((current) => (
      orderedItems.some((item) => item.id === current) ? current : orderedItems[0].id
    ));
  }, [focusItemId, orderedItems]);

  const activeItem = orderedItems.find((item) => item.id === activeItemId) || null;

  return (
    <article className="content-articles-panel">
      <header className="content-panel__toolbar">
        <div>
          <span className="content-kicker">Itens do pacote</span>
          <h2>Textos do pacote</h2>
          <p>{delivery?.titulo || 'Pacote mensal'}</p>
        </div>

        <div className="content-articles-toolbar">
          <div className="content-articles-stats" aria-label="Resumo dos itens">
            <span>{stats.total} total</span>
            <span>{stats.approved} aprovados</span>
            <span>{stats.revision} ajustes</span>
            <span>{stats.pending} pendentes</span>
          </div>

          <button type="button" className="content-primary-button" onClick={onCreate}>
            <Plus size={16} aria-hidden="true" />
            Novo item
          </button>
        </div>
      </header>

      {loading ? (
        <div className="content-empty-state content-empty-state--compact">
          <FileText size={24} aria-hidden="true" />
          <strong>Carregando itens...</strong>
          <span>Buscando os textos deste pacote.</span>
        </div>
      ) : orderedItems.length ? (
        <div className="content-articles-layout">
          <div className="content-articles-list">
            <div className="content-articles-list__header">
              <div>
                <span className="content-kicker">Lista do pacote</span>
                <strong>{orderedItems.length} item(ns)</strong>
              </div>
              <small>Selecione um item para ler ou editar</small>
            </div>

            <div className="content-article-items" role="list">
              {orderedItems.map((item, index) => (
                <article
                  key={item.id}
                  className={[
                    'content-article-item',
                    activeItem?.id === item.id ? 'is-active' : '',
                    item.status === 'revisar' ? 'requires-review' : '',
                  ].filter(Boolean).join(' ')}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="content-article-item__main"
                    onClick={() => setActiveItemId(item.id)}
                  >
                    <span>{item.ordem || index + 1}</span>
                    <div>
                      <strong>{item.titulo || 'Item sem titulo'}</strong>
                      <small>{item.palavra_chave_principal || TYPE_LABELS[item.tipo] || 'Item'}</small>
                    </div>
                    <StatusBadge status={item.status} />
                  </button>

                  <div className="content-article-item__meta">
                    <span>{TYPE_LABELS[item.tipo] || 'Outro'}</span>
                    <span>{formatDateTime(item.atualizado_em || item.criado_em)}</span>
                  </div>

                  <div className="content-article-item__actions">
                    <button type="button" className="content-icon-button" onClick={() => onEdit(item)} aria-label="Editar item">
                      <Edit3 size={15} aria-hidden="true" />
                    </button>
                    <button type="button" className="content-icon-button" onClick={() => onDuplicate(item)} aria-label="Duplicar item">
                      <Copy size={15} aria-hidden="true" />
                    </button>
                    <button type="button" className="content-icon-button" onClick={() => onMove(item, 'up')} disabled={index === 0} aria-label="Mover para cima">
                      <ArrowUp size={15} aria-hidden="true" />
                    </button>
                    <button type="button" className="content-icon-button" onClick={() => onMove(item, 'down')} disabled={index === orderedItems.length - 1} aria-label="Mover para baixo">
                      <ArrowDown size={15} aria-hidden="true" />
                    </button>
                    <button type="button" className="content-icon-button content-icon-button--danger" onClick={() => onDelete(item)} aria-label="Excluir item">
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <ArticleReader item={activeItem} onEdit={onEdit} />
        </div>
      ) : (
        <div className="content-empty-state content-empty-state--compact content-empty-state--with-action">
          <FileText size={24} aria-hidden="true" />
          <strong>Nenhum item cadastrado</strong>
          <span>Adicione o primeiro artigo, roteiro, email ou landing page deste pacote.</span>
          <div className="content-empty-state__action">
            <button type="button" className="content-primary-button" onClick={onCreate}>
              <Plus size={16} aria-hidden="true" />
              Criar primeiro item
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function ArticleReader({ item, onEdit }) {
  if (!item) return null;

  return (
    <aside className="content-article-reader">
      <div className="content-article-reader__header">
        <div>
          <span>{TYPE_LABELS[item.tipo] || 'Item'}</span>
          <h3>{item.titulo || 'Item sem titulo'}</h3>
          <small>Ordem {item.ordem || 1} - {formatDateTime(item.atualizado_em || item.criado_em)}</small>
        </div>

        <button type="button" className="content-action-button" onClick={() => onEdit(item)}>
          <Edit3 size={16} aria-hidden="true" />
          Editar
        </button>
      </div>

      <div className="content-article-reader__meta">
        <Info label="Status" value={getContentDeliveryStatusLabel(item.status)} />
        <Info label="Tipo" value={TYPE_LABELS[item.tipo] || 'Outro'} />
        <Info label="Palavra-chave" value={item.palavra_chave_principal || 'Nao informada'} />
        <Info label="Meta title" value={item.meta_title || 'Nao informado'} />
        <Info label="Meta description" value={item.meta_description || 'Nao informada'} />
      </div>

      {item.status === 'revisar' && (
        <div className="content-article-reader__alert">
          <strong>Ajuste solicitado pelo cliente</strong>
          <span>Confira os comentarios recebidos antes de atualizar o texto.</span>
        </div>
      )}

      <div className="content-article-reader__body">
        <span>Texto completo</span>
        <article>{item.conteudo || 'Nenhum texto cadastrado.'}</article>
      </div>

      {item.observacoes_internas && (
        <div className="content-article-reader__notes">
          <span>Observacoes internas</span>
          <p>{item.observacoes_internas}</p>
        </div>
      )}

      <div className="content-article-reader__comments">
        <span>Retornos do cliente</span>
        {item.comentarios?.length ? item.comentarios.map((comment) => (
          <article key={comment.id}>
            <div>
              <MessageCircle size={16} aria-hidden="true" />
              <strong>{comment.autor_nome || 'Cliente'}</strong>
              <small>{formatDateTime(comment.criado_em)} - {getInteractionLabel(comment.tipo_interacao)}</small>
            </div>
            <p>{comment.mensagem}</p>
          </article>
        )) : (
          <p>Nenhum comentario recebido para este item.</p>
        )}
      </div>
    </aside>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`content-status content-status--${status || 'default'}`}>
      {getContentDeliveryStatusLabel(status)}
    </span>
  );
}

function sortItems(items) {
  return [...items].sort((first, second) => {
    const orderDiff = Number(first.ordem || 0) - Number(second.ordem || 0);
    if (orderDiff !== 0) return orderDiff;

    return new Date(first.criado_em || 0) - new Date(second.criado_em || 0);
  });
}

function getArticleStats(items) {
  return items.reduce((stats, item) => {
    stats.total += 1;

    if (item.status === 'aprovado' || item.status === 'publicado') {
      stats.approved += 1;
    } else if (item.status === 'revisar') {
      stats.revision += 1;
    } else {
      stats.pending += 1;
    }

    return stats;
  }, {
    total: 0,
    approved: 0,
    revision: 0,
    pending: 0,
  });
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

function getInteractionLabel(type) {
  const labels = {
    comentario: 'Comentario',
    aprovacao: 'Aprovacao',
    revisao: 'Revisao',
    publicacao: 'Publicacao',
  };

  return labels[type] || 'Comentario';
}
