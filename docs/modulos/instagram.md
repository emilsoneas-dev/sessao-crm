# Modulo: Instagram

Status: especificacao tecnica para implementacao futura. Nao implementado no projeto atual.

## 1. Objetivo do modulo Instagram

Criar uma area integrada ao CRM para planejamento, espelhamento, aprovacao e acompanhamento de conteudos do Instagram dos clientes da agencia.

O modulo deve permitir que a equipe visualize o perfil do cliente em formato semelhante ao Instagram, organize posts/reels planejados, colete aprovacoes do cliente e deixe a estrutura preparada para futura integracao com a API da Meta.

Objetivos principais:

- Conectar conteudos de Instagram ao cadastro do cliente.
- Facilitar aprovacao externa sem exigir login do cliente.
- Reduzir conversas soltas por WhatsApp sobre posts.
- Centralizar comentarios, ajustes e status de aprovacao.
- Preparar o CRM para receber metricas reais futuramente.

## 2. Como o modulo se conecta ao cadastro de clientes

O ponto de entrada deve ser a ficha do cliente em `Clientes`, preferencialmente dentro de `ClientProfileTabsModal`.

O cliente ja existe em `leads_formularios` com `status = 'cliente'`. O modulo Instagram deve usar esse cliente como entidade principal.

Relacionamento esperado:

- Um cliente pode ter zero ou mais perfis de Instagram.
- Um perfil de Instagram pertence a um cliente.
- Um perfil de Instagram pode ter varios posts/reels planejados.
- Cada post/reel pode ter comentarios e aprovacoes.

Na primeira etapa, a conexao deve ser feita por `cliente_id`, usando o `id` do registro em `leads_formularios`.

## 3. Botao "Ativar Instagram" dentro do cliente

Na ficha do cliente, deve existir uma acao discreta:

- Botao: `Ativar Instagram`
- Local sugerido: aba de producao, entregas, documentos ou uma nova aba interna chamada `Instagram`.
- Visivel para: `dono`, `gestor` e, se fizer sentido, `funcionario`.

Comportamento esperado:

1. Usuario abre a ficha do cliente.
2. Clica em `Ativar Instagram`.
3. O sistema cria ou inicializa um perfil Instagram vinculado ao cliente.
4. A ficha passa a exibir acesso para `Espelho do Instagram`.
5. O botao muda para algo como `Abrir Instagram` ou `Gerenciar Instagram`.

Na primeira versao, esse botao nao deve chamar API da Meta. Deve apenas ativar uma estrutura interna manual/simulada.

## 4. Fluxo interno da agencia

Fluxo pensado para a equipe:

1. Agencia ativa Instagram no cliente.
2. Agencia cadastra dados basicos do perfil:
   - foto
   - nome
   - @usuario
   - bio
   - site
   - metricas simuladas ou preenchidas manualmente
3. Agencia cadastra posts e reels planejados.
4. Agencia organiza conteudos por aba: Feed, Reels e Resultados.
5. Agencia envia link magico para o cliente revisar.
6. Cliente aprova, reprova ou solicita ajuste.
7. Agencia recebe status/comentarios no CRM.
8. Agencia ajusta conteudo e reenvia, se necessario.
9. Conteudo aprovado segue para producao/publicacao externa.

Status internos sugeridos para conteudos:

- `rascunho`
- `em_revisao`
- `aprovado`
- `reprovado`
- `ajuste_solicitado`
- `publicado`
- `arquivado`

## 5. Fluxo externo do cliente por link magico

O cliente deve conseguir aprovar conteudos sem login tradicional.

Fluxo externo esperado:

1. Agencia gera um link magico para um cliente/perfil/campanha.
2. Cliente recebe o link por WhatsApp ou e-mail.
3. Ao abrir, ve uma pagina publica protegida por token.
4. Cliente visualiza o Espelho do Instagram.
5. Cliente abre post/reel.
6. Cliente escolhe uma acao:
   - Aprovar
   - Reprovar
   - Solicitar ajuste
7. Cliente escreve comentario quando necessario.
8. Sistema salva a decisao vinculada ao token, post e cliente.

O link magico deve ser temporario ou revogavel.

Campos sugeridos para o token:

- token publico aleatorio
- cliente_id
- instagram_perfil_id
- escopo
- expira_em
- ativo
- criado_por
- criado_em
- ultimo_acesso_em

## 6. Estrutura da pagina "Espelho do Instagram"

A pagina deve simular a leitura visual de um perfil do Instagram, mas dentro da identidade premium do CRM.

Estrutura sugerida:

1. Header do perfil:
   - foto
   - nome
   - @usuario
   - bio
   - site
   - metricas principais
2. Barra de status/aprovacao:
   - total de conteudos
   - aprovados
   - aguardando cliente
   - ajustes solicitados
3. Abas:
   - Feed
   - Reels
   - Resultados
