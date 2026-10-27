# 007 - Preview Instagram

## 1. Objetivo da etapa

Criar o "Espelho do Instagram" com visual de feed/reels para revisao interna.

## 2. O que deve ser implementado

- Criar grade visual semelhante a um perfil Instagram.
- Exibir Feed e Reels em abas separadas.
- Criar preview de post com imagem/video, legenda, data e status.
- Criar estado vazio profissional.

## 3. Arquivos ou areas que provavelmente serao modificados

- `src/modules/instagram/components/InstagramProfileMirror.jsx`
- `src/modules/instagram/components/InstagramPostCard.jsx`
- `src/modules/instagram/components/InstagramPostPreviewModal.jsx`
- `src/modules/instagram/styles/instagram.css`

## 4. Banco de dados envolvido, se houver

- `crm_instagram_posts`
- `crm_instagram_perfis`

## 5. Componentes envolvidos

- `InstagramProfileMirror`
- `InstagramPostCard`
- `InstagramPostPreviewModal`
- `InstagramProfileHeader`

## 6. Criterios de aceitacao

- Feed mostra apenas tipos de feed/carrossel.
- Reels mostra apenas reels.
- Preview apresenta legenda e status.
- Interface preserva identidade SaaS premium do CRM.

## 7. O que nao deve ser alterado

- Layout global de outras paginas.
- Kanban de leads.
- Kanban de clientes.
- Tarefas.

## 8. Dependencias da etapa anterior

- Etapa 005 concluida.
- Etapa 006 recomendada, mas nao obrigatoria.

## 9. Como testar

- Criar conteudos de tipos diferentes.
- Conferir separacao entre Feed e Reels.
- Abrir preview.
- Validar responsividade.

## 10. Quando considerar concluido

Quando a agencia conseguir revisar visualmente o perfil planejado do cliente.
