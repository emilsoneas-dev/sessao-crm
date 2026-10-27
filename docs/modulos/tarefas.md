# Modulo: Operacional / Tarefas

## 1. Objetivo da secao

Controlar tarefas, entregas, artigos, recorrentes, calendario e arquivamento mensal.

## 2. Telas existentes

- `/tarefas`, exibida no menu como Operacional.
- Visualizacao em lista.
- Visualizacao em Kanban.
- Visualizacao em calendario.
- Area de arquivadas por mes.
- Modal de tarefa.
- Modal de tarefas recorrentes.

## 3. Componentes utilizados

- `CRMTasksPage`
- `TaskCalendar`
- `TaskStatCard`
- `TaskTable`
- `TaskBoard`
- `TaskBoardCard`
- `TaskArchivePanel`
- `RecurringTasksModal`
- `TaskRow`
- `TaskModal`
- `TaskField`

## 4. Campos principais

- `cliente_id`
- `cliente_nome`
- `titulo`
- `descricao`
- `tipo`
- `categoria`
- `status`
- `prioridade`
- `data_vencimento`
- `hora_vencimento`
- `data_inicio`
- `data_conclusao`
- `responsavel`
- `responsavel_email`
- `recorrente`
- `recorrencia`
- `mes_referencia`
- `quantidade_artigos`
- `valor_unitario`
- `valor_total`
- `faturavel`
- `valor_previsto`
- `valor_pago`
- `pago_em`
- `link_referencia`
- `observacoes`
- `mes_arquivo`
- `data_arquivamento`

## 5. Acoes disponiveis

- Criar tarefa.
- Editar tarefa.
- Excluir tarefa com confirmacao.
- Cancelar tarefa.
- Concluir tarefa.
- Reabrir tarefa.
- Mover tarefa entre status no Kanban.
- Filtrar por status, tipo, prioridade, periodo e responsavel.
- Buscar tarefa.
- Alternar lista, quadro e calendario.
- Gerar tarefas recorrentes para clientes recorrentes.
- Arquivar concluidas do mes selecionado.

## 6. Fluxo do usuario

O usuario cria ou gera tarefas, acompanha no quadro Pendente, Enviado ao Cliente, Recebido e Concluido, usa alertas visuais para atrasos e arquiva concluidas por mes.

## 7. Relacao com o banco de dados

Tabela: `crm_tarefas`.

Servicos:

- `fetchTasks`
- `fetchClientTasks`
- `createTask`
- `updateTask`
- `updateTaskStatus`
- `completeTask`
- `cancelTask`
- `reopenTask`
- `deleteTask`
- `archiveCompletedTasksByMonth`
- `createRecurringArticleTasks`
- `createMonthlyPaymentTaskFromClient`

## 8. Integracoes

- Clientes: tarefas podem ser vinculadas a cliente.
- Financeiro: tarefas faturaveis alimentam receita.
- Visao Geral: tarefas alimentam indicadores operacionais e estrategicos.
- Documentos: link de referencia pode apontar para material externo.

## 9. Pontos fortes

- Ja possui fluxo operacional definido.
- Suporta recorrentes e arquivadas.
- Possui calendario.
- Financeiro se baseia nas tarefas faturaveis.

## 10. Problemas ou limitacoes

- Muitos componentes e regras estao no mesmo arquivo.
- Drag and drop de tarefas usa eventos HTML, enquanto Leads usa `@dnd-kit`.
- Status antigos sao normalizados no front, mas podem existir no banco.

## 11. Sugestoes de melhoria futura

- Separar componentes de tarefas em arquivos menores.
- Criar historico de mudanca de status.
- Criar templates de tarefas.
- Melhorar filtros salvos por usuario.
