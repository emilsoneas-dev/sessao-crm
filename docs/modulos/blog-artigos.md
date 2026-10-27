# Modulo: Blog/Artigos

Status: MVP implementado no projeto atual como modulo `Conteudo` / `Central de Revisao de Conteudo`.

## 1. Objetivo do modulo Blog/Artigos

Criar uma Central de Revisao de Conteudo premium para planejamento, leitura, revisao e aprovacao de artigos produzidos pela agencia para seus clientes.

O modulo deve transformar o fluxo atual, em que varios artigos ficam agrupados em um documento unico, em uma experiencia organizada dentro do CRM. A proposta e manter a leitura confortavel de um editor/documento, parecida com Google Docs, mas com controle de status, comentarios, historico e link magico para aprovacao sem login.

Objetivos principais:

- Centralizar pacotes mensais de artigos por cliente.
- Separar estrategia editorial do mes dos artigos individuais.
- Permitir leitura limpa e organizada dos textos completos.
- Facilitar aprovacao externa sem exigir login do cliente.
- Registrar comentarios, ajustes e decisoes por artigo.
- Dar para a agencia uma visao clara do que esta aprovado, pendente ou com ajuste solicitado.
- Guiar o cliente artigo por artigo, reduzindo duvida e aumentando taxa de resposta.
- Coletar, ao final da revisao, sugestoes opcionais para o planejamento do proximo mes.
- Manter o modulo independente do Instagram, mas alinhado aos mesmos padroes visuais e de seguranca do CRM.

## Guia rapido do fluxo atual

Este fluxo descreve o uso real do modulo Conteudo ja implementado no CRM.

### 1. Ativar Conteudo no cliente

1. Acesse `Clientes`.
2. Abra a ficha do cliente.
3. Entre na aba `Conteudo`.
4. Clique em `Ativar modulo`.
5. O sistema cria a primeira entrega vinculada ao cliente.

Resultado esperado:

- Cliente passa a aparecer em `/conteudo`.
- A ficha do cliente mostra o card da Central de Revisao de Conteudo.
- O botao `Abrir Central de Conteudo` leva para a area interna do modulo.

### 2. Criar ou abrir entrega mensal

1. Acesse `/conteudo`.
2. Clique em `Abrir cliente`.
3. Use `Nova entrega` para criar um pacote mensal.
4. Informe mes, ano, nome da entrega, responsavel, quantidade prevista, status, objetivo e observacoes internas.

Resultado esperado:

- A entrega aparece na lista de pacotes do cliente.
- Cada cliente pode ter entregas por meses diferentes.
- O sistema evita duplicidade para o mesmo cliente e mes.

### 3. Preencher estrategia editorial

1. Abra uma entrega.
2. Entre na aba `Estrategia`.
3. Preencha objetivo, publico-alvo, tom, palavras-chave, servicos priorizados, objetivos de SEO e observacoes.
4. Salve a estrategia.

Resultado esperado:

- A estrategia aparece como contexto da entrega.
- Na area publica, o cliente pode ler a estrategia antes dos conteudos.

### 4. Cadastrar conteudos

1. Entre na aba `Itens`.
2. Clique em `Novo item`.
3. Cadastre titulo, tipo, texto completo, palavra-chave, meta title, meta description, ordem, status e observacoes internas.
4. Salve.

Acoes disponiveis:

- Criar item.
- Editar item.
- Duplicar item.
- Excluir item com confirmacao.
- Reordenar itens.

Resultado esperado:

- Os itens aparecem em uma lista lateral compacta.
- Ao selecionar um item, a leitura completa aparece no painel ao lado.
- O item alterado fica focado automaticamente apos salvar, duplicar ou reordenar.

### 5. Gerar link magico de revisao

1. Abra a entrega.
2. Entre na aba `Link de revisao`.
3. Clique em `Gerar link`.
4. Copie o link gerado e envie ao cliente.

Observacoes:

- O link publico usa token seguro com hash salvo no banco.
- O token completo aparece apenas no momento da criacao.
- Se ja existir link ativo, o CRM informa isso e permite gerar um novo link para copiar novamente.

### 6. Cliente revisa sem login

O cliente acessa `/conteudo-revisao/:token`.

Na pagina publica, ele pode:

