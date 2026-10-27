# Componentes reutilizaveis

## Layout

### `Sidebar`

Responsavel pelo menu principal, grupos recolhiveis, controle de pagina ativa e permissoes de acesso.

### `Topbar`

Responsavel pelo titulo da pagina, subtitulo, troca de tema, notificacoes, total de registros e menu de usuario.

### `UserAccountMenu`

Responsavel pelo avatar, dropdown de conta, modal de perfil, modal de configuracoes e logout.

### `LogoManager`

Responsavel por exibir e trocar a logo via localStorage.

## UI simples

### `Toast`

Mostra notificacao de novo lead.

### `EmptyState`

Renderiza estado vazio com titulo e descricao.

## Leads

- `KanbanBoard`
- `KanbanColumn`
- `LeadCard`
- `LeadCreateModal`
- `LeadDetailsModal`

## Clientes

- `ClientsKanbanView`
- `ClientProfileTabsModal`

## Componentes internos por pagina

Muitos componentes sao declarados dentro das paginas:

- Cards de estatistica.
- Tabelas.
- Linhas.
- Graficos simples.
- Modais.
- Campos de formulario.
- Painel de arquivadas.
- Modal de recorrentes.

## Recomendacao

Para evolucao, vale extrair componentes comuns para:

- `StatCard`
- `DataTable`
- `FilterPanel`
- `Modal`
- `StatusBadge`
- `SearchField`
- `ViewToggle`
- `EmptyState` com variantes

Isso deve ser feito depois da documentacao e com cuidado para nao quebrar telas que ja funcionam.