4. Grade de conteudos:
   - imagem/video
   - tipo
   - data prevista
   - status
   - indicador de comentarios
5. Modal ou painel lateral do post:
   - preview
   - legenda
   - data prevista
   - status
   - comentarios
   - botoes de aprovacao

Para o cliente externo, a interface deve ser mais simples e focada em revisar/aprovar.

## 7. Abas da pagina

### Feed

Mostra posts planejados para o feed.

Itens esperados:

- imagem principal
- legenda
- data prevista
- status de aprovacao
- comentarios
- metricas, se ja publicado ou simuladas

### Reels

Mostra videos curtos planejados.

Itens esperados:

- thumbnail
- video ou link do video
- legenda
- roteiro/resumo opcional
- data prevista
- status de aprovacao
- comentarios
- metricas de visualizacao, se houver

### Resultados

Mostra leitura de desempenho do perfil e dos conteudos.

Na primeira versao, os dados podem ser simulados ou preenchidos manualmente.

Metricas sugeridas:

- seguidores
- alcance
- impressoes
- curtidas
- comentarios
- compartilhamentos
- salvamentos
- visualizacoes em reels
- taxa de engajamento
- melhor post do periodo
- melhor reel do periodo

## 8. Como funcionara a aprovacao

Cada post/reel deve ter status de aprovacao.

### Aprovar

Acao usada quando o cliente aceita o conteudo.

Efeito esperado:

- status muda para `aprovado`
- registra usuario/token que aprovou
- registra data da aprovacao
- comentario opcional

### Reprovar

Acao usada quando o cliente recusa o conteudo.

Efeito esperado:

- status muda para `reprovado`
- comentario deve ser obrigatorio
- equipe ve o motivo na area interna

### Solicitar ajuste

Acao usada quando o cliente quer alteracao.

Efeito esperado:

- status muda para `ajuste_solicitado`
- comentario deve ser obrigatorio
- equipe pode responder e reenviar

### Comentarios

Comentarios devem funcionar como historico do conteudo.

Dados sugeridos:

- post_id
- autor_nome
- autor_tipo: `agencia` ou `cliente`
- mensagem
- criado_em
- origem: `crm` ou `link_magico`

## 9. Dados necessarios para cada perfil

Campos sugeridos:

- `id`
- `cliente_id`
- `foto_url`
- `nome`
- `usuario`
- `bio`
- `site`
- `seguidores`
- `seguindo`
- `publicacoes`
- `alcance`
- `impressoes`
- `engajamento`
- `metricas_origem`: `manual`, `simulada` ou `meta_api`
- `ativo`
- `criado_em`
- `atualizado_em`

Observacao: na primeira fase, metricas podem ser manuais/simuladas. A futura API da Meta deve atualizar esses campos ou gravar snapshots historicos.

## 10. Dados necessarios para cada post

Campos sugeridos:

- `id`
- `cliente_id`
- `instagram_perfil_id`
- `tipo`: `feed`, `reels`, `story` ou `carrossel`
- `midia_url`
- `thumbnail_url`
- `legenda`
- `data_prevista`
- `status`
- `status_aprovacao`
- `comentarios_resumo`
- `metricas_origem`: `manual`, `simulada` ou `meta_api`
- `alcance`
- `impressoes`
- `curtidas`
- `comentarios_total`
- `compartilhamentos`
- `salvamentos`
- `visualizacoes`
- `aprovado_em`
- `aprovado_por`
- `reprovado_em`
- `ajuste_solicitado_em`
- `criado_por`
- `criado_em`
- `atualizado_em`

## 11. Ideia inicial de tabelas

Nao criar banco nesta etapa. Ideia para futuras migrations:

### `crm_instagram_perfis`

Guarda o perfil Instagram vinculado ao cliente.

Campos:

- `id uuid primary key`
- `cliente_id uuid not null`
- `foto_url text`
- `nome text`
- `usuario text`
- `bio text`
- `site text`
- `seguidores integer default 0`
- `seguindo integer default 0`
- `publicacoes integer default 0`
- `alcance integer default 0`
- `impressoes integer default 0`
- `engajamento numeric(8, 2) default 0`
- `metricas_origem text default 'manual'`
- `ativo boolean default true`
- `criado_em timestamptz default now()`
- `atualizado_em timestamptz default now()`

### `crm_instagram_posts`

Guarda posts/reels planejados ou publicados.

Campos:

- `id uuid primary key`
- `cliente_id uuid not null`
- `instagram_perfil_id uuid not null`
- `tipo text not null`
- `midia_url text`
- `thumbnail_url text`
- `legenda text`
- `data_prevista date`
- `status text default 'rascunho'`
- `status_aprovacao text default 'em_revisao'`
- `metricas_origem text default 'manual'`
- campos numericos de metricas
- campos de aprovacao
- `criado_por text`
- `criado_em timestamptz default now()`
- `atualizado_em timestamptz default now()`

### `crm_instagram_comentarios`

