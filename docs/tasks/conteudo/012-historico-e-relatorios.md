# 012 - Historico e relatorios

## Objetivo

Exibir para a agencia o historico de aprovacoes, comentarios e sugestoes recebidas dos clientes.

## Funcionalidades

- Mostrar historico por pacote.
- Mostrar eventos por artigo.
- Mostrar comentarios recentes.
- Exibir resumo de conclusao.
- Exibir sugestoes do briefing do proximo mes.
- Criar card `Proximo Planejamento` na ficha do cliente.
- Preparar filtros e indicadores.

## Arquivos que serao modificados

- `src/modules/conteudo/pages/ContentPackagePage.jsx`
- `src/modules/conteudo/components/ContentHistoryPanel.jsx`
- `src/modules/conteudo/components/NextPlanningCard.jsx`
- `src/modules/clients/components/ClientProfileTabsModal.jsx`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`

## Banco envolvido

- `crm_blog_historico`
- `crm_blog_comentarios`
- `crm_blog_briefings_proximo_mes`
- `crm_blog_artigos`
- `crm_blog_pacotes`

## Componentes envolvidos

- Painel de historico.
- Lista de comentarios.
- Card `Proximo Planejamento`.
- Indicadores de aprovacao.

## Criterios de aceitacao

- Agencia ve data/hora das decisoes.
- Agencia ve artigos aprovados e enviados para revisao.
- Comentarios ficam vinculados aos artigos.
- Sugestoes do proximo mes aparecem na area interna.
- Filtros basicos funcionam.

## O que NAO deve ser alterado

- Fluxo publico ja validado.
- Edicao de artigos fora do necessario.
- Modulos nao relacionados.

## Dependencias

- Etapa 011 concluida.

## Como testar

- Fazer revisao publica com aprovacoes e revisoes.
- Enviar briefing.
- Abrir pacote internamente.
- Verificar historico, comentarios e sugestoes.

## Quando considerar a etapa concluida

Quando a agencia conseguir acompanhar retornos e usar sugestoes no planejamento.
