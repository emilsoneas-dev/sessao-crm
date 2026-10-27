# 005 - Planejamento mensal

## 1. Objetivo da etapa

Permitir organizar conteudos Instagram por mes de referencia.

## 2. O que deve ser implementado

- Adicionar seletor de mes no dashboard Instagram.
- Filtrar posts/reels por mes.
- Permitir criar conteudo planejado para o mes escolhido.
- Exibir contadores do mes: total, aprovados, pendentes e ajustes.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/instagram/pages/InstagramDashboardPage.jsx`
- `src/modules/instagram/components/InstagramMonthSelector.jsx`
- `src/modules/instagram/components/InstagramPostForm.jsx`
- `src/modules/instagram/services/instagramService.js`
- `src/modules/instagram/styles/instagram.css`

## 4. Banco de dados envolvido, se houver

- `crm_instagram_posts`
- Campo esperado: `data_prevista`.
- Opcional futuro: `mes_referencia`.

## 5. Componentes envolvidos

- `InstagramMonthSelector`
- `InstagramPostForm`
- `InstagramStatusSummary`
- `InstagramPostGrid`

## 6. Criterios de aceitacao

- Usuario escolhe mes.
- Conteudos exibidos pertencem ao mes selecionado.
- Criacao de post/reel salva `data_prevista`.
- Contadores refletem apenas o mes atual.

## 7. O que nao deve ser alterado

- Tarefas recorrentes.
- Financeiro mensal.
- Arquivadas de tarefas.

## 8. Dependencias da etapa anterior

- Etapa 004 concluida.

## 9. Como testar

- Criar posts em meses diferentes.
- Trocar mes e confirmar filtragem.
- Conferir contadores.
- Confirmar que posts antigos nao desaparecem do banco.

## 10. Quando considerar concluido

Quando a equipe puder planejar e consultar conteudos Instagram por mes.