Guarda comentarios internos e externos.

Campos:

- `id uuid primary key`
- `post_id uuid not null`
- `cliente_id uuid not null`
- `autor_nome text`
- `autor_tipo text`
- `mensagem text not null`
- `origem text`
- `criado_em timestamptz default now()`

### `crm_instagram_links_magicos`

Guarda tokens publicos de aprovacao.

Campos:

- `id uuid primary key`
- `cliente_id uuid not null`
- `instagram_perfil_id uuid`
- `token_hash text not null`
- `escopo text default 'perfil'`
- `ativo boolean default true`
- `expira_em timestamptz`
- `criado_por text`
- `criado_em timestamptz default now()`
- `ultimo_acesso_em timestamptz`

## 12. Permissoes e seguranca

Permissoes internas sugeridas:

- `dono`: acesso total.
- `gestor`: acesso total ao modulo.
- `funcionario`: criar/editar conteudos conforme permissao.
- `cliente`: nao deve acessar CRM interno, somente link magico.

Seguranca esperada:

- RLS para tabelas internas exigindo `is_active_crm_user()`.
- Escrita interna liberada para usuarios ativos.
- Operacoes sensiveis, como excluir perfil/post, restritas a `dono` e `gestor`.
- Link magico nao deve expor dados de outros clientes.
- Token deve ser aleatorio, longo e armazenado como hash.
- Link magico deve poder expirar ou ser revogado.
- A pagina publica deve buscar apenas dados permitidos pelo token.

## 13. Funcionamento do link magico sem login

O link magico deve funcionar fora do login do Supabase Auth.

Formato sugerido:

- `/instagram/aprovacao/:token`

Fluxo tecnico futuro:

1. Front recebe o token da URL.
2. Chama uma Edge Function publica.
3. A Edge Function valida hash, expiracao e status ativo.
4. Se valido, retorna apenas o perfil e posts autorizados.
5. Cliente envia aprovacao/comentario pela mesma Edge Function.
6. Edge Function grava decisao no banco com origem `link_magico`.

Motivo para usar Edge Function:

- Evita expor tabelas diretamente para anon.
- Permite validar token com hash.
- Permite controlar exatamente quais campos saem para o cliente.

## 14. Como deixar preparado para futura API da Meta

Nao implementar API da Meta agora, mas preparar o desenho para ela.

Preparacoes recomendadas:

- Usar campo `metricas_origem` para separar manual, simulada e API.
- Separar posts internos dos IDs da Meta.
- Futuramente adicionar campos:
  - `meta_account_id`
  - `meta_media_id`
  - `meta_access_token_ref`
  - `meta_connected_at`
  - `meta_last_sync_at`
- Guardar tokens da Meta de forma segura, nunca em localStorage.
- Usar Edge Functions para sincronizacao com Meta.
- Criar tabela de snapshots de metricas se for necessario historico diario.
- Manter o modo manual funcionando mesmo sem API.

## 15. Roadmap de implementacao em etapas pequenas para o Codex

### Etapa 1: documentacao e desenho

- Criar esta especificacao.
- Validar nomes, fluxo e escopo com o usuario.
- Nao alterar banco nem telas.

### Etapa 2: banco minimo

- Criar migration com tabelas `crm_instagram_perfis`, `crm_instagram_posts`, `crm_instagram_comentarios` e `crm_instagram_links_magicos`.
- Usar `create table if not exists` e indices por `cliente_id`.
- Criar RLS para usuarios ativos.

### Etapa 3: ativacao pelo cliente

- Adicionar botao `Ativar Instagram` na ficha do cliente.
- Criar perfil manual vinculado ao cliente.
- Exibir estado ativado/inativo.

### Etapa 4: tela interna do Espelho

- Criar pagina ou aba interna com header do perfil.
- Criar abas Feed, Reels e Resultados.
- Criar CRUD simples de posts/reels.

### Etapa 5: aprovacao interna

- Adicionar status de aprovacao nos posts.
- Adicionar comentarios internos.
- Adicionar filtros por status.

### Etapa 6: link magico

- Criar Edge Function para validar token.
- Criar pagina publica de aprovacao.
- Permitir aprovar, reprovar e solicitar ajuste.

### Etapa 7: metricas simuladas/manuais

- Exibir indicadores preenchidos manualmente.
- Criar area de resultados com graficos simples.

### Etapa 8: preparacao Meta API

- Adicionar campos de IDs externos.
- Criar desenho de sync.
- Implementar API somente depois de validar processo manual.

## Observacoes finais

Este modulo deve nascer conectado a Clientes e Operacional, mas nao deve virar duplicacao de tarefas. Conteudos de Instagram podem gerar tarefas depois, porem o Espelho do Instagram deve focar em visualizacao, aprovacao e resultado.

O primeiro MVP deve ser manual, simples e seguro. A integracao com Meta deve ser uma camada futura, nao dependencia inicial.
