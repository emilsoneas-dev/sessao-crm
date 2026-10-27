import { useState } from 'react';
import {
  Archive,
  Building2,
  CheckCircle2,
  ChevronDown,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { KANBAN_STAGES } from '../../../config/kanbanStages.js';
import { formatRelativeLeadDate } from '../../../utils/date.js';
import { getLeadInitials, getWhatsAppLink } from '../utils/leadHelpers.js';

export function LeadCard({
  lead,
  onOpen,
  onMoveLead,
  onConvertLead,
  onArchiveLead,
  isOverlay = false,
}) {
  const [stageMenuOpen, setStageMenuOpen] = useState(false);

  const telefoneLead = lead.whatsapp || lead.telefone || '';
  const interesseLead = lead.servico_interesse || lead.interesse || 'Interesse nao informado';
  const origemLead = lead.empresa || lead.cidade || lead.origem || 'Origem site';
  const etapaAtual = lead.etapa || 'entrou';
  const podeFinalizar = etapaAtual === 'conclusao' && lead.status !== 'cliente' && lead.status !== 'arquivado';

  const whatsappLink = getWhatsAppLink(telefoneLead);

  function handleToggleStageMenu(event) {
    event.stopPropagation();
    setStageMenuOpen((current) => !current);
  }

  function handleMoveStage(event) {
    event.stopPropagation();

    const novaEtapa = event.target.value;

    if (!onMoveLead || !lead.id || novaEtapa === etapaAtual) return;

    onMoveLead(lead.id, novaEtapa);
    setStageMenuOpen(false);
  }

  function handleConvertToClient(event) {
    event.stopPropagation();

    if (!onConvertLead || !lead.id) return;

    const shouldConvert = window.confirm('Converter este lead em cliente?');

    if (shouldConvert) {
      onConvertLead(lead.id);
    }
  }

  function handleArchiveLead(event) {
    event.stopPropagation();

    if (!onArchiveLead || !lead.id) return;

    const shouldArchive = window.confirm('Arquivar este lead para contato futuro?');

    if (shouldArchive) {
      onArchiveLead(lead.id);
    }
  }

  return (
    <article className="lead-card" onClick={() => onOpen(lead)}>
      <div className="lead-card__topline">
        <span className={`lead-priority lead-priority--${lead.prioridade || 'normal'}`}>
          {lead.status || 'novo'}
        </span>

        {!isOverlay && onMoveLead && (
          <button
            className={`lead-card__stage-toggle ${stageMenuOpen ? 'is-open' : ''}`}
            type="button"
            onClick={handleToggleStageMenu}
            onPointerDown={(event) => event.stopPropagation()}
            title="Mover lead"
            aria-label="Mover lead"
          >
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      <div className="lead-card__person">
        <div className="lead-card__avatar">{getLeadInitials(lead.nome)}</div>

        <div>
          <h3>{lead.nome || 'Lead sem nome'}</h3>
          <p>{interesseLead}</p>
        </div>
      </div>

      <div className="lead-card__info">
        <span>
          <Building2 size={14} />
          {origemLead}
        </span>

        <span>
          <Phone size={14} />
          {telefoneLead || 'Sem WhatsApp'}
        </span>

        <span>
          <Mail size={14} />
          {lead.email || 'Sem e-mail'}
        </span>
      </div>

      {!isOverlay && onMoveLead && stageMenuOpen && (
        <div
          className="lead-card__stage-menu"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <label htmlFor={`lead-stage-${lead.id}`}>Mover para</label>

          <select
            id={`lead-stage-${lead.id}`}
            value={etapaAtual}
            onChange={handleMoveStage}
          >
            {KANBAN_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isOverlay && podeFinalizar && (
        <div
          className="lead-card__final-actions"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="lead-card__final-action lead-card__final-action--client"
            onClick={handleConvertToClient}
          >
            <CheckCircle2 size={14} />
            Cliente
          </button>

          <button
            type="button"
            className="lead-card__final-action lead-card__final-action--archive"
            onClick={handleArchiveLead}
          >
            <Archive size={14} />
            Arquivar
          </button>
        </div>
      )}

      <div className="lead-card__footer">
        <span className="lead-card__date">{formatRelativeLeadDate(lead.data_entrada)}</span>

        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>
        ) : (
          <button type="button" disabled>
            Sem WhatsApp
          </button>
        )}
      </div>
    </article>
  );
}
