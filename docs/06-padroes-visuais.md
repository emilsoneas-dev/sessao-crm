# Padroes visuais

## Arquivos principais

- `src/assets/styles/global.css`
- `src/modules/clients/styles/clients.css`
- `src/modules/clients/styles/client-kanban.css`
- `src/modules/tasks/styles/tasks.css`
- `src/modules/finance/styles/finance.css`
- `src/modules/overview/styles/overview.css`
- `src/modules/documents/styles/documents.css`
- `src/modules/hr/styles/hr.css`
- `src/modules/settings/styles/settings.css`
- `src/modules/auth/styles/auth.css`
- `src/components/layout/user-account-menu.css`
- `src/components/layout/topbar-notifications.css`
- `src/components/layout/sidebar-account.css`

## Tema

O tema e controlado por classe:

- `theme-light`
- `theme-dark`

A preferencia fica em `localStorage` com chave `crm_theme`.

## Tokens globais

`global.css` define variaveis para:

- Cores base.
- Superficies.
- Texto e muted.
- Linhas.
- Sombras.
- Radius.
- Espacamentos.
- Tamanhos de fonte.
- Pesos de fonte.
- Transicoes.

## Componentes visuais recorrentes

- Cards com borda, fundo transludico e sombra.
- Cards de indicadores com icone e numero.
- Botoes primario, secundario, ghost e perigo.
- Inputs/selects com borda e radius.
- Badges por status.
- Painel/modal com header, body e footer.
- Tabelas/listas com hover sutil.
- Kanban com colunas e cards.

## Pontos fortes

- O sistema ja possui identidade escura premium.
- Existem variaveis globais uteis.
- Ha suporte a tema claro/escuro.
- Iconografia esta padronizada com Lucide.

## Pontos de atencao

- Algumas paginas ainda possuem estilos muito especificos e diferentes entre si.
- O arquivo global contem overrides amplos com `!important`.
- Ha correcoes escopadas para Leads no fim do `global.css`.
- A repeticao de padroes de cards/tabelas sugere oportunidade de componentes visuais comuns.
