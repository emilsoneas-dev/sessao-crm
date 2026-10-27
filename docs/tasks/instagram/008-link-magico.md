# 008 - Link magico

## 1. Objetivo da etapa

Criar a base segura para compartilhar o Espelho do Instagram com cliente externo sem login.

## 2. O que deve ser implementado

- Criar geracao de token/link magico.
- Criar Edge Function publica para validar token.
- Criar rota publica de aprovacao.
- Retornar apenas dados autorizados pelo token.

## 3. Arquivos ou areas que provavelmente serao modificados

- `supabase/functions/instagram-public-review/`
- `src/modules/instagram/pages/InstagramPublicReviewPage.jsx`
- `src/modules/instagram/services/instagramPublicService.js`
- `src/modules/instagram/services/instagramService.js`
- Shell/roteamento manual para reconhecer `/instagram/aprovacao/:token`.

## 4. Banco de dados envolvido, se houver

- `crm_instagram_links_magicos`
- `crm_instagram_perfis`
- `crm_instagram_posts`

## 5. Componentes envolvidos

- `InstagramPublicReviewPage`
- `InstagramProfileMirror` em modo publico.
- `InstagramPostPreviewModal` em modo publico.

## 6. Criterios de aceitacao

- Link gerado contem token nao previsivel.
- Token armazenado como hash no banco.
- Link expirado ou inativo nao retorna dados.
- Cliente externo nao precisa login.
- Dados de outros clientes nao aparecem.

## 7. O que nao deve ser alterado

- Login atual.
- RLS interna de usuarios.
- Paginas autenticadas existentes.

## 8. Dependencias da etapa anterior

- Etapa 002 concluida.
- Etapa 004 concluida.
- Etapa 007 recomendada.

## 9. Como testar

- Gerar link para cliente.
- Abrir em janela sem login.
- Testar token invalido.
- Testar token expirado.
- Confirmar que apenas posts daquele cliente aparecem.

## 10. Quando considerar concluido

Quando o cliente puder acessar uma revisao externa segura por token.