- ver a tela inicial `Central de Revisao de Conteudo`;
- ler o objetivo da estrategia;
- iniciar a revisao;
- navegar pela sidebar de estrategia e conteudos;
- aprovar um conteudo;
- solicitar revisao com comentario obrigatorio;
- comentar sem alterar status;
- acompanhar o progresso.

Comportamento esperado:

- Ao aprovar ou solicitar revisao, o sistema avanca para o proximo conteudo pendente.
- Quando todos os conteudos sao revisados, aparece a tela `Revisao concluida`.

### 7. Finalizar revisao

Na tela final, o cliente pode:

- responder o briefing opcional do proximo mes;
- clicar em `Agora nao`;
- finalizar a revisao.

Ao finalizar:

- a entrega recebe `revisao_concluida_em`;
- o link publico entra em modo leitura;
- aprovacoes, revisoes, comentarios e briefing passam a ficar bloqueados pelo fluxo publico;
- a area interna destaca a entrega como `Pronto para publicar` ou `Ajustes solicitados`.

### 8. Agencia acompanha internamente

Na area interna, a equipe pode acompanhar:

- status da entrega;
- total de conteudos;
- total revisado;
- total aprovado;
- ajustes solicitados;
- comentarios por conteudo;
- historico;
- briefing do proximo mes;
- data de finalizacao da revisao.

### Migrations necessarias

Para o modulo Conteudo funcionar completo em producao, as migrations abaixo precisam estar rodadas no Supabase nesta ordem:

1. `009_content_review_module.sql`
2. `010_content_editorial_strategy_fields.sql`
3. `011_content_item_internal_notes.sql`
4. `012_content_magic_review_rpc.sql`
5. `013_content_review_actions_rpc.sql`
6. `014_content_next_month_briefing_rpc.sql`
7. `015_content_review_finalization_rpc.sql`
8. `016_content_briefing_finalization_guard.sql`

### Rotas atuais

- Area interna: `/conteudo`
- Area publica sem login: `/conteudo-revisao/:token`

## 2. Como o modulo se conecta ao cadastro de clientes

O ponto de entrada principal deve ser o cadastro de clientes em `Clientes`, usando a mesma entidade base ja utilizada pelo CRM.

Relacionamento esperado:

- Um cliente pode ter varios pacotes mensais de artigos.
- Um pacote mensal pertence a um cliente.
- Um pacote mensal pode ter uma estrategia editorial.
- Um pacote mensal pode ter varios artigos.
- Cada artigo pode ter comentarios, aprovacoes e historico de status.

Na primeira implementacao, o relacionamento deve ser feito por `cliente_id`, usando o `id` do cliente em `leads_formularios`.

Locais sugeridos para acesso:

- Ficha do cliente: botao ou aba `Blog/Artigos`.
- Area operacional: lista de pacotes de artigos por mes.
- Tarefas: cada pacote ou artigo pode, futuramente, estar relacionado a uma tarefa de producao.

## 3. Como criar um pacote mensal de artigos para um cliente

O pacote mensal deve representar a entrega de artigos de um cliente em um mes especifico.

Fluxo esperado:

1. Usuario interno acessa `Blog/Artigos`.
2. Seleciona um cliente.
3. Escolhe mes e ano de referencia.
4. Define nome do pacote, por exemplo `Artigos de Agosto 2026`.
5. Informa quantidade prevista de artigos.
6. Cadastra a estrategia editorial do mes.
7. Adiciona os artigos individualmente.
8. Gera link magico para revisao do cliente.

Campos sugeridos para o pacote:

- cliente
- mes_referencia
- titulo
- objetivo
- quantidade_prevista
- status_geral
- responsavel
- criado_por
- criado_em
- atualizado_em

Status sugeridos para o pacote:

- `rascunho`
- `em_revisao`
- `parcialmente_aprovado`
- `aprovado`
- `ajustes_pendentes`
- `publicado`
- `arquivado`

## 4. Como cadastrar a estrategia editorial do mes

A estrategia editorial deve funcionar como a primeira leitura do pacote. Ela explica o contexto antes dos artigos.

Campos sugeridos:

- objetivo do mes
- publico-alvo
- linha editorial
- palavras-chave prioritarias
- temas do mes
- observacoes estrategicas
- links de referencia
- tom de comunicacao
- instrucoes para revisao do cliente

Experiencia esperada:

- A estrategia aparece no topo do pacote interno.
- Na area publica do cliente, a estrategia deve aparecer como a primeira opcao da sidebar, antes dos artigos.
- A estrategia pode ter status proprio, mas a aprovacao principal deve acontecer nos artigos.

