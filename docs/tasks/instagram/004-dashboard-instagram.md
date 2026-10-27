# 004 - Dashboard Instagram

## 1. Objetivo da etapa

Criar a primeira tela interna do modulo Instagram para equipe da agencia.

## 2. O que deve ser implementado

- Criar pagina interna de Instagram vinculada ao cliente.
- Exibir header do perfil.
- Exibir resumo de conteudos e aprovacoes.
- Criar abas Feed, Reels e Resultados ainda com estrutura basica.
- Permitir voltar para a ficha do cliente.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/instagram/pages/InstagramDashboardPage.jsx`
- `src/modules/instagram/styles/instagram.css`
- `src/modules/instagram/services/instagramService.js`
- Shell/navegacao atual em `src/modules/leads/pages/CRMLeadsPage.jsx`, se houver rota interna.
- Possivelmente `src/components/layout/Topbar.jsx`, se titulo dinamico for necessario.

## 4. Banco de dados envolvido, se houver

- `crm_instagram_perfis`
- `crm_instagram_posts`

## 5. Componentes envolvidos

- `InstagramDashboardPage`
- `InstagramProfileHeader`
- `InstagramTabs`
- `InstagramStatusSummary`

## 6. Criterios de aceitacao

- Pagina abre a partir de cliente com Instagram ativo.
- Perfil e metricas basicas aparecem.
- Abas Feed, Reels e Resultados aparecem.
- Pagina respeita tema claro/escuro.
- Nenhum item do menu principal e criado sem aprovacao.

## 7. O que nao deve ser alterado

- Menu principal, exceto se aprovado.
- Financeiro.
- Operacional.
- Documentos.

## 8. Dependencias da etapa anterior

- Etapa 003 concluida.

## 9. Como testar

- Ativar Instagram em um cliente.
- Abrir dashboard.
- Conferir dados do perfil.
- Alternar abas.
- Testar cliente sem perfil e ver estado vazio adequado.

## 10. Quando considerar concluido

Quando existir uma tela interna navegavel e estavel para visualizar o perfil Instagram do cliente.
