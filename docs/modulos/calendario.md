# Modulo: Calendario

Status: identificado como visualizacao dentro de Operacional/Tarefas, nao como pagina propria.

## 1. Objetivo da secao

Mostrar tarefas por data em formato mensal.

## 2. Telas existentes

- Visualizacao `Calendario` dentro de `/tarefas`.

## 3. Componentes utilizados

- `TaskCalendar` dentro de `CRMTasksPage.jsx`.

## 4. Campos principais

- `data_vencimento`
- `status`
- `prioridade`
- `titulo`
- `cliente_nome`

## 5. Acoes disponiveis

- Alternar para modo calendario.
- Navegar entre meses.
- Abrir tarefa a partir do calendario.

## 6. Fluxo do usuario

O usuario alterna a aba de visualizacao de tarefas para calendario e acompanha vencimentos por dia.

## 7. Relacao com o banco de dados

Usa `crm_tarefas`, carregada pelo modulo Operacional.

## 8. Integracoes

- Operacional/Tarefas.
- Alertas de atraso.

## 9. Pontos fortes

- Calendario ja existe sem criar pagina separada.
- Mostra tarefas sem data em area propria.

## 10. Problemas ou limitacoes

- Nao existe rota dedicada.
- Nao ha calendario global multi-modulo.

## 11. Sugestoes de melhoria futura

- Permitir filtro por responsavel.
- Criar integracao com Google Calendar se virar requisito.
- Melhorar visualizacao semanal/diaria se necessario.
