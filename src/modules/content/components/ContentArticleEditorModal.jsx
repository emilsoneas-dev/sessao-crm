import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'artigo', label: 'Artigo' },
  { value: 'landing_page', label: 'Landing page' },
  { value: 'email', label: 'Email' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'roteiro', label: 'Roteiro' },
  { value: 'outro', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_revisao', label: 'Em revisao' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'revisar', label: 'Revisar' },
  { value: 'publicado', label: 'Publicado' },
];

export function ContentArticleEditorModal({
  open,
  item,
  nextOrder = 1,
  saving = false,
  onClose,
  onSave,
}) {
  const isEditing = Boolean(item?.id);
  const [draft, setDraft] = useState(() => buildInitialDraft(item, nextOrder));

  useEffect(() => {
    if (!open) return;

    setDraft(buildInitialDraft(item, nextOrder));
  }, [item, nextOrder, open]);

  if (!open) return null;

  const contentStats = getContentStats(draft.conteudo);

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <div className="content-modal-backdrop" role="presentation">
      <section className="content-article-modal" role="dialog" aria-modal="true" aria-labelledby="content-article-title">
        <header className="content-package-modal__header">
          <div>
            <span className="content-kicker">Editor do pacote</span>
            <h2 id="content-article-title">{isEditing ? 'Editar item' : 'Novo item'}</h2>
            <p>Organize o texto e os dados editoriais que serao enviados ao cliente.</p>
          </div>

          <button type="button" className="content-icon-button" onClick={onClose} aria-label="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="content-package-form content-article-form" onSubmit={handleSubmit}>
          <div className="content-article-editor-layout">
            <div className="content-article-editor-main">
              <label className="content-field">
                <span>Titulo</span>
                <input
                  type="text"
                  value={draft.titulo}
                  onChange={(event) => updateField('titulo', event.target.value)}
                  placeholder="Titulo interno ou titulo final"
                  required
                />
              </label>

              <label className="content-field content-article-editor">
                <span>Texto completo</span>
                <textarea
                  className="content-article-textarea"
                  value={draft.conteudo}
                  onChange={(event) => updateField('conteudo', event.target.value)}
                  placeholder="Cole aqui o artigo, roteiro, email ou texto completo..."
                  rows={22}
                />
              </label>

              <div className="content-article-editor__stats" aria-label="Resumo do texto">
                <span>{contentStats.words} palavras</span>
                <span>{contentStats.characters} caracteres</span>
              </div>

              <div className="content-article-seo-box">
                <label className="content-field">
                  <span>Meta title</span>
                  <input
                    type="text"
                    value={draft.meta_title}
                    onChange={(event) => updateField('meta_title', event.target.value)}
                    placeholder="Titulo SEO sugerido"
                  />
                </label>

                <label className="content-field">
                  <span>Meta description</span>
                  <textarea
                    value={draft.meta_description}
                    onChange={(event) => updateField('meta_description', event.target.value)}
                    placeholder="Descricao SEO sugerida"
                    rows={3}
                  />
                </label>
              </div>
            </div>

            <aside className="content-article-editor-side" aria-label="Dados editoriais">
              <div className="content-editor-side-section">
                <span className="content-kicker">Dados do item</span>

                <label className="content-field">
                  <span>Tipo</span>
                  <select value={draft.tipo} onChange={(event) => updateField('tipo', event.target.value)}>
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="content-field">
                  <span>Status</span>
                  <select value={draft.status} onChange={(event) => updateField('status', event.target.value)}>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="content-field">
                  <span>Ordem</span>
                  <input
                    type="number"
                    min="1"
                    value={draft.ordem}
                    onChange={(event) => updateField('ordem', event.target.value)}
                  />
                </label>
              </div>

              <div className="content-editor-side-section">
                <span className="content-kicker">SEO e orientacoes</span>

                <label className="content-field">
                  <span>Palavra-chave principal</span>
                  <input
                    type="text"
                    value={draft.palavra_chave_principal}
                    onChange={(event) => updateField('palavra_chave_principal', event.target.value)}
                    placeholder="Ex: trafego organico para clinicas"
                  />
                </label>

                <label className="content-field">
                  <span>Observacoes internas</span>
                  <textarea
                    value={draft.observacoes_internas}
                    onChange={(event) => updateField('observacoes_internas', event.target.value)}
                    placeholder="Notas internas para a equipe..."
                    rows={8}
                  />
                </label>
              </div>
            </aside>
          </div>

          <footer className="content-package-modal__footer">
            <div className="content-package-modal__actions">
              <button type="button" className="content-back-button" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="content-primary-button" disabled={saving}>
                <Save size={16} aria-hidden="true" />
                {saving ? 'Salvando...' : isEditing ? 'Salvar item' : 'Criar item'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

function getContentStats(value = '') {
  const cleanValue = value.trim();
  const words = cleanValue ? cleanValue.split(/\s+/).length : 0;

  return {
    words,
    characters: cleanValue.length,
  };
}

function buildInitialDraft(item, nextOrder) {
  return {
    titulo: item?.titulo || '',
    tipo: item?.tipo || 'artigo',
    palavra_chave_principal: item?.palavra_chave_principal || '',
    meta_title: item?.meta_title || '',
    meta_description: item?.meta_description || '',
    conteudo: item?.conteudo || '',
    ordem: item?.ordem || nextOrder || 1,
    status: item?.status || 'rascunho',
    observacoes_internas: item?.observacoes_internas || '',
  };
}
