export function Toast({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="toast">
      <strong>Novo lead recebido</strong>
      <span>{message}</span>
    </div>
  );
}
