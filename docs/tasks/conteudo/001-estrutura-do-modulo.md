# 001 - Estrutura do modulo

## Objetivo

Criar a base tecnica do modulo Central de Revisao de Conteudo sem alterar funcionalidades existentes.

## Funcionalidades

- Criar estrutura de pastas do modulo.
- Definir constantes de status.
- Definir contratos basicos de dados.
- Criar service inicial vazio ou com funcoes placeholder seguras.
- Criar arquivo de estilos do modulo.
- Preparar export central do modulo.

## Arquivos que serao modificados

- `src/modules/conteudo/`
- `src/modules/conteudo/index.js`
- `src/modules/conteudo/constants.js`
- `src/modules/conteudo/contracts.js`
- `src/modules/conteudo/services/conteudoService.js`
- `src/modules/conteudo/styles/conteudo.css`
- `src/app/App.jsx`, somente se for necessario registrar rota vazia futura.

## Banco envolvido

Nenhum banco nesta etapa.

## Componentes envolvidos

- Nenhum componente funcional ainda.
- Apenas estrutura para componentes futuros.

## Criterios de aceitacao

- Pasta `src/modules/conteudo` criada.
- Arquivos base criados sem quebrar build.
- Nenhuma tela nova exposta ao usuario.
- Nenhuma chamada Supabase real ainda.

## O que NAO deve ser alterado

- Modulo Instagram.
- Clientes.
- Tarefas.
- Financeiro.
- Login e permissoes.
- Banco de dados.

## Dependencias

- `docs/modulos/blog-artigos.md` aprovado como especificacao base.

## Como testar

- Rodar `npm run build`.
- Confirmar que o CRM atual continua abrindo as rotas existentes.
- Confirmar que nenhuma nova funcionalidade aparece no menu.

## Quando considerar a etapa concluida

Quando a estrutura base existir, o build passar e nenhuma tela atual tiver sido alterada.
