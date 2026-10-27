# Modulo: Clientes

## 1. Objetivo da secao

Gerenciar a carteira de clientes, seus dados principais, status operacional, recorrencia e links de trabalho.

## 2. Telas existentes

- `/clientes`
- Lista de clientes.
- Kanban de clientes.
- Modal/ficha do cliente com abas.

## 3. Componentes utilizados

- `CRMClientsPage`
- `ClientsKanbanView`
- `ClientProfileTabsModal`
- `PortfolioMetric`
- `FilterSelect`
- `ClientRow`

## 4. Campos principais

- `nome`
- `email`
- `telefone`
- `whatsapp`
- `cidade`
- `empresa`
- `contato_principal`
- `status_cliente`
- `servico_contratado`
- `plano_contratado`
- `data_inicio_cliente`
- `responsavel_cliente`
- `proxima_acao`
- `ultima_acao`
- `mensalidade`
- `dia_vencimento`
- `status_financeiro`
- `recorrente`
- `artigos_mensais`
- `valor_por_artigo`
- `responsavel_padrao`
- campos de links/documentos

## 5. Acoes disponiveis

- Alternar entre lista e Kanban.
- Buscar cliente.
- Filtrar por status, modelo, responsavel e pendencias.
- Criar novo cliente.
- Abrir ficha completa.
- Editar dados do cliente.
- Mover status no Kanban.
- Arquivar/encerrar cliente.
- Excluir cliente com confirmacao.
- Abrir WhatsApp quando houver contato.

## 6. Fluxo do usuario

O usuario acompanha clientes ativos ou em implantacao, abre a ficha para editar dados, ajusta recorrencia/artigos e usa filtros para encontrar pendencias de cadastro.

## 7. Relacao com o banco de dados

Tabela: `leads_formularios`, usando `status = 'cliente'`.

Servicos:

- `createClientDetails`
- `updateClientDetails`
- `archiveClient`
- `deleteClient`

## 8. Integracoes

- Leads: clientes podem nascer de conversao.
- Tarefas: clientes recorrentes alimentam geracao de tarefas.
- Financeiro: valores por artigo e tarefas ligadas ao cliente influenciam receita.
- Documentos: links do cliente sao consumidos pela central de documentos.

## 9. Pontos fortes

- Lista e Kanban ja existem.
- Ficha do cliente concentra dados importantes.
- Possui campos para recorrencia de artigos.
- Permite identificar pendencias de producao.

## 10. Problemas ou limitacoes

- Leads e clientes compartilham tabela, o que exige cuidado em filtros.
- Alguns dados financeiros ainda existem no cadastro do cliente, mesmo que o financeiro principal use tarefas.
- A exclusao e definitiva no banco.

## 11. Sugestoes de melhoria futura

- Separar melhor dados cadastrais, producao e financeiro na ficha.
- Criar historico do cliente.
- Criar lixeira ou soft delete antes de exclusao definitiva.
- Adicionar relacao mais direta com tarefas e entregas recentes.
