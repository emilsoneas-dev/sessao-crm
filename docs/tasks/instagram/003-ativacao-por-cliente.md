# 003 - Ativacao por cliente

## 1. Objetivo da etapa

Permitir ativar o modulo Instagram a partir da ficha de um cliente existente.

## 2. O que deve ser implementado

- Adicionar entrada/acao `Ativar Instagram` na ficha do cliente.
- Criar perfil Instagram vinculado ao cliente quando nao existir.
- Exibir estado ativado quando ja houver perfil.
- Permitir abrir/gerenciar o perfil ativado.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/clients/components/ClientProfileTabsModal.jsx`
- `src/modules/clients/components/client-profile-tabs.css`
- `src/modules/instagram/services/instagramService.js`
- `src/modules/instagram/components/`

## 4. Banco de dados envolvido, se houver

- `crm_instagram_perfis`
- Relacao com `leads_formularios.id` por `cliente_id`.

## 5. Componentes envolvidos

- `ClientProfileTabsModal`
- Futuro componente `InstagramActivationCard`
- Futuro servico `createInstagramProfileForClient`

## 6. Criterios de aceitacao

- Cliente sem Instagram mostra `Ativar Instagram`.
- Cliente com Instagram mostra `Abrir Instagram` ou `Gerenciar Instagram`.
- Criacao nao duplica perfil ativo para o mesmo cliente.
- Feedback visual informa sucesso ou erro.

## 7. O que nao deve ser alterado

- Conversao de leads em clientes.
- Edicao geral do cliente.
- Tarefas recorrentes.
- Financeiro.

## 8. Dependencias da etapa anterior

- Etapa 002 com banco criado.

## 9. Como testar

- Abrir ficha de cliente ativo.
- Ativar Instagram.
- Reabrir ficha e confirmar estado ativado.
- Tentar ativar novamente e confirmar que nao duplica.
- Testar usuario sem permissao, se aplicavel.

## 10. Quando considerar concluido

Quando o cliente puder ter um perfil Instagram interno inicializado de forma segura e sem duplicidade.
