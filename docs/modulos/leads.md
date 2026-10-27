# Modulo: Leads

## 1. Objetivo da secao

Gerenciar oportunidades comerciais no funil de vendas.

## 2. Telas existentes

- `/leads`
- Kanban de funil comercial.
- Modal de novo lead.
- Modal de detalhes do lead.

## 3. Componentes utilizados

- `CRMLeadsPage`
- `KanbanBoard`
- `KanbanColumn`
- `LeadCard`
- `LeadCreateModal`
- `LeadDetailsModal`
- `Toast`
- `useLeadsRealtime`

## 4. Campos principais

- `nome`
- `email`
- `telefone`
- `empresa`
- `servico_interesse`
- `mensagem`
- `origem`
- `etapa`
- `status`
- `prioridade`
- `observacoes`
- `responsavel`
- `documento_url`
- `data_entrada`
- `data_ultima_atualizacao`

## 5. Acoes disponiveis

- Criar lead manual.
- Mover lead entre etapas do Kanban.
- Abrir detalhes.
- Salvar observacoes e link de apoio.
- Chamar no WhatsApp quando houver telefone.
- Converter lead em cliente.
- Arquivar lead.
- Receber notificacao de novo lead em realtime.
- Ativar som de novo lead.

## 6. Fluxo do usuario

O usuario recebe ou cria um lead, arrasta pelas etapas do funil, registra observacoes, abre apoio/documentos e converte em cliente quando fechado.

## 7. Relacao com o banco de dados

Tabela: `leads_formularios`.

Servicos:

- `fetchLeads`
- `createLead`
- `updateLeadStage`
- `updateLeadNotes`
- `updateLeadDetails`
- `convertLeadToClient`
- `archiveLead`

## 8. Integracoes

- Clientes: lead convertido vira cliente na mesma tabela.
- Topbar: registros e notificacoes.
- Documentos: usa campos de links.
- Visao Geral: alimenta funil e conversao.

## 9. Pontos fortes

- Funil claro em seis etapas.
- Drag and drop com `@dnd-kit/core`.
- Modal de criacao com campos essenciais.
- Realtime para novos leads.

## 10. Problemas ou limitacoes

- O modulo Leads tambem hospeda a shell principal do CRM.
- Algumas informacoes antigas ou vindas de formularios externos aparecem no modal, mas nao estao em todas as migrations.
- O CSS de Leads precisou de correcao escopada apos ajustes globais.

## 11. Sugestoes de melhoria futura

- Separar shell/navegacao do modulo Leads.
- Criar filtros por origem, prioridade, responsavel e periodo.
- Criar historico de interacoes do lead.
- Padronizar campos vindos de formularios externos.
