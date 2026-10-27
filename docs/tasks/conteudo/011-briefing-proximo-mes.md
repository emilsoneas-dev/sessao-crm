# 011 - Briefing proximo mes

## Objetivo

Adicionar briefing opcional apos a conclusao da revisao para coletar sugestoes do cliente para o proximo mes.

## Funcionalidades

- Exibir chamada apos `Revisao concluida`.
- Mostrar texto: `Quer nos ajudar a preparar uma estrategia ainda melhor para o proximo mes? Leva menos de 2 minutos e e opcional.`
- Botao `Personalizar estrategia`.
- Botao `Agora nao`.
- Mensagem de continuidade quando escolher `Agora nao`.
- Mini briefing com quatro perguntas.
- Salvar sugestoes para area interna.
- Preparar card futuro `Proximo Planejamento`.

## Arquivos que serao modificados

- `src/modules/conteudo/pages/ContentMagicReviewPage.jsx`
- `src/modules/conteudo/components/NextMonthBriefing.jsx`
- `src/modules/conteudo/components/ReviewCompletedState.jsx`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`

## Banco envolvido

- `crm_blog_briefings_proximo_mes`
- `crm_blog_pacotes`
- `crm_blog_historico`

## Componentes envolvidos

- Estado de revisao concluida.
- Mini formulario de briefing.
- Mensagem `Agora nao`.
- Card interno futuro.

## Criterios de aceitacao

- Briefing aparece somente apos todos os artigos revisados.
- `Agora nao` nao bloqueia conclusao.
- `Personalizar estrategia` abre perguntas.
- Respostas sao salvas.
- Agencia consegue ver sugestoes futuramente.

## O que NAO deve ser alterado

- Logica de aprovacao de artigos.
- Link magico do Instagram.
- Pacotes mensais existentes.

## Dependencias

- Etapa 010 concluida.

## Como testar

- Concluir revisao publica.
- Clicar em `Agora nao`.
- Reabrir e testar `Personalizar estrategia`.
- Enviar respostas e verificar persistencia no banco.

## Quando considerar a etapa concluida

Quando sugestoes opcionais forem coletadas e salvas apos a revisao.
