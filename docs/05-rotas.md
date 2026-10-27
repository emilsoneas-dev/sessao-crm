# Rotas e navegacao

## Rotas identificadas

- `/set-password`: criacao de senha apos convite.
- `/visao-geral`: Visao Geral.
- `/leads`: Leads.
- `/clientes`: Clientes.
- `/financeiro`: Direcao > Financeiro.
- `/recursos-humanos`: Direcao > Recursos Humanos.
- `/tarefas`: Operacional.
- `/documentos`: Documentos.
- `/configuracoes`: Configuracoes.

## Controle de rota

O projeto nao usa `react-router-dom`.

O controle atual fica em:

- `src/app/App.jsx`
- `src/modules/leads/pages/CRMLeadsPage.jsx`

## Funcionamento

- `App.jsx` verifica se o path e `/set-password`.
- Depois do login, `CRMLeadsPage` decide qual pagina renderizar.
- A funcao `getPageFromPath()` interpreta `window.location.pathname`.
- A funcao `handleNavigate()` chama `window.history.pushState`.
- O evento `popstate` atualiza a pagina ativa ao usar voltar/avancar.

## Paginas renderizadas pela shell

- `CRMOverviewPage`
- `CRMClientsPage`
- `CRMFinancePage`
- `CRMHumanResourcesPage`
- `CRMTasksPage`
- `CRMDocumentsPage`
- `CRMSettingsPage`
- Conteudo interno de Leads

## Observacoes

- A rota `/financeiro` representa o subitem Financeiro dentro do grupo Direcao.
- A rota `/recursos-humanos` representa o subitem Recursos Humanos dentro do grupo Direcao.
- A rota `/tarefas` aparece no menu como Operacional.