## 5. Como cadastrar artigos individualmente

Cada artigo deve ser um registro independente dentro do pacote mensal.

Campos principais:

- titulo
- subtitulo
- slug sugerido
- palavra-chave principal
- palavras-chave secundarias
- categoria ou tema
- conteudo completo
- resumo
- meta title
- meta description
- CTA
- link de briefing ou referencia
- ordem dentro do pacote
- responsavel
- status
- data_prevista
- data_aprovacao
- data_publicacao

Fluxo de cadastro:

1. Usuario clica em `Novo artigo`.
2. Informa titulo e dados basicos.
3. Cola ou importa o conteudo completo.
4. Ajusta ordem na sidebar.
5. Salva como rascunho ou envia para revisao.

## 6. Como importar ou colar artigos completos no sistema

O MVP deve permitir colar artigos completos em um editor rico ou campo estruturado.

Formas de entrada:

- Colar texto completo diretamente.
- Colar conteudo vindo de Google Docs, Word ou Notion.
- Preservar quebras de linha e hierarquia basica.
- Permitir formatacao simples: titulo, subtitulo, negrito, listas, links e citacoes.

Futuras melhorias:

- Importar `.docx`.
- Importar por link do Google Docs.
- Separar automaticamente varios artigos de um documento unico.
- Detectar titulos por padrao de cabecalho.
- Criar sugestao automatica de SEO usando IA, se a agencia desejar.

Na primeira versao, o sistema nao deve depender de importacao automatica. O fluxo de colar e editar manualmente deve ser suficiente e confiavel.

## 7. Como organizar os artigos em uma sidebar lateral

A sidebar lateral deve ser o centro de navegacao do pacote.

Estrutura sugerida:

- Estrategia do mes
- Artigo 1
- Artigo 2
- Artigo 3
- Artigo 4
- Area de status do pacote

Cada item da sidebar deve exibir:

- titulo curto
- status visual
- indicador de comentario pendente
- indicador de aprovado ou ajuste solicitado
- ordem do artigo

Comportamentos esperados:

- Clique em um item abre o conteudo correspondente.
- Sidebar deve permanecer visivel em telas grandes.
- Em telas menores, sidebar pode virar drawer ou seletor.
- Agencia pode reordenar artigos futuramente.
- Cliente nao deve editar a ordem, apenas navegar.

## 8. Como funcionara o ambiente de leitura estilo Google Docs

O ambiente de leitura deve ser limpo, centralizado e confortavel, mas sem tentar copiar todas as funcionalidades do Google Docs.

Layout interno sugerido:

- Topo com cliente, mes, status do pacote e acoes.
- Sidebar lateral com estrategia e artigos.
- Area central com conteudo em largura de leitura.
- Painel lateral ou bloco inferior com comentarios e historico.

Caracteristicas visuais:

- Fundo escuro premium seguindo o CRM.
- Area do artigo com contraste alto e leitura confortavel.
- Tipografia mais editorial, sem exagero de tamanho.
- Separacao clara entre conteudo, status e acoes.
- Botoes de aprovacao sempre visiveis no artigo aberto.

O conteudo do artigo deve parecer um documento final para leitura, nao apenas um formulario de campos.

## 9. Como funcionara o link magico para aprovacao sem login

O link magico deve permitir que o cliente revise o pacote sem acessar o CRM interno.

Fluxo esperado:

1. Agencia cria ou atualiza o pacote.
2. Agencia clica em `Gerar link de aprovacao`.
3. Sistema cria token seguro.
4. Agencia copia o link e envia ao cliente.
5. Cliente abre o link sem login.
6. Cliente acessa a primeira tela publica: `Central de Revisao de Conteudo`.
7. Cliente ve resumo executivo, objetivo da estrategia e botao `Iniciar revisao`.
8. Cliente revisa os artigos em fluxo guiado, um por vez.
9. Cliente aprova, revisa ou comenta cada artigo.
10. O CRM registra cada retorno e avanca automaticamente para o proximo artigo pendente.
11. Ao concluir todos os artigos, o cliente ve a tela final `Revisao concluida`.
12. Depois da conclusao, o cliente pode responder um briefing opcional para o proximo mes.

Primeira tela publica: `Central de Revisao de Conteudo`

