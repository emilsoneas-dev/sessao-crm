# 012 - Polimento final

## 1. Objetivo da etapa

Refinar experiencia, textos, responsividade, seguranca e consistencia visual do modulo Instagram.

## 2. O que deve ser implementado

- Revisar CSS e UI do modulo.
- Padronizar textos, estados vazios, loading e erros.
- Revisar permissoes.
- Revisar responsividade.
- Revisar fluxo interno e publico.
- Atualizar documentacao final.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/instagram/styles/instagram.css`
- Componentes do modulo Instagram.
- `docs/modulos/instagram.md`
- `docs/RESUMO.md`
- Documentacao de rotas, banco e componentes, se necessario.

## 4. Banco de dados envolvido, se houver

Nenhuma nova tabela esperada. Apenas ajustes se alguma etapa anterior exigir.

## 5. Componentes envolvidos

- Todos os componentes do modulo Instagram.
- Possivelmente `Topbar` e `Sidebar`, se houver integracao visual aprovada.

## 6. Criterios de aceitacao

- Visual consistente com SaaS premium do CRM.
- Fluxo interno funciona de ponta a ponta.
- Link publico funciona em telas menores.
- Estados vazios orientam o usuario.
- Nao ha repeticao desnecessaria com Clientes, Tarefas ou Financeiro.

## 7. O que nao deve ser alterado

- Regras de negocio ja aprovadas.
- Estrutura de banco sem necessidade.
- Modulos existentes fora de ajustes visuais estritamente necessarios.

## 8. Dependencias da etapa anterior

- Etapas 001 a 010 concluidas.
- Etapa 011 apenas se Meta API tiver sido implementada.

## 9. Como testar

- Testar cliente sem Instagram.
- Testar cliente com Instagram ativo.
- Testar criacao e revisao de posts.
- Testar link magico.
- Testar aprovar, reprovar e solicitar ajuste.
- Testar tema claro/escuro.
- Testar mobile e desktop.

## 10. Quando considerar concluido

Quando o modulo parecer parte natural do CRM e estiver pronto para uso real pela agencia e pelos clientes.
