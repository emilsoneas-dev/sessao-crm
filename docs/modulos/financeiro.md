# Modulo: Direcao / Financeiro

## 1. Objetivo da secao

Analisar receita e situacao financeira com base em tarefas faturaveis.

## 2. Telas existentes

- `/financeiro`
- Cards de receita e quantidade.
- Analise mensal.
- Grafico de receita por mes.
- Grafico por servico.
- Lista de tarefas faturaveis do mes.

## 3. Componentes utilizados

- `CRMFinancePage`
- `FinanceTaskRow`
- `FinanceStat`
- `FinanceDueFilterButton`
- `FinanceSituationCard`
- `FinanceInsightCard`
- `MonthlyRevenueChart`
- `ServiceBreakdownChart`

## 4. Campos principais

Usa principalmente `crm_tarefas`:

- `status`
- `faturavel`
- `mes_referencia`
- `mes_arquivo`
- `data_vencimento`
- `valor_total`
- `valor_unitario`
- `quantidade_artigos`
- `valor_previsto`
- `cliente_nome`
- `tipo`
- `categoria`

## 5. Acoes disponiveis

- Selecionar mes.
- Buscar tarefa/cliente/servico.
- Filtrar por status.
- Filtrar por concluidas ou pendentes.
- Clicar em meses/insights para alterar mes analisado.

## 6. Fluxo do usuario

O usuario escolhe um mes, ve receita prevista, concluida e pendente, analisa variacao entre meses e entende quais servicos/tarefas puxam faturamento.

## 7. Relacao com o banco de dados

Tabela: `crm_tarefas`.

Servicos:

- `fetchFinanceTasksByMonth`
- `fetchTasks`

Regras atuais:

- Considera apenas tarefas com `faturavel !== false`.
- Ignora tarefas `cancelado`.
- Considera `concluido` e `arquivada` como receita concluida.
- Calcula valor por `valor_total`, ou por `quantidade_artigos * valor_unitario`, ou por `valor_previsto`.

## 8. Integracoes

- Tarefas: fonte principal do financeiro.
- Visao Geral: compartilha indicadores estrategicos.
- Clientes: apenas como contexto de nome/cliente; nao soma mensalidade direta.

## 9. Pontos fortes

- Financeiro esta conectado ao trabalho entregue.
- Ja possui leitura de melhor/pior mes e servicos.
- Evita somar canceladas.

## 10. Problemas ou limitacoes

- Nao ha exportacao de financeiro identificada.
- Graficos sao componentes customizados simples.
- Dependencia de preenchimento correto das tarefas faturaveis.

## 11. Sugestoes de melhoria futura

- Criar fechamento mensal.
- Criar exportacao CSV/PDF.
- Criar drilldown por cliente/servico.
- Criar metas e comparativo contra meta.