- Deve ser uma tela de abertura simples, premium e objetiva.
- Deve explicar que o cliente revisara os conteudos do mes, artigo por artigo.
- Deve evitar excesso de texto e deixar claro o proximo passo.
- Deve ter um botao principal: `Iniciar revisao`.

Resumo executivo em duas colunas:

- `Cliente`: nome do cliente ou marca.
- `Periodo`: mes e ano do pacote.
- `Conteudos`: quantidade total de artigos.
- `Progresso`: resumo do andamento, por exemplo `0/12 revisados`.

Card `Objetivo da Estrategia`:

- Exibe o objetivo editorial do mes em texto curto.
- Pode incluir publico-alvo, foco de SEO ou direcao estrategica.
- Deve preparar o cliente para ler os artigos com o contexto correto.

Experiencia guiada por artigo:

- A pagina publica deve abrir no primeiro artigo pendente do pacote.
- O cliente revisa um artigo por vez, com foco total no conteudo atual.
- Ao aprovar, o sistema salva o status e avanca automaticamente para o proximo artigo pendente.
- Ao clicar em `Revisar`, o sistema abre um modal com comentario obrigatorio.
- Depois de enviar a revisao, o sistema salva a decisao e avanca para o proximo artigo pendente.
- Ao clicar em `Comentar`, o sistema permite comentario livre sem mudar o status do artigo.
- O cliente pode voltar manualmente pela sidebar para reler qualquer artigo.
- Quando todos os artigos forem revisados, a pagina deve exibir uma tela final: `Revisao concluida`.

Barra fixa no topo do artigo:

- contador em linguagem clara, por exemplo `Artigo 1 de 12`;
- titulo do artigo atual;
- progresso do pacote;
- status atual do artigo;
- botoes em uma unica linha;
- botao `Aprovar`;
- botao `Revisar`;
- botao `Comentar`.

O botao `Revisar` representa o pedido de ajuste do cliente. Internamente, ele pode atualizar o status para `ajuste_solicitado`.

Progresso geral do pacote:

- O topo do pacote deve mostrar resumo de andamento, por exemplo `1/12 aprovados`, `3/12 revisados`, `2/12 com ajuste`.
- Esse progresso deve atualizar conforme as decisoes forem salvas.
- A sidebar esquerda deve mostrar todos os artigos e seus status individuais.
- Artigos aprovados devem exibir data e hora da aprovacao.
- O progresso deve estar visivel na tela inicial e durante a leitura.

O link deve ser:

- temporario ou revogavel;
- vinculado a um cliente e pacote;
- incapaz de expor dados de outros clientes;
- validado por Edge Function ou RPC segura;
- registrado com `ultimo_acesso_em`.

Formato sugerido de rota publica:

- `/blog-aprovacao/:token`
- ou `/artigos-preview/:token`

## 10. Como o cliente vera o pacote

A area publica do cliente deve ser simples, focada em leitura e aprovacao.

O cliente deve ver:

- primeira tela `Central de Revisao de Conteudo`;
- nome do cliente ou marca;
- mes de referencia;
- progresso geral do pacote;
- resumo executivo em duas colunas;
- card `Objetivo da Estrategia`;
- botao `Iniciar revisao`;
- estrategia do mes;
- lista lateral de artigos;
- conteudo completo do artigo selecionado;
- contador do artigo atual, por exemplo `Artigo 1 de 12`;
- status de cada artigo;
- data e hora de aprovacao dos artigos ja aprovados;
- comentarios ja enviados;
- botoes de decisao.

Botoes principais:

- `Aprovar artigo`
- `Revisar`
- `Comentar`

Comportamento esperado:

- Aprovar pode permitir comentario opcional.
- Revisar deve exigir comentario obrigatorio em modal.
- Reprovar pode existir internamente como status, mas na experiencia publica principal deve ser tratado dentro do fluxo `Revisar`, para reduzir atrito e manter a interface simples.
- Comentarios devem ficar vinculados ao artigo.
- Comentario livre pelo botao `Comentar` nao deve mudar status.
- A decisao deve atualizar o status visual imediatamente.
- A aprovacao deve salvar data e hora da decisao.
- Depois de aprovar ou enviar revisao, o sistema deve abrir automaticamente o proximo artigo pendente.
- Se nao houver proximo artigo pendente, mostrar tela de `Revisao concluida`.
- A sidebar deve continuar disponivel para reler artigos ja revisados.
- A barra fixa do artigo deve permanecer visivel durante a leitura, especialmente em artigos longos.

