# CRM Panorama Premium

Base premium do CRM Panorama criada em React + Vite + Supabase.

## O que já existe

- Login com Supabase Auth
- Funil de leads em Kanban
- Área de clientes convertidos
- Área de tarefas e entregas
- Configurações de usuários e permissões
- Convite de colaboradores por Edge Function
- Estrutura modular para crescer sem refazer tudo

## Como rodar localmente

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env` e preencha com seus dados do Supabase:

```txt
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
```

## Supabase

Rode as migrações na ordem:

```txt
supabase/migrations/001_leads_crm.sql
supabase/migrations/002_crm_security_users_tasks.sql
supabase/migrations/003_articles_tasks_recurring_finance.sql
supabase/migrations/004_instagram_module.sql
supabase/migrations/005_instagram_monthly_planning.sql
supabase/migrations/006_instagram_post_editor.sql
supabase/migrations/007_instagram_magic_link_preview.sql
```

Depois, cadastre pelo menos um usuário dono na tabela `crm_usuarios` com o mesmo e-mail usado no Supabase Auth.

Exemplo:

```sql
insert into public.crm_usuarios (nome, email, papel, ativo, convite_status)
values ('Seu Nome', 'seuemail@empresa.com', 'dono', true, 'ativo')
on conflict (email) do update
set papel = 'dono', ativo = true, atualizado_em = now();
```

## Edge Function de convites

A função `create-crm-user` depende do Supabase configurado e deve estar publicada para que o convite de colaboradores funcione.

```bash
supabase functions deploy create-crm-user
```

Configure também a variável `CRM_SITE_URL` no Supabase para apontar para a URL do CRM, por exemplo:

```txt
https://crm-panorama-tau.vercel.app
```

## Logo

Coloque sua logo em:

```txt
src/assets/img/logo-panorama.webp
```

Ou use o botão "Alterar logo" na sidebar. A imagem escolhida será salva no navegador via localStorage.
