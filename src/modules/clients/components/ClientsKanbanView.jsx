import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import { FileText, GripVertical, UserRound } from 'lucide-react';
import { getLeadInitials } from '../../leads/utils/leadHelpers.js';
import '../styles/client-kanban.css';

const KANBAN_COLUMNS = [
  {
    value: 'ativo',
    label: 'Ativos',
    description: 'Clientes em operacao',
  },
  {
    value: 'implantacao',
    label: 'Implantacao',
    description: 'Entrando na rotina',
  },
  {
    value: 'pausado',
    label: 'Pausados',
    description: 'Aguardando retomada',
  },
  {
    value: 'encerrado',
    label: 'Encerrados',
    description: 'Historico fechado',
  },
];

export function ClientsKanbanView({ clients = [], movingClientId, onOpenClientCard, onMoveClientStatus }) {
  const [activeClient, setActiveClient] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const columns = KANBAN_COLUMNS.map((column) => ({
    ...column,
    clients: clients.filter((client) => normalizeClientStatus(client.status_cliente) === column.value),
  }));

  function handleDragStart(event) {
    const draggedClient = clients.find((client) => String(client.id) === String(event.active?.id));
    setActiveClient(draggedClient || null);
  }

  function handleDragEnd(event) {
    const clientId = event.active?.id;
    const nextStatus = event.over?.id;
    setActiveClient(null);

    if (!clientId || !nextStatus) return;

    const draggedClient = clients.find((client) => String(client.id) === String(clientId));
    if (!draggedClient) return;

    onMoveClientStatus(draggedClient, nextStatus);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveClient(null)}>
      <div className="clients-kanban" aria-label="Kanban de clientes">
        {columns.map((column) => (
          <ClientsKanbanColumn
            key={column.value}
            column={column}
            movingClientId={movingClientId}
            onOpenClientCard={onOpenClientCard}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeClient ? <ClientsKanbanCardPreview client={activeClient} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function ClientsKanbanColumn({ column, movingClientId, onOpenClientCard }) {
  const { isOver, setNodeRef } = useDroppable({ id: column.value });

  return (
    <section ref={setNodeRef} className={`clients-kanban-column ${isOver ? 'is-over' : ''}`}>
      <div className="clients-kanban-column__header">
        <div>
          <h4>{column.label}</h4>
          <span>{column.description}</span>
        </div>
        <strong>{column.clients.length}</strong>
      </div>

      <div className="clients-kanban-column__list">
        {column.clients.length === 0 ? (
          <div className="clients-kanban-empty">Sem clientes aqui.</div>
        ) : (
          column.clients.map((client) => (
            <ClientsKanbanCard
              key={client.id}
              client={client}
              moving={String(movingClientId) === String(client.id)}
              onOpenClientCard={onOpenClientCard}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ClientsKanbanCard({ client, moving, onOpenClientCard }) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: String(client.id),
  });

  const style = !isDragging && transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const service = client.servico_contratado || client.plano_contratado || client.servico_interesse || client.interesse || 'Servico nao informado';

  return (
    <article
      ref={setNodeRef}
      className={`clients-kanban-card ${isDragging ? 'is-dragging' : ''} ${moving ? 'is-moving' : ''}`}
      style={style}
    >
      <button className="clients-kanban-card__drag" type="button" title="Mover cliente" {...listeners} {...attributes}>
        <GripVertical size={16} />
      </button>

      <button className="clients-kanban-card__content" type="button" onClick={() => onOpenClientCard(client)}>
        <div className="clients-kanban-card__topline">
          <span className="clients-kanban-card__avatar">{getLeadInitials(client.nome)}</span>
          <div>
            <h5>{client.nome || 'Cliente sem nome'}</h5>
            <p>{client.empresa || client.cidade || 'Origem nao informada'}</p>
          </div>
        </div>

        <div className="clients-kanban-card__service">{service}</div>

        <ClientsKanbanCardIndicators client={client} />
      </button>
    </article>
  );
}

function ClientsKanbanCardPreview({ client }) {
  const service = client.servico_contratado || client.plano_contratado || client.servico_interesse || client.interesse || 'Servico nao informado';

  return (
    <article className="clients-kanban-card clients-kanban-card--overlay">
      <div className="clients-kanban-card__content">
        <div className="clients-kanban-card__topline">
          <span className="clients-kanban-card__avatar">{getLeadInitials(client.nome)}</span>
          <div>
            <h5>{client.nome || 'Cliente sem nome'}</h5>
            <p>{client.empresa || client.cidade || 'Origem nao informada'}</p>
          </div>
        </div>

        <div className="clients-kanban-card__service">{service}</div>

        <ClientsKanbanCardIndicators client={client} />
      </div>
    </article>
  );
}

function ClientsKanbanCardIndicators({ client }) {
  const recurring = isRecurringClient(client);
  const articles = Number(client.artigos_mensais || 0);
  const articleValue = getMoneyNumber(client.valor_por_artigo);
  const responsible = client.responsavel_padrao || client.responsavel_cliente || client.responsavel || 'Sem responsavel';

  return (
    <div className="clients-kanban-card__indicators">
      <span className={`clients-kanban-model ${recurring ? 'is-recurring' : 'is-single'}`}>
        {recurring ? 'Recorrente' : 'Avulso'}
      </span>
      <span className={recurring && !articles ? 'is-warning' : ''}>
        <FileText size={13} />{articles || 0} artigo(s)/mes
      </span>
      <span className={recurring && !articleValue ? 'is-warning' : ''}>
        {articleValue ? `${formatCurrency(articleValue)} por artigo` : 'Valor nao informado'}
      </span>
      <p className={responsible === 'Sem responsavel' ? 'is-warning' : ''}>
        <UserRound size={13} />{responsible}
      </p>
    </div>
  );
}

function normalizeClientStatus(status) {
  const normalizedStatus = String(status || 'ativo').toLowerCase();
  const columnExists = KANBAN_COLUMNS.some((column) => column.value === normalizedStatus);

  return columnExists ? normalizedStatus : 'ativo';
}

function getMoneyNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;

  const normalized = String(value)
    .replace(/\s/g, '')
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.');

  const number = Number(normalized);
  return Number.isNaN(number) ? 0 : number;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function isRecurringClient(client) {
  return client.recorrente === true || Number(client.artigos_mensais || 0) > 0;
}