Tela final de revisao:

- Titulo: `Revisao concluida`.
- Mensagem curta confirmando que todos os artigos foram revisados.
- Resumo com totais aprovados, com ajuste solicitado e reprovados.
- Opcao para voltar a lista de artigos e reler qualquer conteudo.
- Opcao para copiar ou informar que a agencia ja recebeu os retornos.
- Bloco de briefing opcional para o proximo mes.

Briefing opcional apos conclusao:

- Deve aparecer depois da tela `Revisao concluida`.
- Texto sugerido: `Quer nos ajudar a preparar uma estrategia ainda melhor para o proximo mes? Leva menos de 2 minutos e e opcional.`
- Botoes:
  - `Personalizar estrategia`
  - `Agora nao`

Comportamento do botao `Agora nao`:

- Exibir mensagem confirmando que a equipe preparara a estrategia do proximo mes com base no projeto, desempenho e oportunidades de SEO.
- Nao bloquear a conclusao da revisao.

Comportamento do botao `Personalizar estrategia`:

- Abrir mini briefing com perguntas objetivas.
- Ao finalizar, salvar as sugestoes do cliente para aparecerem na area interna da agencia.

Perguntas do mini briefing:

- Existe algum servico, produto ou procedimento que voce gostaria de destacar no proximo mes?
- Existe alguma campanha, evento ou data importante?
- Tem algum assunto que seus clientes ou pacientes tem perguntado bastante?
- Existe alguma observacao para nossa equipe?

## 11. Status possiveis

Status dos artigos:

- `aguardando_aprovacao`
- `aprovado`
- `reprovado`
- `ajuste_solicitado`
- `revisado`
- `publicado`

Descricao dos status:

- `aguardando_aprovacao`: artigo enviado ao cliente, aguardando resposta.
- `aprovado`: cliente aprovou o conteudo.
- `reprovado`: cliente recusou o artigo e informou motivo.
- `ajuste_solicitado`: cliente clicou em `Revisar` e pediu alteracao.
- `revisado`: agencia ajustou o artigo depois de comentario.
- `publicado`: artigo foi publicado ou marcado como entregue final.

O status `rascunho` pode existir internamente antes do envio ao cliente, mas nao precisa aparecer como status principal para o cliente.

## 12. Cores recomendadas para status

As cores devem seguir visual premium, discreto e acessivel.

Sugestao:

- `aguardando_aprovacao`: azul suave, indicando fluxo em andamento.
- `aprovado`: verde controlado, sem brilho excessivo.
- `reprovado`: vermelho discreto, usado apenas como alerta.
- `ajuste_solicitado`: amarelo/ambar elegante, indicando atencao.
- `revisado`: roxo ou indigo suave, indicando nova versao.
- `publicado`: verde escuro ou teal, indicando conclusao.

Regras visuais:

- Usar cor como detalhe, nao como bloco chamativo.
- Badges devem ter fundo suave e texto legivel.
- Sempre combinar cor com texto, nunca depender apenas da cor.
- Manter contraste suficiente no tema escuro e no tema claro.

## 13. Como funcionara o comentario por artigo

Comentarios devem ser vinculados a cada artigo, nao apenas ao pacote.

Campos sugeridos:

- artigo_id
- pacote_id
- cliente_id
- autor_nome
- autor_tipo: `agencia` ou `cliente`
- mensagem
- origem: `crm` ou `link_magico`
- criado_em

Comportamento:

- Cliente comenta pela pagina publica.
- Agencia comenta pela area interna.
- Comentarios aparecem em ordem cronologica.
- Comentarios de ajuste devem ficar destacados.
- Um artigo pode ter varios comentarios.
- Comentarios devem continuar salvos no historico mesmo depois de aprovado.
- Comentarios enviados em `Revisar` devem ser obrigatorios.
- Comentarios simples pelo botao `Comentar` podem ser opcionais em relacao a mudanca de status.
- O comentario deve registrar se foi enviado durante aprovacao, revisao ou comentario livre.

## 14. Como funcionara o historico de aprovacoes

O historico deve registrar decisoes importantes por artigo.

Eventos sugeridos:

