import { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import { formatMonthReferenceLabel, getCurrentMonthReference } from '../services/contentService.js';

const MONTH_OPTIONS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Marco' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_revisao', label: 'Em revisao' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'revisar', label: 'Revisar' },
  { value: 'publicado', label: 'Publicado' },
];

export function ContentPackageModal({
  client,
  delivery,
  open,
  saving = false,
  onClose,
  onSave,
  onDelete,
}) {
  const isEditing = Boolean(delivery?.id);
  const [draft, setDraft] = useState(() => buildInitialDraft(client, delivery));
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (!open) return;

    setDraft(buildInitialDraft(client, delivery));
    setTitleTouched(Boolean(delivery?.id));
  }, [client, delivery, open]);

  const autoTitle = useMemo(() => {
    const monthReference = `${draft.year}-${draft.month}`;
    const clientName = getClientName(client);

    return `${clientName} - Conteudos de ${formatMonthReferenceLabel(monthReference)}`;
  }, [client, draft.month, draft.year]);

  useEffect(() => {
    if (!open || titleTouched) return;

    setDraft((current) => ({
      ...current,
      titulo: autoTitle,
    }));
  }, [autoTitle, open, titleTouched]);

  if (!open) return null;

  function updateField(field, value) {
    if (field === 'titulo') {
      setTitleTouched(true);
    }

    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSave({
      id: delivery?.id,
      cliente_id: client?.id,
      titulo: draft.titulo,
      mes_referencia: `${draft.year}-${draft.month}`,
      responsavel: draft.responsavel,
      quantidade_prevista: draft.quantidade_prevista,
      status: draft.status,
      objetivo_estrategia: draft.objetivo_estrategia,
      observacoes: draft.observacoes,
    });
  }

  return (
    <div className="content-modal-backdrop" role="presentation">
      <section className="content-package-modal" role="dialog" aria-modal="true" aria-labelledby="content-package-title">
        <header className="content-package-modal__header">
          <div>
            <span className="content-kicker">Entrega mensal</span>
            <h2 id="content-package-title">{isEditing ? 'Editar entrega' : 'Nova entrega'}</h2>
            <p>{getClientName(client)}</p>
          </div>

          <button type="button" className="content-icon-button" onClick={onClose} aria-label="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="content-package-form" onSubmit={handleSubmit}>
          <div className="content-form-grid">
            <label className="content-field">
              <span>Mes</span>
              <select value={draft.month} onChange={(event) => updateField('month', event.target.value)}>
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="content-field">
              <span>Ano</span>
              <input
                type="number"
                min="2020"
                max="2100"
                value={draft.year}
                onChange={(event) => updateField('year', event.target.value)}
                required
              />
            </label>

            <label className="content-field content-field--wide">
              <span>Nome da entrega</span>
              <input
                type="text"
                value={draft.titulo}
                onChange={(event) => updateField('titulo', event.target.value)}
                placeholder="Nome interno da entrega"
                required
              />
            </label>

            <label className="content-field">
              <span>Responsavel</span>
              <input
                type="text"
                value={draft.responsavel}
                onChange={(event) => updateField('responsavel', event.target.value)}
                placeholder="Equipe ou responsavel"
              />
            </label>

            <label className="content-field">
              <span>Quantidade prevista</span>
              <input
                type="number"
                min="0"
                value={draft.quantidade_prevista}
                onChange={(event) => updateField('quantidade_prevista', event.target.value)}
              />
            </label>

            <label className="content-field">
              <span>Status</span>
              <select value={draft.status} onChange={(event) => updateField('status', event.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="content-field content-field--wide">
              <span>Objetivo da estrategia</span>
              <textarea
                value={draft.objetivo_estrategia}
                onChange={(event) => updateField('objetivo_estrategia', event.target.value)}
                placeholder="Objetivo editorial, foco do mes ou direcao principal..."
                rows={4}
              />
            </label>

            <label className="content-field content-field--wide">
              <span>Observacoes internas</span>
              <textarea
                value={draft.observacoes}
                onChange={(event) => updateField('observacoes', event.target.value)}
                placeholder="Notas internas da equipe..."
                rows={4}
              />
            </label>
          </div>

          <footer className="content-package-modal__footer">
            {isEditing && (
              <button
                type="button"
                className="content-danger-button"
                onClick={() => onDelete(delivery)}
                disabled={saving}
              >
                <Trash2 size={16} aria-hidden="true" />
                Excluir entrega
              </button>
            )}

            <div className="content-package-modal__actions">
              <button type="button" className="content-back-button" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="content-primary-button" disabled={saving}>
                <Save size={16} aria-hidden="true" />
                {saving ? 'Salvando...' : isEditing ? 'Salvar entrega' : 'Criar entrega'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

function buildInitialDraft(client, delivery) {
  const monthReference = delivery?.mes_referencia || getCurrentMonthReference();
  const [year, month] = String(monthReference).split('-');

  return {
    month: month || getCurrentMonthReference().slice(5, 7),
    year: year || getCurrentMonthReference().slice(0, 4),
    titulo: delivery?.titulo || `${getClientName(client)} - Conteudos de ${formatMonthReferenceLabel(monthReference)}`,
    responsavel: delivery?.responsavel || '',
    quantidade_prevista: delivery?.quantidade_prevista ?? 0,
    status: delivery?.status || 'rascunho',
    objetivo_estrategia: delivery?.objetivo_estrategia || '',
    observacoes: delivery?.observacoes || '',
  };
}

function getClientName(client) {
  return client?.nome || client?.empresa || 'Cliente';
}
