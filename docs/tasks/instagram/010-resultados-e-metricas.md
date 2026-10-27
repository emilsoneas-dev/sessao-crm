# 010 - Resultados e metricas

## 1. Objetivo da etapa

Criar a aba Resultados com metricas manuais ou simuladas para perfis e posts.

## 2. O que deve ser implementado

- Exibir cards de metricas do perfil.
- Exibir ranking de melhores posts/reels.
- Exibir graficos simples de alcance, engajamento e visualizacoes.
- Permitir entrada manual de metricas, se aprovado.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/instagram/components/InstagramResultsTab.jsx`
- `src/modules/instagram/components/InstagramMetricCard.jsx`
- `src/modules/instagram/services/instagramService.js`
- `src/modules/instagram/styles/instagram.css`

## 4. Banco de dados envolvido, se houver

- `crm_instagram_perfis`
- `crm_instagram_posts`
- Opcional futuro: tabela de snapshots de metricas.

## 5. Componentes envolvidos

- `InstagramResultsTab`
- `InstagramMetricCard`
- `InstagramSimpleChart`
- `InstagramPostRanking`

## 6. Criterios de aceitacao

- Resultados aparecem mesmo sem API da Meta.
- Dados manuais/simulados ficam identificados por `metricas_origem`.
- Cards e graficos seguem o padrao visual do CRM.
- Nao mistura resultado Instagram com financeiro.

## 7. O que nao deve ser alterado

- Financeiro.
- Visao Geral estrategica.
- Relatorios inexistentes.

## 8. Dependencias da etapa anterior

- Etapa 004 concluida.
- Etapa 007 recomendada.

## 9. Como testar

- Inserir metricas manuais.
- Conferir cards.
- Conferir ranking.
- Alterar mes/periodo, se existir filtro.
- Testar estado sem dados.

## 10. Quando considerar concluido

Quando a aba Resultados oferecer leitura util mesmo antes da API da Meta.
