# Modulo: Documentos

## 1. Objetivo da secao

Centralizar links e materiais vinculados aos clientes.

## 2. Telas existentes

- `/documentos`
- Cards de indicadores.
- Lista de clientes com links por grupo.
- Painel de filtros.

## 3. Componentes utilizados

- `CRMDocumentsPage`
- `DocumentStat`
- `ClientDocumentsRow`
- `DocumentLinkCard`

## 4. Campos principais

Campos vindos de `leads_formularios`:

- `documento_url`
- `briefing_url`
- `contrato_url`
- `estrategia_url`
- `financeiro_url`
- `conteudos_url`
- `tarefas_url`
- `relatorios_url`
- `acessos_url`
- `drive_url`
- `historico_url`

Tambem usa dados do cliente:

- `nome`
- `empresa`
- `email`
- `servico_contratado`
- `plano_contratado`
- `responsavel_cliente`
- `responsavel`

## 5. Acoes disponiveis

- Buscar cliente, empresa ou servico.
- Filtrar por grupo de documento.
- Filtrar por status de preenchimento.
- Abrir links externos.
- Limpar filtros.

## 6. Fluxo do usuario

O usuario acessa Documentos para localizar rapidamente links operacionais, comerciais, financeiros ou de entrega relacionados a cada cliente.

## 7. Relacao com o banco de dados

Nao ha tabela exclusiva de documentos. Os links ficam na tabela `leads_formularios`.

## 8. Integracoes

- Clientes: consome os links cadastrados na ficha do cliente.
- Relatorios: usa `relatorios_url` como link, mas nao ha modulo proprio de relatorios.
- Financeiro e Operacional: existem campos de links para areas relacionadas.

## 9. Pontos fortes

- Ajuda a reunir materiais dispersos.
- Possui agrupamento por base, comercial, entrega, financeiro e operacao.
- Mostra taxa de preenchimento e pendencias como sem contrato.

## 10. Problemas ou limitacoes

- Nao faz upload de arquivos.
- Nao valida se links ainda existem.
- Nao ha versionamento ou historico de documentos.

## 11. Sugestoes de melhoria futura

- Decidir se o modulo continuara como central de links ou tera arquivos reais.
- Integrar Supabase Storage se houver upload.
- Criar validacao visual de links quebrados.
- Criar permissao por tipo de documento se clientes acessarem a area.