- artigo enviado para aprovacao;
- comentario criado;
- aprovado;
- reprovado;
- ajuste solicitado;
- revisado pela agencia;
- publicado;
- link magico acessado;
- link magico expirado ou revogado.
- fluxo avancou automaticamente para o proximo artigo;
- revisao do pacote concluida.
- briefing do proximo mes iniciado;
- briefing do proximo mes enviado;
- cliente optou por `Agora nao` no briefing.

Campos sugeridos:

- artigo_id
- pacote_id
- cliente_id
- evento
- status_anterior
- status_novo
- autor_nome
- autor_tipo
- origem
- observacao
- criado_em
- data_decisao

Esse historico ajuda a agencia a provar o fluxo de aprovacao e entender atrasos ou retrabalhos.

Resumo do historico ao concluir revisao:

- data e hora da conclusao;
- quantidade de artigos aprovados;
- quantidade de artigos enviados para revisao;
- comentarios enviados;
- sugestoes para o proximo mes, quando houver.

## 15. Como a agencia vera os retornos do cliente

Na area interna, a agencia deve ter uma leitura rapida do pacote:

- total de artigos;
- aguardando aprovacao;
- aprovados;
- com ajuste solicitado;
- reprovados;
- publicados;
- comentarios novos.
- sugestoes para o proximo mes.

Na lista de artigos:

- status por artigo;
- ultima interacao do cliente;
- quantidade de comentarios;
- data da decisao;
- data e hora da aprovacao quando aprovado;
- botao para abrir artigo.

Filtros sugeridos:

- mes;
- cliente;
- status;
- responsavel;
- comentarios pendentes;
- publicados ou nao publicados.

Quando o cliente solicitar ajuste, o artigo deve ganhar destaque visual e aparecer em uma lista de pendencias operacionais.

Card futuro `Proximo Planejamento` na ficha do cliente:

- Deve aparecer futuramente na area interna da agencia.
- Deve reunir as sugestoes enviadas no briefing opcional.
- Deve mostrar data de envio, pacote de origem e respostas do cliente.
- Deve ajudar a equipe a preparar a estrategia do proximo mes.
- Nao deve aparecer como item publico separado; e uma leitura interna para planejamento.

## 16. Ideia inicial de tabelas

Nao criar banco nesta etapa. Ideia para futuras migrations:

### `crm_blog_pacotes`

Guarda o pacote mensal de artigos.

Campos sugeridos:

- `id uuid primary key`
- `cliente_id uuid not null`
- `titulo text`
- `mes_referencia text not null`
- `objetivo text`
- `estrategia_editorial text`
- `publico_alvo text`
- `palavras_chave text`
- `tom_comunicacao text`
- `observacoes text`
- `briefing_proximo_mes_status text default 'nao_iniciado'`
- `briefing_proximo_mes_enviado_em timestamptz`
- `quantidade_prevista integer default 0`
- `quantidade_aprovada integer default 0`
- `quantidade_revisada integer default 0`
- `quantidade_ajuste_solicitado integer default 0`
- `quantidade_reprovada integer default 0`
- `status text default 'rascunho'`
- `responsavel text`
- `revisao_concluida_em timestamptz`
- `criado_por text`
- `criado_em timestamptz default now()`
- `atualizado_em timestamptz default now()`

### `crm_blog_artigos`

Guarda cada artigo individual.

Campos sugeridos:

- `id uuid primary key`
- `pacote_id uuid not null`
- `cliente_id uuid not null`
- `ordem integer default 0`
- `titulo text not null`
- `subtitulo text`
- `slug_sugerido text`
- `palavra_chave_principal text`
- `palavras_chave_secundarias text`
- `categoria text`
- `resumo text`
- `conteudo text`
- `meta_title text`
- `meta_description text`
- `cta text`
- `link_referencia text`
- `status text default 'aguardando_aprovacao'`
- `responsavel text`
- `data_prevista date`
- `aprovado_em timestamptz`
- `aprovado_por text`
- `reprovado_em timestamptz`
- `ajuste_solicitado_em timestamptz`
- `revisado_em timestamptz`
- `publicado_em timestamptz`
- `ultima_decisao_em timestamptz`
- `ultimo_comentario_cliente_em timestamptz`
- `criado_por text`
- `criado_em timestamptz default now()`
- `atualizado_em timestamptz default now()`

### `crm_blog_comentarios`

Guarda comentarios por artigo.

Campos sugeridos:

- `id uuid primary key`
- `artigo_id uuid not null`
- `pacote_id uuid not null`
- `cliente_id uuid not null`
- `autor_nome text`
- `autor_tipo text`
- `mensagem text not null`
- `origem text`
- `tipo_interacao text`
- `criado_em timestamptz default now()`

