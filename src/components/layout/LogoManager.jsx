import { useEffect, useRef, useState } from 'react';
import defaultLogo from '../../assets/img/logo-panorama.webp';

const LOGO_STORAGE_KEY = 'crm_panorama_logo';

export function LogoManager({ collapsed = false }) {
  const inputRef = useRef(null);
  const [logo, setLogo] = useState(defaultLogo);

  useEffect(() => {
    const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);

    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  function handleAskToChangeLogo() {
    const shouldChange = window.confirm('Deseja alterar a logo do CRM?');

    if (shouldChange) {
      inputRef.current?.click();
    }
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageUrl = reader.result;
      localStorage.setItem(LOGO_STORAGE_KEY, imageUrl);
      setLogo(imageUrl);
    };

    reader.readAsDataURL(file);
  }

  if (collapsed) {
    return null;
  }

  return (
    <div className="logo-manager">
      <button
        className="logo-manager__button"
        type="button"
        onClick={handleAskToChangeLogo}
        title="Clique para alterar a logo"
        aria-label="Alterar logo do CRM"
      >
        <img src={logo} alt="Logo do CRM" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleLogoChange}
        hidden
      />
    </div>
  );
}