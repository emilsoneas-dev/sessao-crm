import { useEffect, useState } from 'react';
import { Edit3, Save, Search, Target, Users } from 'lucide-react';
import { formatMonthReferenceLabel } from '../services/contentService.js';

const EMPTY_STRATEGY = {
  objetivo_estrategia: '',
  publico_alvo: '',
  tom_comunicacao: '',
  palavras_chave: '',
  servicos_priorizados: '',
  objetivos_seo: '',
  observacoes: '',
  observacoes_cliente: '',
};

export function EditorialStrategyPanel({
  client,
  delivery,
  saving = false,
  onSave,
  onManageContents,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => buildStrategyDraft(delivery));

  useEffect(() => {
    setDraft(buildStrategyDraft(delivery));
    setEditing(false);
  }, [delivery?.id]);

  if (!delivery) return null;

  const clientName = client?.nome || client?.empresa || 'Cliente sem nome';
  const hasStrategy = hasAnyStrategyValue(delivery);
  const completedFields = countStrategyValues(delivery);

  async function handleSubmit(event) {
    event.preventDefault();

    const saved = await onSave(draft);

    if (saved !== false) {
      setEditing(false);
    }
  }

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <article className="content-strategy-panel">
      <header className="content-strategy-panel__header">
        <div>
          <span className="content-kicker">Estrategia Editorial</span>
          <h2>Direcao da entrega</h2>
          <p>Objetivo, publico, tom e SEO reunidos para orientar a producao.</p>
        </div>

        <button
          type="button"
          className="content-action-button"
          onClick={() => setEditing((current) => !current)}
        >
          <Edit3 size={16} aria-hidden="true" />
          {editing ? 'Cancelar edicao' : 'Editar estrategia'}
        </button>
      </header>

      <div className="content-strategy-meta" aria-label="Resumo da entrega">
        <InfoTile label="Cliente" value={clientName} />
        <InfoTile label="Entrega" value={delivery.titulo || 'Entrega sem titulo'} />
        <InfoTile label="Periodo" value={formatMonthReferenceLabel(delivery.mes_referencia)} />
        <InfoTile label="Status" value={formatStatus(delivery.status)} />
      </div>

      {editing || !hasStrategy ? (
        <form className="content-strategy-form" onSubmit={handleSubmit}>
          <StrategyFormSection
            title="Direcao editorial"
            description="O norte da entrega antes da escrita."
          >
            <StrategyTextarea
              label="Objetivo da estrategia"
              value={draft.objetivo_estrategia}
              onChange={(value) => updateField('objetivo_estrategia', value)}
              placeholder="Qual e o objetivo editorial desta entrega?"
            />
          </StrategyFormSection>

          <StrategyFormSection
            title="Publico e linguagem"
            description="Para quem falamos e como a marca deve soar."
          >
            <StrategyTextarea
              label="Publico-alvo"
              value={draft.publico_alvo}
              onChange={(value) => updateField('publico_alvo', value)}
              placeholder="Para quem os conteudos serao escritos?"
            />
            <StrategyTextarea
              label="Tom de comunicacao"
              value={draft.tom_comunicacao}
              onChange={(value) => updateField('tom_comunicacao', value)}
              placeholder="Ex: tecnico, acolhedor, educativo, direto..."
            />
          </StrategyFormSection>

          <StrategyFormSection
            title="SEO e prioridades comerciais"
            description="Temas, palavras e servicos que merecem destaque."
          >
            <StrategyTextarea
              label="Principais palavras-chave"
              value={draft.palavras_chave}
              onChange={(value) => updateField('palavras_chave', value)}
              placeholder="Liste palavras-chave e temas prioritarios."
            />
            <StrategyTextarea
              label="Servicos ou produtos priorizados"
              value={draft.servicos_priorizados}
              onChange={(value) => updateField('servicos_priorizados', value)}
              placeholder="Quais servicos, produtos ou procedimentos devem ganhar destaque?"
            />
            <StrategyTextarea
              label="Objetivos de SEO"
              value={draft.objetivos_seo}
              onChange={(value) => updateField('objetivos_seo', value)}
              placeholder="Ex: reforcar autoridade, capturar buscas locais, ranquear servicos..."
            />
          </StrategyFormSection>

          <StrategyFormSection
            title="Observacoes"
            description="Notas de contexto para equipe e cliente."
          >
            <StrategyTextarea
              label="Observacoes da equipe"
              value={draft.observacoes}
              onChange={(value) => updateField('observacoes', value)}
              placeholder="Notas internas para orientar a producao."
            />
            <StrategyTextarea
              label="Observacoes do cliente"
              value={draft.observacoes_cliente}
              onChange={(value) => updateField('observacoes_cliente', value)}
              placeholder="Campo preparado para sugestoes futuras do cliente."
            />
          </StrategyFormSection>

          <footer className="content-strategy-form__footer">
            <button type="submit" className="content-primary-button" disabled={saving}>
              <Save size={16} aria-hidden="true" />
              {saving ? 'Salvando...' : 'Salvar estrategia'}
            </button>
          </footer>
        </form>
      ) : (
        <>
          <section className="content-strategy-executive" aria-label="Leitura executiva da estrategia">
            <div>
              <span className="content-kicker">Leitura executiva</span>
              <h3>{delivery.objetivo_estrategia || 'Estrategia cadastrada'}</h3>
              <p>{delivery.tom_comunicacao || 'Tom de comunicacao nao informado.'}</p>
            </div>

            <div className="content-strategy-executive__score">
              <strong>{completedFields}/8</strong>
              <span>campos preenchidos</span>
            </div>
          </section>

          <section className="content-strategy-insights" aria-label="Pilares da estrategia">
            <StrategyInsightCard icon={Target} title="Objetivo" value={delivery.objetivo_estrategia} />
            <StrategyInsightCard icon={Users} title="Publico e tom" value={[delivery.publico_alvo, delivery.tom_comunicacao].filter(Boolean).join(' | ')} />
            <StrategyInsightCard icon={Search} title="SEO e prioridade" value={[delivery.palavras_chave, delivery.objetivos_seo].filter(Boolean).join(' | ')} />
          </section>

          <section className="content-strategy-summary" aria-label="Resumo da estrategia">
            <StrategySummaryItem title="Publico-alvo" value={delivery.publico_alvo} />
            <StrategySummaryItem title="Tom de comunicacao" value={delivery.tom_comunicacao} />
            <StrategySummaryItem title="Principais palavras-chave" value={delivery.palavras_chave} />
            <StrategySummaryItem title="Servicos ou produtos priorizados" value={delivery.servicos_priorizados} />
            <StrategySummaryItem title="Objetivos de SEO" value={delivery.objetivos_seo} />
            <StrategySummaryItem title="Observacoes da equipe" value={delivery.observacoes} />
            <StrategySummaryItem title="Observacoes do cliente" value={delivery.observacoes_cliente} />
          </section>

          <div className="content-strategy-next-step">
            <button type="button" className="content-primary-button" onClick={onManageContents}>
              Gerenciar itens
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function StrategyFormSection({ title, description, children }) {
  return (
    <section className="content-strategy-form-section">
      <header>
        <strong>{title}</strong>
        <span>{description}</span>
      </header>
      <div>{children}</div>
    </section>
  );
}

function StrategyTextarea({ label, value, onChange, placeholder }) {
  return (
    <label className="content-field content-field--wide">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
      />
    </label>
  );
}

function StrategyInsightCard({ icon: Icon, title, value }) {
  return (
    <div className="content-strategy-insight">
      <Icon size={18} aria-hidden="true" />
      <span>{title}</span>
      <p>{value || 'Nao informado.'}</p>
    </div>
  );
}

function StrategySummaryItem({ title, value, featured = false }) {
  return (
    <div className={featured ? 'content-strategy-summary__item content-strategy-summary__item--featured' : 'content-strategy-summary__item'}>
      <span>{title}</span>
      <p>{value || 'Nao informado.'}</p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="content-info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildStrategyDraft(delivery) {
  return Object.keys(EMPTY_STRATEGY).reduce((draft, key) => {
    draft[key] = delivery?.[key] || '';
    return draft;
  }, {});
}

function hasAnyStrategyValue(delivery) {
  return Object.keys(EMPTY_STRATEGY).some((key) => String(delivery?.[key] || '').trim());
}

function countStrategyValues(delivery) {
  return Object.keys(EMPTY_STRATEGY).filter((key) => String(delivery?.[key] || '').trim()).length;
}

function formatStatus(status) {
  const labels = {
    rascunho: 'Rascunho',
    em_revisao: 'Em revisao',
    aprovado: 'Aprovado',
    revisar: 'Revisar',
    publicado: 'Publicado',
  };

  return labels[status] || 'Nao informado';
}
