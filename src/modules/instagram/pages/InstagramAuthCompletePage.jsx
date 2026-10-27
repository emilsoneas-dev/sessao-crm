import { CheckCircle2, XCircle } from 'lucide-react';
import '../styles/instagram.css';

export function InstagramAuthCompletePage() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('instagram_connection');
  const reason = params.get('reason');
  const isSuccess = status === 'success';

  return (
    <main className="instagram-auth-complete">
      <section className={`instagram-auth-complete__card ${isSuccess ? 'is-success' : 'is-error'}`}>
        <div className="instagram-auth-complete__icon">
          {isSuccess ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
        </div>

        <span>Instagram</span>
        <h1>{isSuccess ? 'Conta conectada com sucesso' : 'Nao foi possivel conectar'}</h1>
        <p>
          {isSuccess
            ? 'A autorizacao foi concluida. A equipe da agencia ja pode sincronizar os dados do perfil no CRM.'
            : getInstagramAuthCompleteMessage(reason)}
        </p>

        <small>Voce ja pode fechar esta pagina.</small>
      </section>
    </main>
  );
}

function getInstagramAuthCompleteMessage(reason) {
  const messages = {
    autorizacao_cancelada: 'A autorizacao foi cancelada antes de ser concluida.',
    state_invalido: 'O link de autorizacao expirou ou ja foi usado. Solicite um novo link para a agencia.',
    token_invalido: 'O Instagram nao retornou uma autorizacao valida. Solicite um novo link para tentar novamente.',
    credenciais_ausentes: 'A configuracao da agencia ainda nao esta completa. Avise a equipe responsavel.',
    erro_inesperado: 'Ocorreu um erro inesperado durante a conexao. Solicite um novo link para a agencia.',
  };

  return messages[reason] || 'Solicite um novo link de autorizacao para a agencia e tente novamente.';
}