### `crm_blog_historico`

Guarda eventos de status e aprovacoes.

Campos sugeridos:

- `id uuid primary key`
- `artigo_id uuid`
- `pacote_id uuid not null`
- `cliente_id uuid not null`
- `evento text not null`
- `status_anterior text`
- `status_novo text`
- `autor_nome text`
- `autor_tipo text`
- `origem text`
- `observacao text`
- `criado_em timestamptz default now()`
- `data_decisao timestamptz`

### `crm_blog_briefings_proximo_mes`

Guarda sugestoes opcionais enviadas pelo cliente apos concluir a revisao.

Campos sugeridos:

- `id uuid primary key`
- `pacote_id uuid not null`
- `cliente_id uuid not null`
- `servico_produto_destaque text`
- `campanha_evento_data text`
- `perguntas_frequentes_clientes text`
- `observacoes_equipe text`
- `origem text default 'link_magico'`
- `enviado_em timestamptz default now()`
- `criado_em timestamptz default now()`

### `crm_blog_links_magicos`

Guarda tokens publicos de aprovacao.

Campos sugeridos:

- `id uuid primary key`
- `cliente_id uuid not null`
- `pacote_id uuid not null`
- `token_hash text not null`
- `escopo text default 'pacote'`
- `ativo boolean default true`
- `expira_em timestamptz`
- `criado_por text`
- `criado_em timestamptz default now()`
- `ultimo_acesso_em timestamptz`

## 17. Permissoes e seguranca

Permissoes internas sugeridas:

- `dono`: acesso total.
- `gestor`: acesso total ao modulo.
- `funcionario`: criar, editar e acompanhar artigos conforme permissao.
- `cliente`: nao acessa o CRM interno, apenas link magico.

Seguranca esperada:

- RLS para tabelas internas exigindo usuario ativo do CRM.
- Escrita interna liberada para usuarios autenticados e autorizados.
- Exclusoes devem ser restritas a `dono` e `gestor`.
- Link magico nao deve depender de login.
- Token deve ser aleatorio, longo e armazenado como hash.
- Pagina publica deve retornar apenas dados do pacote vinculado ao token.
- Comentarios publicos devem passar por validacao antes de gravar.
- Tokens devem poder expirar ou ser desativados.

## 18. Funcionamento do link magico

Fluxo tecnico recomendado:

1. Front interno solicita geracao de link para um pacote.
2. Sistema cria token publico aleatorio.
3. Sistema salva hash do token em `crm_blog_links_magicos`.
4. Link publico usa o token original na URL.
5. Pagina publica chama uma Edge Function ou RPC.
6. Funcao valida hash, expiracao e status ativo.
7. Se valido, retorna estrategia, artigos e comentarios permitidos.
8. Pagina publica mostra a Central de Revisao de Conteudo.
9. Ao clicar em `Iniciar revisao`, a pagina identifica o primeiro artigo pendente.
10. Cliente envia decisao pela mesma camada segura.
11. Funcao atualiza artigo, salva comentario quando houver e registra historico.
12. Funcao retorna o proximo artigo pendente ou o estado `revisao_concluida`.
13. Quando todos os artigos forem revisados, o pacote pode receber `revisao_concluida_em`.
14. Cliente pode responder briefing opcional para o proximo mes.
15. Funcao salva briefing e registra historico.

Motivo para usar Edge Function ou RPC:

- Evita expor tabelas diretamente para usuarios anonimos.
- Controla exatamente quais campos aparecem para o cliente.
- Permite regras diferentes para leitura e escrita publica.
- Mantem o CRM interno protegido.

## 19. Diferenca entre area interna da agencia e area publica do cliente

### Area interna da agencia

Foco em gestao, edicao e acompanhamento.

Deve permitir:

- criar pacote;
- editar estrategia;
- criar e editar artigos;
- reorganizar ordem;
- gerar link magico;
- acompanhar status;
- responder comentarios;
- marcar como revisado ou publicado;
- ver historico completo.

### Area publica do cliente

Foco em leitura, comentario e aprovacao.

Deve permitir:

