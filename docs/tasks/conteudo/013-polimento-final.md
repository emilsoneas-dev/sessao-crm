# 013 - Polimento final

## Objetivo

Revisar visual, responsividade, microcopy e estabilidade do modulo antes do deploy final.

## Funcionalidades

- Padronizar textos.
- Revisar estados vazios.
- Ajustar badges de status.
- Melhorar responsividade.
- Revisar acessibilidade basica.
- Conferir fluxo interno e publico.
- Validar build e diff.

## Arquivos que serao modificados

- `src/modules/conteudo/styles/conteudo.css`
- Componentes do modulo `src/modules/conteudo/`
- Documentacao do modulo, se necessario.

## Banco envolvido

Nenhuma alteracao estrutural esperada.

## Componentes envolvidos

- Dashboard.
- Pacote mensal.
- Editor de artigos.
- Central interna.
- Pagina publica.
- Briefing.
- Historico.

## Criterios de aceitacao

- Build passa.
- `git diff --check` passa.
- Fluxo interno funciona ponta a ponta.
- Link magico funciona sem login.
- Revisao guiada funciona em desktop e tela menor.
- Textos estao claros e profissionais.

## O que NAO deve ser alterado

- Regras de negocio ja validadas.
- Tabelas ja criadas, exceto se bug real exigir.
- Modulos fora de conteudo.

## Dependencias

- Etapas 001 a 012 concluidas.

## Como testar

- Criar pacote.
- Criar artigos.
- Gerar link magico.
- Revisar todos os artigos.
- Enviar briefing.
- Ver historico internamente.
- Rodar `npm run build`.
- Rodar `git diff --check`.

## Quando considerar a etapa concluida

Quando o modulo estiver pronto para deploy, com fluxo validado e sem regressao aparente no CRM.
