import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { KANBAN_STAGES } from '../../../config/kanbanStages.js';
import { KanbanColumn } from './KanbanColumn.jsx';
import { LeadCard } from './LeadCard.jsx';
import { LeadCreateModal } from './LeadCreateModal.jsx';
import { createLead } from '../services/leadsService.js';

const VALID_STAGES = KANBAN_STAGES.map((stage) => stage.id);

function createBlankLeadForm() {
  return {
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    servico_interesse: '',
    mensagem: '',
    origem: 'cadastro_manual',
    etapa: 'entrou',
    prioridade: 'normal',
    observacoes: '',
    responsavel: '',
  };
}

function getSafeStage(stage) {
  if (!stage) return 'entrou';

  const normalizedStage = String(stage).trim();

  if (!VALID_STAGES.includes(normalizedStage)) {
    return 'entrou';
  }

  return normalizedStage;
}

export function KanbanBoard({
  leads,
  onMoveLead,
  onOpenLead,
  onConvertLead,
  onArchiveLead,
}) {
  const [activeLeadId, setActiveLeadId] = useState(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState(createBlankLeadForm);
  const [savingLead, setSavingLead] = useState(false);
  const [leadFeedback, setLeadFeedback] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activeLead = useMemo(() => {
    if (!activeLeadId) return null;

    return leads.find((lead) => lead.id === activeLeadId) || null;
  }, [activeLeadId, leads]);

  function handleDragStart(event) {
    setActiveLeadId(event.active.id);
  }

  function handleDragCancel() {
    setActiveLeadId(null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    setActiveLeadId(null);

    if (!over) return;

    const leadId = active.id;
    const newStage = over.id;
    const lead = leads.find((item) => item.id === leadId);

    if (!lead) return;

    const currentStage = getSafeStage(lead.etapa);

    if (currentStage === newStage) return;

    onMoveLead(leadId, newStage);
  }

  function handleOpenLeadModal() {
    setLeadForm(createBlankLeadForm());
    setLeadFeedback('');
    setLeadModalOpen(true);
  }

  function handleCloseLeadModal() {
    if (savingLead) return;

    setLeadModalOpen(false);
    setLeadFeedback('');
  }

  function handleChangeLeadForm(field, value) {
    setLeadFeedback('');
    setLeadForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveLead() {
    try {
      setSavingLead(true);
      setLeadFeedback('');

      const createdLead = await createLead(leadForm);

      setLeadModalOpen(false);
      setLeadForm(createBlankLeadForm());
      onOpenLead?.(createdLead);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      setLeadFeedback(error?.message || 'Nao foi possivel salvar o lead.');
    } finally {
      setSavingLead(false);
    }
  }

  return (
    <>
      <div className="kanban-board-actions">
        <button type="button" className="kanban-new-lead-button" onClick={handleOpenLeadModal}>
          <Plus size={16} />
          <span>Novo lead</span>
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {KANBAN_STAGES.map((stage) => {
            const leadsByStage = leads.filter((lead) => getSafeStage(lead.etapa) === stage.id);

            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={leadsByStage}
                onOpenLead={onOpenLead}
                onMoveLead={onMoveLead}
                onConvertLead={onConvertLead}
                onArchiveLead={onArchiveLead}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null} zIndex={999999}>
          {activeLead ? (
            <div className="lead-drag-overlay">
              <LeadCard
                lead={activeLead}
                onOpen={() => {}}
                onMoveLead={onMoveLead}
                onConvertLead={onConvertLead}
                onArchiveLead={onArchiveLead}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {leadModalOpen && (
        <LeadCreateModal
          form={leadForm}
          saving={savingLead}
          feedback={leadFeedback}
          onChange={handleChangeLeadForm}
          onClose={handleCloseLeadModal}
          onSave={handleSaveLead}
        />
      )}
    </>
  );
}
