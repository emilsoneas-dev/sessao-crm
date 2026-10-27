# Modulo: Dashboard / Visao Geral

## 1. Objetivo da secao

Fornecer um resumo executivo do CRM em duas leituras: estrategica e operacional.

## 2. Telas existentes

- `/visao-geral`
- Subvisoes pelo menu: Estrategico e Operacional.

## 3. Componentes utilizados

- `CRMOverviewPage`
- `OverviewOperationalView`
- `OverviewStrategicView`
- `OverviewStat`
- `OverviewAlert`
- `OverviewBarRow`
- `Topbar`
- `Sidebar`

## 4. Campos principais

Usa dados de:

- Leads/clientes: etapa, status, status_cliente, recorrente, artigos_mensais.
- Tarefas: status, data_vencimento, mes_referencia, valor_total, valor_unitario, quantidade_artigos, faturavel.

## 5. Acoes disponiveis

- Alternar entre visao estrategica e operacional pelo menu.
- Clicar em cards quando ha callback de navegacao.
- Navegar para modulos relacionados.

## 6. Fluxo do usuario

O usuario entra na Visao Geral para entender situacao da agencia, depois navega para Leads, Operacional, Clientes ou Financeiro conforme o indicador.

## 7. Relacao com o banco de dados

- Busca tarefas em `crm_tarefas` via `fetchTasks()`.
- Recebe leads e clientes ja carregados pela shell principal.

## 8. Integracoes

- Integra com Leads, Clientes, Tarefas e Financeiro.
- Usa a mesma definicao de status de tarefas para calculos operacionais.

## 9. Pontos fortes

- Ja separa leitura estrategica e operacional.
- Usa receita por tarefas faturaveis.
- Calcula atrasos, artigos do mes e clientes com demanda ativa.

## 10. Problemas ou limitacoes

- A origem dos dados vem parcialmente por props e parcialmente por busca propria.
- Ainda nao ha graficos robustos.
- A navegacao por cards depende de callbacks e pode ser ampliada.

## 11. Sugestoes de melhoria futura

- Criar filtros por periodo.
- Melhorar graficos de tendencia.
- Linkar todos os indicadores relevantes a listas filtradas.
- Unificar fonte de dados com cache/servico compartilhado.
