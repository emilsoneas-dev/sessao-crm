export function formatDateTime(value) {
  if (!value) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatRelativeLeadDate(value) {
  if (!value) return 'Sem data';

  const date = new Date(value);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / 1000 / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInMinutes < 1) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
  if (diffInHours < 24) return `${diffInHours}h atrás`;

  return formatDateTime(value);
}
