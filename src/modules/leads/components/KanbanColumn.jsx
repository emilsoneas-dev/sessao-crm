import { useDraggable, useDroppable } from '@dnd-kit/core';
import { LeadCard } from './LeadCard.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';

export function KanbanColumn({
  stage,
  leads,
  onOpenLead,
  onMoveLead,
  onConvertLead,
  onArchiveLead,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column kanban-column--${stage.color} ${isOver ? 'is-over' : ''}`}
    >
      <header className="kanban-column__header">
        <div>
          <span className="kanban-column__marker" />
          <h2>{stage.title}</h2>
          <p>{stage.description}</p>
        </div>

        <strong>{leads.length}</strong>
      </header>

      <div className="kanban-column__body">
        {leads.length === 0 ? (
          <EmptyState
            title="Sem leads"
            description="Nenhuma oportunidade nesta etapa."
          />
        ) : (
          leads.map((lead) => (
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              onOpenLead={onOpenLead}
              onMoveLead={onMoveLead}
              onConvertLead={onConvertLead}
              onArchiveLead={onArchiveLead}
            />
          ))
        )}
      </div>
    </section>
  );
}

function DraggableLeadCard({
  lead,
  onOpenLead,
  onMoveLead,
  onConvertLead,
  onArchiveLead,
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`draggable-lead-card ${isDragging ? 'is-dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <LeadCard
        lead={lead}
        onOpen={onOpenLead}
        onMoveLead={onMoveLead}
        onConvertLead={onConvertLead}
        onArchiveLead={onArchiveLead}
        isDragging={isDragging}
      />
    </div>
  );
}
