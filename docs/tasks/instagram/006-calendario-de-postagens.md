# 006 - Calendario de postagens

## 1. Objetivo da etapa

Adicionar uma visualizacao calendario para posts e reels planejados.

## 2. O que deve ser implementado

- Criar modo calendario dentro do dashboard Instagram.
- Mostrar conteudos por `data_prevista`.
- Destacar status de aprovacao.
- Permitir abrir conteudo pelo calendario.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/instagram/components/InstagramCalendar.jsx`
- `src/modules/instagram/pages/InstagramDashboardPage.jsx`
- `src/modules/instagram/styles/instagram.css`

## 4. Banco de dados envolvido, se houver

- `crm_instagram_posts`
- Campos: `data_prevista`, `tipo`, `status_aprovacao`.

## 5. Componentes envolvidos

- `InstagramCalendar`
- `InstagramPostPreviewModal` ou painel equivalente.
- `InstagramViewToggle`

## 6. Criterios de aceitacao

- Calendario mostra o mes selecionado.
- Posts sem data aparecem em area separada ou alerta.
- Clicar em item abre detalhes.
- Status fica claro visualmente sem poluir a tela.

## 7. O que nao deve ser alterado

- Calendario de tarefas.
- Modulo Operacional.
- Regras de financeiro.

## 8. Dependencias da etapa anterior

- Etapa 005 concluida.

## 9. Como testar

- Criar posts com datas diferentes.
- Conferir exibicao no calendario.
- Testar post sem data.
- Abrir item pelo calendario.

## 10. Quando considerar concluido

Quando o calendario Instagram funcionar como uma leitura complementar ao grid mensal.
