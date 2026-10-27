import { useEffect, useState } from 'react';
import { ExternalLink, MessageCircle, Save, X } from 'lucide-react';
import { formatDateTime } from '../../../utils/date.js';
import { getWhatsAppLink } from '../utils/leadHelpers.js';
import { updateLeadDetails } from '../services/leadsService.js';

export function LeadDetailsModal({ lead, onClose }) {
  const [observacoes, setObservacoes] = useState('');
  const [documentoUrl, setDocumentoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!lead) return;

    setObservacoes(lead.observacoes || lead.observacao || '');
    setDocumentoUrl(lead.documento_url || '');
    setFeedback('');
  }, [lead]);

  if (!lead) return null;

  const telefoneLead = lead.whatsapp || lead.telefone || '';
  const interesseLead = lead.servico_interesse || lead.interesse || '';
  const origemLead = lead.empresa || lead.cidade || lead.origem || 'site';

  const whatsappLink = getWhatsAppLink(telefoneLead);
  const safeDocumentoUrl = getSafeUrl(documentoUrl);

  async function handleSaveDetails() {
    if (!lead?.id) return;

    try {
      setSaving(true);
      setFeedback('');

      await updateLeadDetails(lead.id, {
        observacoes,
        documento_url: documentoUrl,
      });

      setFeedback('Registro salvo com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar registro do lead:', error);
      setFeedback('Nao foi possivel salvar agora.');
    } finally {
      setSaving(false);

      window.setTimeout(() => {
        setFeedback('');
      }, 3500);
    }
  }

  return (
    <div className="lead-center-backdrop" onClick={onClose}>
      <aside className="lead-center-modal" onClick={(event) => event.stopPropagation()}>
        <header className="lead-center-modal__header">
          <div className="lead-center-modal__identity">
            <div className="lead-center-modal__avatar">
              {getInitials(lead.nome)}
            </div>

            <div>
              <p>Detalhes do lead</p>
              <h2>{lead.nome || 'Lead sem nome'}</h2>
              <span>
                {interesseLead || origemLead || 'Dados comerciais do lead'}
              </span>
            </div>
          </div>

          <button className="lead-center-modal__close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="lead-center-modal__body">
          <section className="lead-center-section">
            <div className="lead-center-section__title">
              <h3>Informacoes do lead</h3>
              <span>Dados recebidos pelo formulario</span>
            </div>

            <div className="lead-center-grid">
              <Info label="WhatsApp" value={telefoneLead} />
              <Info label="E-mail" value={lead.email} />
              <Info label="Cidade" value={lead.cidade} />
              <Info label="Origem" value={origemLead} />
              <Info label="Servico de interesse" value={interesseLead} />
              <Info label="Perfil" value={lead.perfil} />
              <Info label="Area" value={lead.area} />
              <Info label="Canal atual" value={lead.canal} />
              <Info label="Dificuldade" value={lead.dificuldade} />
              <Info label="Investimento" value={lead.investimento} />
              <Info label="Etapa" value={lead.etapa || 'entrou'} />
              <Info label="Status" value={lead.status || 'novo'} />
              <Info label="Tipo de envio" value={lead.tipo_envio} />
              <Info label="Entrada" value={formatDateTime(lead.data_entrada)} />
            </div>
          </section>

          <section className="lead-center-section lead-record">
            <div className="lead-center-section__title">
              <h3>Registro do lead</h3>
              <span>Anotacoes, proximos passos e link de apoio</span>
            </div>

            <div className="lead-record__field">
              <label htmlFor={`lead-observacoes-${lead.id}`}>
                Observacao comercial
              </label>

              <textarea
                id={`lead-observacoes-${lead.id}`}
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder="Exemplo: pediu retorno mes que vem, achou o investimento alto, precisa falar com socio, perfil bom para SEO local..."
                rows={5}
              />
            </div>

            <div className="lead-record__field">
              <label htmlFor={`lead-documento-${lead.id}`}>
                Link de apoio
              </label>

              <input
                id={`lead-documento-${lead.id}`}
                type="url"
                value={documentoUrl}
                onChange={(event) => setDocumentoUrl(event.target.value)}
                placeholder="Cole aqui o link do Google Docs, Drive, proposta, briefing ou analise"
              />
            </div>

            <div className="lead-record__actions">
              <button
                className="secondary-button lead-record__save"
                type="button"
                onClick={handleSaveDetails}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar registro'}
              </button>

              {safeDocumentoUrl && (
                <a
                  className="lead-record__link"
                  href={safeDocumentoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={15} />
                  Abrir link de apoio
                </a>
              )}
            </div>

            {feedback && <span className="lead-record__feedback">{feedback}</span>}
          </section>
        </div>

        <footer className="lead-center-modal__footer">
          {whatsappLink && (
            <a className="primary-button" href={whatsappLink} target="_blank" rel="noreferrer">
              <MessageCircle size={16} />
              Chamar no WhatsApp
            </a>
          )}

          <button className="secondary-button" type="button" onClick={onClose}>
            Fechar
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="lead-center-info-item">
      <span>{label}</span>
      <strong>{value || 'Nao informado'}</strong>
    </div>
  );
}

function getSafeUrl(url) {
  if (!url) return '';

  const trimmedUrl = String(url).trim();

  if (!trimmedUrl) return '';

  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function getInitials(value) {
  if (!value) return 'L';

  return String(value)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
