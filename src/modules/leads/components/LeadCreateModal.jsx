import { Save, X } from 'lucide-react';
import '../styles/lead-create.css';

const STAGE_OPTIONS = [
  { value: 'entrou', label: 'Entrou' },
  { value: 'qualificacao', label: 'Qualificacao' },
  { value: 'diagnostico', label: 'Diagnostico' },
  { value: 'proposta_enviada', label: 'Proposta enviada' },
  { value: 'negociacao', label: 'Negociacao' },
  { value: 'conclusao', label: 'Conclusao' },
];

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'baixa', label: 'Baixa' },
];

export function LeadCreateModal({ form, saving, feedback, onChange, onClose, onSave }) {
  return (
    <div className="lead-create-backdrop" onClick={onClose}>
      <aside className="lead-create-modal" onClick={(event) => event.stopPropagation()}>
        <header className="lead-create-modal__header">
          <div>
            <p>Novo lead</p>
            <h2>Adicionar oportunidade</h2>
          </div>

          <button type="button" className="lead-create-modal__close" onClick={onClose} disabled={saving}>
            <X size={18} />
          </button>
        </header>

        <div className="lead-create-modal__body">
          <section className="lead-create-section">
            <div className="lead-create-section__title">
              <h3>Contato</h3>
              <span>Nome, empresa e canais de contato</span>
            </div>

            <div className="lead-create-grid">
              <LeadField label="Nome" value={form.nome} onChange={(value) => onChange('nome', value)} placeholder="Nome do contato" />
              <LeadField label="Empresa" value={form.empresa} onChange={(value) => onChange('empresa', value)} placeholder="Empresa ou marca" />
              <LeadField label="E-mail" type="email" value={form.email} onChange={(value) => onChange('email', value)} placeholder="email@empresa.com" />
              <LeadField label="Telefone" value={form.telefone} onChange={(value) => onChange('telefone', value)} placeholder="WhatsApp ou telefone" />
            </div>
          </section>

          <section className="lead-create-section">
            <div className="lead-create-section__title">
              <h3>Oportunidade</h3>
              <span>Origem, interesse e etapa inicial</span>
            </div>

            <div className="lead-create-grid">
              <LeadField label="Servico de interesse" value={form.servico_interesse} onChange={(value) => onChange('servico_interesse', value)} placeholder="Ex: Site, trafego, SEO" />
              <LeadField label="Origem" value={form.origem} onChange={(value) => onChange('origem', value)} placeholder="Ex: indicacao, WhatsApp, Instagram" />

              <label className="lead-create-field">
                <span>Etapa</span>
                <select value={form.etapa} onChange={(event) => onChange('etapa', event.target.value)}>
                  {STAGE_OPTIONS.map((stage) => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
              </label>

              <label className="lead-create-field">
                <span>Prioridade</span>
                <select value={form.prioridade} onChange={(event) => onChange('prioridade', event.target.value)}>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </label>

              <label className="lead-create-field lead-create-field--full">
                <span>Mensagem</span>
                <textarea value={form.mensagem} onChange={(event) => onChange('mensagem', event.target.value)} placeholder="Resumo do que o lead pediu" />
              </label>

              <label className="lead-create-field lead-create-field--full">
                <span>Observacoes internas</span>
                <textarea value={form.observacoes} onChange={(event) => onChange('observacoes', event.target.value)} placeholder="Proximo passo, contexto ou combinado" />
              </label>
            </div>
          </section>
        </div>

        {feedback && <div className="lead-create-feedback">{feedback}</div>}

        <footer className="lead-create-modal__footer">
          <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>

          <button type="button" className="primary-button" onClick={onSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar lead'}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function LeadField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="lead-create-field">
      <span>{label}</span>
      <input type={type} value={value || ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