- ver a tela inicial `Central de Revisao de Conteudo`;
- ver resumo executivo do pacote;
- ler estrategia do mes;
- navegar entre artigos;
- ler conteudo completo;
- comentar por artigo;
- aprovar;
- revisar com comentario obrigatorio;
- revisar em fluxo guiado artigo por artigo;
- acompanhar progresso geral do pacote;
- voltar pela sidebar para reler artigos ja revisados.
- enviar briefing opcional para o proximo mes.

Nao deve permitir:

- acessar menu do CRM;
- ver outros clientes;
- editar campos internos;
- excluir artigos;
- alterar ordem;
- acessar financeiro, tarefas ou dados administrativos.

## 20. Roadmap de implementacao em etapas pequenas para o Codex

### Etapa 1: especificacao e alinhamento

- Criar esta documentacao.
- Validar nomes, fluxo e escopo com o usuario.
- Nao alterar banco nem telas.

### Etapa 2: banco de dados

- Criar migrations para pacotes, artigos, comentarios, historico e links magicos.
- Usar `create table if not exists`.
- Usar indices por `cliente_id`, `pacote_id`, `mes_referencia` e `status`.
- Criar RLS para usuarios internos.
- Criar funcao segura para link magico.

### Etapa 3: estrutura do modulo

- Criar pasta `src/modules/blog`.
- Criar service do modulo.
- Criar constantes de status.
- Criar CSS proprio seguindo design system atual.
- Nao criar fluxo publico ainda.

### Etapa 4: area interna de pacotes

- Criar pagina interna `Blog/Artigos`.
- Listar pacotes por cliente e mes.
- Criar pacote mensal.
- Editar estrategia editorial.
- Mostrar resumo de status.

### Etapa 5: editor e leitura de artigos

- Criar editor de artigo.
- Criar leitura estilo documento.
- Criar sidebar lateral com estrategia e artigos.
- Permitir colar conteudo completo.
- Salvar artigos individualmente.

### Etapa 6: comentarios e status internos

- Criar comentarios por artigo.
- Criar historico de status.
- Permitir marcar como revisado e publicado.
- Destacar artigos com ajuste solicitado.

### Etapa 7: link magico

- Gerar link publico por pacote.
- Criar pagina publica sem menu do CRM.
- Validar token.
- Criar primeira tela `Central de Revisao de Conteudo`.
- Exibir resumo executivo em duas colunas.
- Exibir card `Objetivo da Estrategia`.
- Criar botao `Iniciar revisao`.
- Exibir estrategia, artigos e status.
- Criar fluxo guiado artigo por artigo.
- Exibir barra fixa com contador, titulo, progresso, status e acoes.
- Permitir aprovar, revisar e comentar.
- Abrir modal com comentario obrigatorio ao clicar em `Revisar`.
- Avancar automaticamente para o proximo artigo pendente depois de cada decisao.
- Mostrar tela final `Revisao concluida`.

### Etapa 8: briefing opcional do proximo mes

- Exibir chamada apos `Revisao concluida`.
- Criar botoes `Personalizar estrategia` e `Agora nao`.
- Mostrar mensagem de continuidade quando cliente clicar em `Agora nao`.
- Criar mini briefing com quatro perguntas.
- Salvar sugestoes do cliente.
- Registrar historico de envio.
- Preparar dados para o card interno `Proximo Planejamento`.

### Etapa 9: painel de retorno do cliente

- Mostrar comentarios recentes.
- Criar filtros por status.
- Criar indicadores de aprovacao.
- Permitir a agencia responder e reenviar.
- Criar card futuro `Proximo Planejamento` na ficha do cliente.

### Etapa 10: polimento visual

- Ajustar responsividade.
- Melhorar estados vazios.
- Padronizar badges.
- Refinar experiencia de leitura.
- Revisar microcopy.

### Etapa 11: automacoes futuras

- Integrar com tarefas recorrentes.
- Criar tarefa automaticamente para artigos com ajuste solicitado.
- Gerar pacote mensal a partir de clientes recorrentes.
- Exportar artigos aprovados.
- Criar importacao de `.docx` ou Google Docs, se necessario.

## Observacoes finais

O modulo Blog/Artigos deve ser tratado como um ambiente editorial dentro do CRM. Ele nao deve duplicar Instagram nem substituir tarefas, mas pode conversar com ambos futuramente.

O primeiro MVP deve priorizar organizacao, leitura, aprovacao e historico. Recursos como importacao automatica, IA, publicacao em CMS e integracoes externas devem vir depois que o fluxo manual estiver validado.
