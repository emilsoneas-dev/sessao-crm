# 001 - Estrutura do modulo Instagram

## 1. Objetivo da etapa

Preparar a organizacao tecnica do modulo Instagram no projeto, sem criar banco nem tela funcional ainda.

## 2. O que deve ser implementado

- Definir a estrutura de pastas do modulo.
- Criar arquivos base vazios ou placeholders tecnicos somente quando esta etapa for implementada.
- Definir constantes iniciais de status, tipos de conteudo e abas.
- Definir contratos de dados esperados para perfil, post, comentario e link magico.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/instagram/`
- `src/modules/instagram/pages/`
- `src/modules/instagram/components/`
- `src/modules/instagram/services/`
- `src/modules/instagram/styles/`
- Possivelmente `src/config/permissions.js`, se o modulo entrar no controle de permissao.

## 4. Banco de dados envolvido, se houver

Nenhum nesta etapa.

## 5. Componentes envolvidos

- Nenhum componente visual funcional nesta etapa.
- Planejar futuros componentes:
  - `InstagramDashboardPage`
  - `InstagramProfileHeader`
  - `InstagramPostGrid`
  - `InstagramApprovalPanel`

## 6. Criterios de aceitacao

- A estrutura planejada deve seguir o padrao de `src/modules`.
- Nenhuma funcionalidade existente deve mudar.
- Nenhuma rota deve ser ativada ainda.
- Nenhuma chamada ao Supabase deve ser criada ainda.

## 7. O que nao deve ser alterado

- Clientes.
- Leads.
- Tarefas.
- Financeiro.
- Supabase.
- Menu principal.
- Rotas existentes.

## 8. Dependencias da etapa anterior

Nenhuma. Esta e a primeira etapa.

## 9. Como testar

- Confirmar que o projeto continua com os mesmos arquivos funcionais.
- Confirmar que nenhum modulo atual mudou comportamento.
- Rodar build/lint somente se o ambiente local permitir.

## 10. Quando considerar concluido

Quando a estrutura tecnica do modulo estiver definida e pronta para receber banco e UI em etapas seguintes, sem impacto no CRM atual.
