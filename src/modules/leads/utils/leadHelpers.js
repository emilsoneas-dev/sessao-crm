export function normalizeLeadStage(stage) {
  return stage || 'entrou';
}

export function getWhatsAppLink(phone) {
  if (!phone) return null;

  const onlyNumbers = String(phone).replace(/\D/g, '');

  if (!onlyNumbers) return null;

  const phoneWithCountry = onlyNumbers.startsWith('55')
    ? onlyNumbers
    : `55${onlyNumbers}`;

  return `https://wa.me/${phoneWithCountry}`;
}

export function getLeadInitials(name) {
  if (!name) return '?';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
